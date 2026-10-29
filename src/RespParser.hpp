#ifndef RESP_PARSER_HPP
#define RESP_PARSER_HPP

#include <string>
#include <vector>
#include <sstream>
#include <iostream>

class RespParser {
public:
    // Parses a single RESP or inline command from buffer, consuming the parsed bytes.
    // Returns true if a complete command was parsed, false if more data is needed or input is invalid.
    static bool parseCommand(std::string& buffer, std::vector<std::string>& outTokens) {
        outTokens.clear();
        if (buffer.empty()) return false;

        // RESP Array Format: *<count>\r\n$<len>\r\n<data>\r\n...
        if (buffer[0] == '*') {
            size_t firstCrlf = buffer.find("\r\n");
            if (firstCrlf == std::string::npos) {
                return false; // Incomplete header, wait for more data
            }

            int count = 0;
            try {
                count = std::stoi(buffer.substr(1, firstCrlf - 1));
            } catch (...) {
                // Invalid array header, discard corrupt header line
                buffer.erase(0, firstCrlf + 2);
                return false;
            }

            if (count <= 0) {
                buffer.erase(0, firstCrlf + 2);
                return true;
            }

            size_t cursor = firstCrlf + 2;
            std::vector<std::string> tempTokens;
            tempTokens.reserve(count);

            for (int i = 0; i < count; ++i) {
                if (cursor >= buffer.size()) return false; // Need more bytes

                if (buffer[cursor] == '$') {
                    size_t lenCrlf = buffer.find("\r\n", cursor);
                    if (lenCrlf == std::string::npos) return false;

                    int strLen = 0;
                    try {
                        strLen = std::stoi(buffer.substr(cursor + 1, lenCrlf - (cursor + 1)));
                    } catch (...) {
                        buffer.erase(0, lenCrlf + 2);
                        return false;
                    }

                    if (strLen == -1) {
                        tempTokens.push_back("");
                        cursor = lenCrlf + 2;
                    } else if (strLen < -1) {
                        buffer.erase(0, lenCrlf + 2);
                        return false;
                    } else {
                        size_t dataStart = lenCrlf + 2;
                        size_t dataEnd = dataStart + static_cast<size_t>(strLen);
                        if (buffer.size() < dataEnd + 2) {
                            return false; // Wait for full bulk string data + \r\n
                        }
                        tempTokens.push_back(buffer.substr(dataStart, strLen));
                        cursor = dataEnd + 2; // Move past data and \r\n
                    }
                } else {
                    size_t nextCrlf = buffer.find("\r\n", cursor);
                    if (nextCrlf == std::string::npos) return false;
                    tempTokens.push_back(buffer.substr(cursor + 1, nextCrlf - (cursor + 1)));
                    cursor = nextCrlf + 2;
                }
            }

            outTokens = std::move(tempTokens);
            buffer.erase(0, cursor);
            return true;
        } else {
            // Inline command fallback (e.g. "PING\r\n" or "SET foo bar\n")
            size_t crlf = buffer.find("\r\n");
            size_t lf = buffer.find("\n");
            size_t lineEnd = std::string::npos;
            size_t delLen = 0;

            if (crlf != std::string::npos && (lf == std::string::npos || crlf <= lf)) {
                lineEnd = crlf;
                delLen = 2;
            } else if (lf != std::string::npos) {
                lineEnd = lf;
                delLen = 1;
            } else {
                return false; // Incomplete line
            }

            std::string line = buffer.substr(0, lineEnd);
            buffer.erase(0, lineEnd + delLen);

            std::istringstream iss(line);
            std::string token;
            while (iss >> token) {
                outTokens.push_back(token);
            }
            return !outTokens.empty();
        }
    }

    // Retained for backward-compatibility
    static std::vector<std::string> parseArray(const std::string& buffer) {
        std::string copy = buffer;
        std::vector<std::string> tokens;
        parseCommand(copy, tokens);
        return tokens;
    }

    static std::string serializeSimpleString(const std::string& val) {
        return "+" + val + "\r\n";
    }

    static std::string serializeError(const std::string& err) {
        return "-" + err + "\r\n";
    }

    static std::string serializeBulkString(const std::string& val) {
        return "$" + std::to_string(val.length()) + "\r\n" + val + "\r\n";
    }

    static std::string serializeNull() {
        return "$-1\r\n";
    }

    static std::string serializeInteger(long long val) {
        return ":" + std::to_string(val) + "\r\n";
    }
};

#endif
