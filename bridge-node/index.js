// bridge-node/index.js
// Minimal Express + ioredis bridge exposing REST+WebSocket for RedisRift
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const app = express();
app.use(cors());
app.use(express.json());

// Connect to the RedisRift server (static binary listening on 6379)
const redis = new Redis({ host: "127.0.0.1", port: 6379 });

// Helper to format key info
async function getKeyInfo(key) {
  const [type, ttl] = await Promise.all([redis.type(key), redis.ttl(key)]);
  return { key, type, ttl };
}

// ---------- REST API ----------
// List all keys with type & ttl
app.get("/api/keys", async (_, res) => {
  try {
    const keys = await redis.keys("*");
    const info = await Promise.all(keys.map(getKeyInfo));
    res.json(info);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Get a single key's value
app.get("/api/key/:key", async (req, res) => {
  const { key } = req.params;
  try {
    const type = await redis.type(key);
    let value;
    if (type === "string") value = await redis.get(key);
    else if (type === "list") value = await redis.lrange(key, 0, -1);
    else if (type === "set") value = await redis.smembers(key);
    else if (type === "hash") value = await redis.hgetall(key);
    else if (type === "zset") value = await redis.zrange(key, 0, -1, "WITHSCORES");
    else value = null;
    res.json({ key, type, value });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Create/Update a key (SET for strings, RPUSH for lists, etc.)
app.post("/api/key/:key", async (req, res) => {
  const { key } = req.params;
  const { type, value, ttl } = req.body; // type optional – default string
  try {
    if (type && type !== "string") {
      // basic handling for list, set, hash; extend as needed
      if (type === "list") await redis.rpush(key, ...(Array.isArray(value) ? value : [value]));
      else if (type === "set") await redis.sadd(key, ...(Array.isArray(value) ? value : [value]));
      else if (type === "hash") await redis.hmset(key, value);
    } else {
      await redis.set(key, value);
    }
    if (typeof ttl === "number" && ttl > 0) await redis.expire(key, ttl);
    const info = await getKeyInfo(key);
    res.json(info);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Delete a key
app.delete("/api/key/:key", async (req, res) => {
  const { key } = req.params;
  try {
    await redis.del(key);
    res.json({ deleted: key });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Refresh TTL of a key
app.post("/api/expire/:key", async (req, res) => {
  const { key } = req.params;
  const { ttl } = req.body; // ttl in seconds
  try {
    const ok = await redis.expire(key, ttl);
    const info = await getKeyInfo(key);
    res.json({ ok, info });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Server metrics – expose INFO or a custom summary
app.get("/api/metrics", async (_, res) => {
  try {
    const infoRaw = await redis.info(); // returns bulk string
    // Parse a few useful fields
    const lines = infoRaw.split("\n");
    const metric = {};
    for (const line of lines) {
      if (line.startsWith("#")) continue;
      const [k, v] = line.split(":");
      if (!k || !v) continue;
      if (k === "total_commands_processed" || k === "connected_clients" || k === "used_memory_human") {
        metric[k] = v.trim();
      }
    }
    // Also total key count
    const keyCount = (await redis.dbsize()).toString();
    metric["total_keys"] = keyCount;
    res.json(metric);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ---------- WebSocket for raw terminal ----------
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", ws => {
  ws.on("message", async data => {
    try {
      // Expect JSON: { cmd: ["GET","mykey"] }
      const { cmd } = JSON.parse(data.toString());
      const resp = await redis.call(...cmd);
      ws.send(JSON.stringify({ resp }));
    } catch (e) {
      ws.send(JSON.stringify({ error: e.message }));
    }
  });
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`[Bridge] HTTP & WS listening on http://localhost:${PORT}`);
});

