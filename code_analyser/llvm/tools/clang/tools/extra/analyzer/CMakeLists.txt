set(SRC_ROOT ../../../../../../src/)

add_clang_executable(analyzer
	dummy.cpp
  ${SRC_ROOT}CompilationDatabase.hpp
  ${SRC_ROOT}analyzer.cpp
  ${SRC_ROOT}analyzer.hpp
  ${SRC_ROOT}node_includes.hpp
  ${SRC_ROOT}JSONReader.hpp
  ${SRC_ROOT}JSONCallbacks.hpp
  )
add_definitions(-DANALYZER_STANDALONE)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++0x")

target_link_libraries(analyzer
  clangEdit clangTooling clangBasic clangAST clangASTMatchers libclang)
