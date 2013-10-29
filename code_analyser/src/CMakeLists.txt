

add_clang_executable(analyzer
  analyzer.cpp
  )

include_directories(../node_source/src ../node_source/deps/v8/include ../node_source/deps/uv/include)


target_link_libraries(analyzer
  clangEdit clangTooling clangBasic clangAST clangASTMatchers)
