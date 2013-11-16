cs410-octo-nemesis
==================

Code analysis and visualization project

### Building the analyzer ###

Roughly, this is what you'll need to do:

1. Get cmake, and point it at the llvm directory to generate build files
2. build llvm + analyzer using cmake generated build files
3. edit the 'compile_commands.json' file in code_to_analyze/doom3 so that the absolute paths point to the correct place
4. run the analyzer: analyzer compile_commands.json
5. wait

All the project code is in src/
The analyzer itself is all in analyzer.cpp


