cmake_minimum_required(VERSION 2.6)
project(SimpleStreamingJSONTest)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

set(CMAKE_CXX_COMPILER clang++)

set(CMAKE_CXX_FLAGS "-std=c++0x")
#add_subdirectory(w01-cpp)

include_directories(${SimpleStreamingJSONTest_SOURCE_DIR})

#the two exe's
set(JsonCPPDir ".")
add_executable(json-bench main.cpp ${JsonCPPDir}/json_writer.cpp ${JsonCPPDir}/json_reader.cpp ${JsonCPPDir}/json_value.cpp)
add_executable(aj++ aj++.cpp)

