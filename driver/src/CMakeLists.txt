cmake_minimum_required(VERSION 3.10)
project(Dell1320cDriver C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

include_directories(${CMAKE_CURRENT_SOURCE_DIR})

set(SOURCES
    dell1320c_winprint.c
    dell1320c_engine.c
    sq21_simple.c
)

add_executable(dell1320c_winprint ${SOURCES})

if(WIN32)
    target_link_libraries(dell1320c_winprint ws2_32)
else()
    target_link_libraries(dell1320c_winprint m)
endif()
