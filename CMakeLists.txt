cmake_minimum_required(VERSION 3.14)
project(MiniRedis CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(mini_redis
    src/main.cpp
)

find_package(Threads REQUIRED)
target_link_libraries(mini_redis PRIVATE Threads::Threads)

if(WIN32)
    target_link_libraries(mini_redis PRIVATE ws2_32)
endif()

if(WIN32)
    target_link_libraries(mini_redis PRIVATE ws2_32)
endif()
