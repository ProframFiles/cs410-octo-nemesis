add_clang_executable(tool-template
  ToolTemplate.cpp
  )
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -I../../../../../../src")

target_link_libraries(tool-template
  clangEdit clangTooling clangBasic clangAST clangASTMatchers)
