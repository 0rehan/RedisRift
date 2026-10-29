#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <cstring>
#include <thread>
#include <chrono>
#include <atomic>

#ifdef _WIN32
    #define WIN32_LEAN_AND_MEAN
    #include <winsock2.h>
    #include <ws2tcpip.h>
    #pragma comment(lib, "ws2_32.lib")
    typedef SOCKET socket_t;
    #define IS_INVALID_SOCKET(s) ((s) == INVALID_SOCKET)
    #define CLOSE_SOCKET(s) closesocket(s)
#else
    #include <unistd.h>
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    typedef int socket_t;
    #define IS_INVALID_SOCKET(s) ((s) < 0)
    #define CLOSE_SOCKET(s) close(s)
#endif

#include "RespParser.hpp"
#include "KeyValueStore.hpp"
#include "ThreadPool.hpp"

#define PORT 6379
#define BUFFER_SIZE 4096

// Command handler logic
std::string processCommand(const std::vector<std::string>& tokens, KeyValueStore& store) {
    if (tokens.empty()) return RespParser::serializeError("ERR empty command");

    std::string cmd = tokens[0];
    std::transform(cmd.begin(), cmd.end(), cmd.begin(), ::toupper);

    if (cmd == "PING") {
        if (tokens.size() >= 2) {
            return RespParser::serializeBulkString(tokens[1]);
        }
        return RespParser::serializeSimpleString("PONG");
    } 
    else if (cmd == "ECHO") {
        if (tokens.size() < 2) {
            return RespParser::serializeError("ERR wrong number of arguments for 'echo' command");
        }
        return RespParser::serializeBulkString(tokens[1]);
    } 
    else if (cmd == "SET") {
        if (tokens.size() < 3) {
            return RespParser::serializeError("ERR wrong number of arguments for 'set' command");
        }
        long long ttlMs = -1;
        if (tokens.size() >= 5) {
            std::string opt = tokens[3];
            std::transform(opt.begin(), opt.end(), opt.begin(), ::toupper);
            try {
                if (opt == "PX") {
                    ttlMs = std::stoll(tokens[4]);
                } else if (opt == "EX") {
                    ttlMs = std::stoll(tokens[4]) * 1000;
                } else {
                    return RespParser::serializeError("ERR syntax error");
                }
            } catch (...) {
                return RespParser::serializeError("ERR value is not an integer or out of range");
            }
        }
        store.set(tokens[1], tokens[2], ttlMs);
        store.appendToAof(tokens);
        return RespParser::serializeSimpleString("OK");
    } 
    else if (cmd == "GET") {
        if (tokens.size() < 2) {
            return RespParser::serializeError("ERR wrong number of arguments for 'get' command");
        }
        std::string val;
        if (store.get(tokens[1], val)) {
            return RespParser::serializeBulkString(val);
        }
        return RespParser::serializeNull();
    } 
    else if (cmd == "DEL") {
        if (tokens.size() < 2) {
            return RespParser::serializeError("ERR wrong number of arguments for 'del' command");
        }
        bool deleted = store.del(tokens[1]);
        if (deleted) store.appendToAof(tokens);
        return RespParser::serializeInteger(deleted ? 1 : 0);
    } 
    else if (cmd == "EXPIRE") {
        if (tokens.size() < 3) {
            return RespParser::serializeError("ERR wrong number of arguments for 'expire' command");
        }
        long long seconds = 0;
        try {
            seconds = std::stoll(tokens[2]);
        } catch (...) {
            return RespParser::serializeError("ERR value is not an integer or out of range");
        }
        bool res = store.expire(tokens[1], seconds * 1000);
        if (res) store.appendToAof(tokens);
        return RespParser::serializeInteger(res ? 1 : 0);
    }

    return RespParser::serializeError("ERR unknown command '" + tokens[0] + "'");
}

// Client socket handling function with TCP stream buffering & pipelining support
void handleClient(socket_t clientSocket, KeyValueStore& store) {
    char buffer[BUFFER_SIZE];
    std::string clientBuffer;

    while (true) {
        int bytesRead = recv(clientSocket, buffer, sizeof(buffer), 0);
        if (bytesRead <= 0) break; // Client disconnected or error

        clientBuffer.append(buffer, static_cast<size_t>(bytesRead));

        // Process all complete commands in buffer (pipelining & stream framing)
        std::vector<std::string> tokens;
        while (RespParser::parseCommand(clientBuffer, tokens)) {
            std::string response = processCommand(tokens, store);
            int bytesSent = send(clientSocket, response.c_str(), static_cast<int>(response.length()), 0);
            if (bytesSent <= 0) {
                CLOSE_SOCKET(clientSocket);
                return;
            }
        }
    }
    CLOSE_SOCKET(clientSocket);
}

int main() {
#ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        std::cerr << "Failed to initialize Winsock.\n";
        return 1;
    }
#endif

    KeyValueStore store;

    // Step 1: Launch background thread for Active TTL Eviction
    std::thread evictionThread([&store]() {
        while (true) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
            store.activeEvictionPass();
        }
    });
    evictionThread.detach();

    // Step 2: Initialize Thread Pool (supporting high connection concurrency)
    size_t workerCount = std::max(16u, std::thread::hardware_concurrency() * 4);
    ThreadPool pool(workerCount);

    // Step 3: Socket Listener setup
    socket_t serverFd = socket(AF_INET, SOCK_STREAM, 0);
    if (IS_INVALID_SOCKET(serverFd)) {
        std::cerr << "Failed to create socket.\n";
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    int opt = 1;
    setsockopt(serverFd, SOL_SOCKET, SO_REUSEADDR, reinterpret_cast<const char*>(&opt), sizeof(opt));

    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);

    if (bind(serverFd, reinterpret_cast<struct sockaddr*>(&address), sizeof(address)) < 0) {
        std::cerr << "Bind failed on port " << PORT << "\n";
        CLOSE_SOCKET(serverFd);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    if (listen(serverFd, 128) < 0) {
        std::cerr << "Listen failed.\n";
        CLOSE_SOCKET(serverFd);
#ifdef _WIN32
        WSACleanup();
#endif
        return 1;
    }

    std::cout << "[Mini-Redis] Server listening on port " << PORT << "...\n";

    // Step 4: Main Event Accept Loop
    while (true) {
        sockaddr_in clientAddr{};
#ifdef _WIN32
        int addrLen = sizeof(clientAddr);
#else
        socklen_t addrLen = sizeof(clientAddr);
#endif
        socket_t clientSocket = accept(serverFd, reinterpret_cast<struct sockaddr*>(&clientAddr), &addrLen);
        if (IS_INVALID_SOCKET(clientSocket)) continue;

        // Dispatch connection processing to worker thread
        pool.enqueue([clientSocket, &store]() {
            handleClient(clientSocket, store);
        });
    }

    CLOSE_SOCKET(serverFd);
#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}
