# RedisRift

A fast, multithreaded, in-memory key-value database built in C++17 implementing the Redis Serialization Protocol (RESP).

## Architecture & Features

- **RESP Parser (`RespParser.hpp`)**: Binary-safe parser supporting bulk strings with arbitrary binary data/newlines, null values, and interactive inline commands.
- **In-Memory Store (`KeyValueStore.hpp`)**: Concurrent thread-safe key-value store using reader-writer locks (`std::shared_mutex`), lazy expiration check on access, and a background eviction thread for active expiration passes.
- **AOF Persistence**: Append-Only File (`appendonly.aof`) logging for mutation commands (`SET`, `DEL`, `EXPIRE`) with automated replay on server startup.
- **Multithreaded Server (`ThreadPool.hpp`, `main.cpp`)**: TCP socket listener with worker thread pool dispatching, stream framing accumulator, and pipelining support.
- **Cross-Platform**: Compatible with both Windows (Winsock2) and Linux/macOS (POSIX sockets).

## Supported Commands

| Command | Syntax | Description |
|---|---|---|
| `PING` | `PING [message]` | Tests connection liveness or echoes custom message |
| `ECHO` | `ECHO message` | Echoes the provided bulk string message |
| `SET` | `SET key value [EX seconds \| PX milliseconds]` | Stores a string key-value pair with optional TTL |
| `GET` | `GET key` | Retrieves the value of a key (or null if not found/expired) |
| `DEL` | `DEL key` | Removes a key from the database |
| `EXPIRE` | `EXPIRE key seconds` | Sets a timeout on a key in seconds |

## Building

### Requirements
- C++17 compliant compiler (GCC 9+, Clang 10+, or MSVC 2019+)
- CMake 3.14+

### Compilation
```bash
mkdir build
cd build
cmake ..
cmake --build .
```

### Running
```bash
./mini_redis
# Or on Windows:
.\mini_redis.exe
```

Connect using standard Redis clients:
```bash
redis-cli -p 6379
```
Or via netcat / telnet:
```bash
nc localhost 6379
```

A fast, multithreaded, in-memory key-value database built in C++17 implementing the Redis Serialization Protocol (RESP).

## Architecture & Features

- **RESP Parser (`RespParser.hpp`)**: Binary-safe parser supporting bulk strings with arbitrary binary data/newlines, null values, and interactive inline commands.
- **In-Memory Store (`KeyValueStore.hpp`)**: Concurrent thread-safe key-value store using reader-writer locks (`std::shared_mutex`), lazy expiration check on access, and a background eviction thread for active expiration passes.
- **AOF Persistence**: Append-Only File (`appendonly.aof`) logging for mutation commands (`SET`, `DEL`, `EXPIRE`) with automated replay on server startup.
- **Multithreaded Server (`ThreadPool.hpp`, `main.cpp`)**: TCP socket listener with worker thread pool dispatching, stream framing accumulator, and pipelining support.
- **Cross-Platform**: Compatible with both Windows (Winsock2) and Linux/macOS (POSIX sockets).

## Supported Commands

| Command | Syntax | Description |
|---|---|---|
| `PING` | `PING [message]` | Tests connection liveness or echoes custom message |
| `ECHO` | `ECHO message` | Echoes the provided bulk string message |
| `SET` | `SET key value [EX seconds \| PX milliseconds]` | Stores a string key-value pair with optional TTL |
| `GET` | `GET key` | Retrieves the value of a key (or null if not found/expired) |
| `DEL` | `DEL key` | Removes a key from the database |
| `EXPIRE` | `EXPIRE key seconds` | Sets a timeout on a key in seconds |

## Building

### Requirements
- C++17 compliant compiler (GCC 9+, Clang 10+, or MSVC 2019+)
- CMake 3.14+

### Compilation
```bash
mkdir build
cd build
cmake ..
cmake --build .
```

### Running
```bash
./mini_redis
# Or on Windows:
.\mini_redis.exe
```

Connect using standard Redis clients:
```bash
redis-cli -p 6379
```
Or via netcat / telnet:
```bash
nc localhost 6379
```
