#ifndef KEY_VALUE_STORE_HPP
#define KEY_VALUE_STORE_HPP

#include <string>
#include <unordered_map>
#include <shared_mutex>
#include <mutex>
#include <chrono>
#include <fstream>
#include <iostream>
#include <algorithm>
#include "RespParser.hpp"

struct ValueEntry {
    std::string value;
    long long expireAtMs = -1;
};

class KeyValueStore {
private:
    std::unordered_map<std::string, ValueEntry> store;
    mutable std::shared_mutex rwLock;
    std::mutex aofMutex;
    std::ofstream aofStream;
    const std::string aofFilename = "appendonly.aof";

    long long getCurrentTimeMs() const {
        return std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();
    }

    bool isExpiredInternal(const ValueEntry& entry) const {
        if (entry.expireAtMs == -1) return false;
        return getCurrentTimeMs() >= entry.expireAtMs;
    }

public:
    KeyValueStore() {
        // Replay any existing AOF log before opening file for appending
        replayAof();
        std::lock_guard<std::mutex> lock(aofMutex);
        aofStream.open(aofFilename, std::ios::app | std::ios::out | std::ios::binary);
    }

    ~KeyValueStore() {
        std::lock_guard<std::mutex> lock(aofMutex);
        if (aofStream.is_open()) {
            aofStream.flush();
            aofStream.close();
        }
    }

    void appendToAof(const std::vector<std::string>& tokens) {
        if (tokens.empty()) return;
        std::lock_guard<std::mutex> lock(aofMutex);
        if (!aofStream.is_open()) return;

        aofStream << "*" << tokens.size() << "\r\n";
        for (const auto& token : tokens) {
            aofStream << "$" << token.length() << "\r\n" << token << "\r\n";
        }
        aofStream.flush();
    }

    void set(const std::string& key, const std::string& val, long long ttlMs = -1) {
        std::unique_lock<std::shared_mutex> lock(rwLock);
        long long exp = (ttlMs > 0) ? (getCurrentTimeMs() + ttlMs) : -1;
        store[key] = {val, exp};
    }

    bool get(const std::string& key, std::string& outVal) {
        std::shared_lock<std::shared_mutex> lock(rwLock);
        auto it = store.find(key);
        if (it == store.end()) return false;

        if (isExpiredInternal(it->second)) {
            lock.unlock();
            // Re-acquire under unique write lock and double check to prevent TOCTOU race
            std::unique_lock<std::shared_mutex> writeLock(rwLock);
            auto it2 = store.find(key);
            if (it2 != store.end() && isExpiredInternal(it2->second)) {
                store.erase(it2);
            }
            return false;
        }

        outVal = it->second.value;
        return true;
    }

    bool del(const std::string& key) {
        std::unique_lock<std::shared_mutex> lock(rwLock);
        return store.erase(key) > 0;
    }

    bool expire(const std::string& key, long long ttlMs) {
        std::unique_lock<std::shared_mutex> lock(rwLock);
        auto it = store.find(key);
        if (it == store.end() || isExpiredInternal(it->second)) return false;
        it->second.expireAtMs = getCurrentTimeMs() + ttlMs;
        return true;
    }

    void activeEvictionPass() {
        std::unique_lock<std::shared_mutex> lock(rwLock);
        long long now = getCurrentTimeMs();
        for (auto it = store.begin(); it != store.end(); ) {
            if (it->second.expireAtMs != -1 && now >= it->second.expireAtMs) {
                it = store.erase(it);
            } else {
                ++it;
            }
        }
    }

    void replayAof() {
        {
            std::lock_guard<std::mutex> lock(aofMutex);
            if (aofStream.is_open()) {
                aofStream.flush();
            }
        }

        std::ifstream inFile(aofFilename, std::ios::binary);
        if (!inFile.is_open()) return;

        std::string content((std::istreambuf_iterator<char>(inFile)),
                             std::istreambuf_iterator<char>());
        inFile.close();

        std::vector<std::string> tokens;
        while (RespParser::parseCommand(content, tokens)) {
            if (tokens.empty()) continue;

            std::string cmd = tokens[0];
            std::transform(cmd.begin(), cmd.end(), cmd.begin(), ::toupper);

            if (cmd == "SET" && tokens.size() >= 3) {
                long long ttlMs = -1;
                if (tokens.size() >= 5) {
                    std::string opt = tokens[3];
                    std::transform(opt.begin(), opt.end(), opt.begin(), ::toupper);
                    try {
                        if (opt == "PX") ttlMs = std::stoll(tokens[4]);
                        else if (opt == "EX") ttlMs = std::stoll(tokens[4]) * 1000;
                    } catch (...) {
                        ttlMs = -1;
                    }
                }
                set(tokens[1], tokens[2], ttlMs);
            } else if (cmd == "DEL" && tokens.size() >= 2) {
                del(tokens[1]);
            } else if (cmd == "EXPIRE" && tokens.size() >= 3) {
                try {
                    long long seconds = std::stoll(tokens[2]);
                    expire(tokens[1], seconds * 1000);
                } catch (...) {}
            }
        }
        std::cout << "[AOF] Replayed startup persistence successfully.\n";
    }
};

#endif
