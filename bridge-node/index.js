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
const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  enableReadyCheck: false,
  commandTimeout: 2000,
  connectTimeout: 2000,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => Math.min(times * 500, 2000),
  lazyConnect: false,
});

redis.on("error", (err) => {
  console.warn("[Bridge Redis Warning]:", err.message);
});

const trackedKeys = new Set();

// Helper to format key info
async function getKeyInfo(key) {
  let type = "string";
  let ttl = -1;
  try {
    type = await redis.type(key);
  } catch (_) {}
  try {
    ttl = await redis.ttl(key);
  } catch (_) {}
  return { key, type, ttl };
}

// ---------- REST API ----------
// List all keys with type & ttl
app.get("/api/keys", async (_, res) => {
  try {
    let keys = [];
    try {
      keys = await redis.keys("*");
    } catch (_) {
      keys = Array.from(trackedKeys);
    }
    const info = await Promise.all(keys.map(getKeyInfo));
    res.json(info);
  } catch (e) {
    res.json([]);
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
    trackedKeys.add(key);
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
    trackedKeys.delete(key);
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
  const metric = {
    total_keys: "0",
    used_memory_human: "1.2M",
    total_commands_processed: "1",
    connected_clients: "1",
  };
  try {
    const infoRaw = await redis.info(); // returns bulk string
    const lines = infoRaw.split("\n");
    for (const line of lines) {
      if (line.startsWith("#")) continue;
      const [k, v] = line.split(":");
      if (!k || !v) continue;
      if (k === "total_commands_processed" || k === "connected_clients" || k === "used_memory_human") {
        metric[k] = v.trim();
      }
    }
  } catch (_) {
    // INFO not supported by backend yet, use defaults
  }

  try {
    const keyCount = (await redis.dbsize()).toString();
    metric["total_keys"] = keyCount;
  } catch (_) {
    try {
      const keys = await redis.keys("*");
      metric["total_keys"] = keys.length.toString();
    } catch (_) {}
  }

  res.json(metric);
});

// HTTP POST /api/cmd endpoint (direct fallback for terminal)
app.post("/api/cmd", async (req, res) => {
  try {
    const { cmd } = req.body;
    if (!Array.isArray(cmd) || cmd.length === 0) {
      return res.status(400).json({ error: "Empty command" });
    }
    if (cmd.length > 1) {
      const op = cmd[0].toUpperCase();
      if (op === "SET") trackedKeys.add(cmd[1]);
      if (op === "DEL") trackedKeys.delete(cmd[1]);
    }
    const resp = await redis.call(cmd[0], ...cmd.slice(1));
    res.json({ resp });
  } catch (e) {
    console.error("[Bridge HTTP Cmd Error]:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ---------- WebSocket for raw terminal ----------
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", ws => {
  console.log("[Bridge WS] Terminal client connected");
  ws.on("message", async data => {
    try {
      const { cmd } = JSON.parse(data.toString());
      if (!Array.isArray(cmd) || cmd.length === 0) {
        ws.send(JSON.stringify({ error: "Empty command" }));
        return;
      }
      console.log("[Bridge WS] Executing command:", cmd.join(" "));
      if (cmd.length > 1) {
        const op = cmd[0].toUpperCase();
        if (op === "SET") trackedKeys.add(cmd[1]);
        if (op === "DEL") trackedKeys.delete(cmd[1]);
      }
      const resp = await redis.call(cmd[0], ...cmd.slice(1));
      ws.send(JSON.stringify({ resp }));
    } catch (e) {
      console.error("[Bridge WS Error]:", e.message);
      const msg = e.message.includes("timed out") || e.message.includes("Connection is closed")
        ? "Timeout or connection refused: mini_redis.exe is not reachable on 127.0.0.1:6379"
        : e.message;
      ws.send(JSON.stringify({ error: msg }));
    }
  });
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`[Bridge] HTTP & WS listening on http://localhost:${PORT}`);
});

