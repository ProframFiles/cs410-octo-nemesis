//===---- tools/extra/ToolTemplate.cpp - Template for refactoring tool ----===//
//
//                     The LLVM Compiler Infrastructure
//
// This file is distributed under the University of Illinois Open Source
// License. See LICENSE.TXT for details.
//
//===----------------------------------------------------------------------===//
//
//  This file implements an empty refactoring tool using the clang tooling.
//  The goal is to lower the "barrier to entry" for writing refactoring tools.
//
//  Usage:
//  tool-template <cmake-output-dir> <file1> <file2> ...
//
//  Where <cmake-output-dir> is a CMake build directory in which a file named
//  compile_commands.json exists (enable -DCMAKE_EXPORT_COMPILE_COMMANDS in
//  CMake to get this output).
//
//  <file1> ... specify the paths of files in the CMake source tree. This path
//  is looked up in the compile command database. If the path of a file is
//  absolute, it needs to point into CMake's source tree. If the path is
//  relative, the current working directory needs to be in the CMake source
//  tree and the file must be in a subdirectory of the current working
//  directory. "./" prefixes in the relative files will be automatically
//  removed, but the rest of a relative path must be a suffix of a path in
//  the compile command line database.
//
//  For example, to use tool-template on all files in a subtree of the
//  source tree, use:
//
//    /path/in/subtree $ find . -name '*.cpp'|
//        xargs tool-template /path/to/build
//
//===----------------------------------------------------------------------===//

#ifndef __STDC_LIMIT_MACROS
	#define __STDC_LIMIT_MACROS
	#define __STDC_CONSTANT_MACROS
#endif // !__STDC_LIMIT_MACROS


#include "clang/ASTMatchers/ASTMatchers.h"
#include "clang/ASTMatchers/ASTMatchFinder.h"
#include "clang/Basic/SourceManager.h"
#include "clang/Frontend/FrontendActions.h"
#include "clang/Lex/Lexer.h"
#include "clang/Tooling/CompilationDatabase.h"
#include "clang/Tooling/Refactoring.h"
#include "clang/Tooling/Tooling.h"
#include "clang/Index/USRGeneration.h"
#include "llvm/ADT/OwningPtr.h"
#include "llvm/Support/CommandLine.h"
#include "llvm/Support/MemoryBuffer.h"
#include "llvm/Support/Signals.h"
#include "JSONReader.hpp"
#include "JSONCallbacks.hpp"
#include "CompilationDatabase.hpp"




using namespace clang;
using namespace clang::ast_matchers;
using namespace clang::tooling;
using namespace llvm;

namespace
{
class ToolTemplateCallback : public MatchFinder::MatchCallback
{
public:
	ToolTemplateCallback(sjp::JSONObjectIO* json_out) : mJSON(json_out) {}

	virtual void run(const MatchFinder::MatchResult& Result)
	{
		const RecordDecl* CE = Result.Nodes.getNodeAs<RecordDecl>("statementer");
		if(CE != NULL && (clang::SrcMgr::C_User == Result.SourceManager->getFileCharacteristic(CE->getLocStart())))
		{
			const bool orig = CE->isCanonicalDecl();
			StringRef name = CE->getName();
			bool invalid = 0;
			if(orig && !name.empty())
			{
				mJSON->StartObject(std::string(name.data()));
				
				const char* start = Result.SourceManager->getCharacterData(CE->getLocStart(), &invalid);
				const char* end = Result.SourceManager->getCharacterData(CE->getLocEnd(), &invalid);

				if(!invalid && (end > start) && (end - start) < 256)
				{
					mTmpString.clear();
				
					while(start <= end)
					{
						mTmpString.push_back(*start++);
					}
					mJSON->AddValue(std::string("source"), mTmpString);
				}
				clang::index::generateUSRForDecl(CE, mTmpUSR);
				mJSON->AddValue(std::string("USR"), std::string(&mTmpUSR[0]));
				mJSON->EndCurrent();
			}
			
		}
	}

private:
	
	SmallVector<char, 1024> mTmpUSR;
	std::string mTmpString;
	sjp::JSONObjectIO* mJSON;
};


} // end anonymous namespace

// Set up the command line options
cl::opt<std::string> BuildPath(
		cl::Positional,
		cl::desc("<build-path>"));

cl::list<std::string> SourcePaths(
		cl::Positional,
		cl::desc("<source0> [... <sourceN>]"),
		cl::OneOrMore);

int RunOnSourceFile(std::string home_dir, std::string absolute_file, sjp::JSONObjectIO* json_out)
{
	json_out->StartObject("clang tool run");
	
	const char*  dir_input[3] = {"tool-template", home_dir.c_str(), absolute_file.c_str()};
	int num_args = 3;
	std::string ErrorMessage;

	cl::ParseCommandLineOptions(num_args, dir_input);

	llvm::OwningPtr<CompilationDatabase> Compilations(
			CompilationDatabase::autoDetectFromDirectory(BuildPath, ErrorMessage));

	if(Compilations)
	{

		RefactoringTool Tool(*Compilations, SourcePaths);
		ast_matchers::MatchFinder Finder;

		ToolTemplateCallback Callback(json_out);
		DeclarationMatcher decl_match = recordDecl().bind("statementer");
		Finder.addMatcher(decl_match, &Callback);

		json_out->StartArray("method_calls");
		Tool.run(newFrontendActionFactory(&Finder));
	
		json_out->EndCurrent();
	}
	else
	{
		json_out->AddValue("tool error", ErrorMessage);
	}
	json_out->EndCurrent();
	return 0;
}

#ifdef ANALYZER_STANDALONE
#include <iostream>
int main(int argc, const char **argv) 
{
	std::string arg1 = argv[1];
	std::string arg2 = argv[2];
  	printf("got 2 arguments: \n\t%s\n\t%s\n", arg1.c_str(), arg2.c_str() );
	
	sjp::CompilationDatabase CompilationDB;
	sjp::CompilationDatabaseReader comp_reader(&CompilationDB);
	sjp::JSONReader<sjp::CompilationDatabaseReader> json_reader(comp_reader);
	json_reader.parseFile("compile_commands.json");

	const std::vector<const char*>* opts = CompilationDB.GetOptions("2");
	for (size_t i = 0; i < opts->size(); i++)
	{
		printf("Option: %s\n", opts->at(i));
	}


	
	sjp::JSONObjectIO json_out;
	RunOnSourceFile( arg1, arg2, &json_out);
	std::ofstream fout("test_analysis_out.json", std::ios::binary);
	fout << json_out.ToString();
	return 0;
}
#endif
