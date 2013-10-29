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
#include "llvm/ADT/OwningPtr.h"
#include "llvm/Support/CommandLine.h"
#include "llvm/Support/MemoryBuffer.h"
#include "llvm/Support/Signals.h"
#include "JSONReader.hpp"
#include "JSONCallbacks.hpp"





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
		if(const CallExpr* CE =   Result.Nodes.getNodeAs<CallExpr>("statementer"))
		{
			bool invalid = 0;
			const char* start = Result.SourceManager->getCharacterData(CE->getLocStart(), &invalid);
			const char* end = Result.SourceManager->getCharacterData(CE->getLocEnd(), &invalid);
			if(!invalid && (end > start) && (end - start) < 256)
			{
				mTmpString.clear();
				
				while(start <= end)
				{
					mTmpString.push_back(*start++);
				}
				mJSON->AddValue(mTmpString);
			}
		}
	}

private:

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

	const char*  dir_input[3] = {"tool-template", home_dir.c_str(), absolute_file.c_str()};
	int num_args = 3;
	
	llvm::sys::PrintStackTraceOnErrorSignal();
	llvm::OwningPtr<CompilationDatabase> Compilations(
			FixedCompilationDatabase::loadFromCommandLine(num_args, dir_input));
	cl::ParseCommandLineOptions(num_args, dir_input);
	if(!Compilations)     // Couldn't find a compilation DB from the command line
	{
		std::string ErrorMessage;
		Compilations.reset(
				!BuildPath.empty() ?
				CompilationDatabase::autoDetectFromDirectory(BuildPath, ErrorMessage) :
				CompilationDatabase::autoDetectFromSource(SourcePaths[0], ErrorMessage)
		);

		//  Still no compilation DB? - bail.
		if(!Compilations)
		{
			llvm::report_fatal_error(ErrorMessage);
		}
	}
	RefactoringTool Tool(*Compilations, SourcePaths);
	ast_matchers::MatchFinder Finder;

	ToolTemplateCallback Callback(json_out);
	StatementMatcher meth_match = callExpr().bind("statementer");
	Finder.addMatcher(meth_match, &Callback);
	// TODO: Put your matchers here.
	// Use Finder.addMatcher(...) to define the patterns in the AST that you
	// want to match against. You are not limited to just one matcher!
	json_out->StartArray("method_calls");
	int ret = Tool.run(newFrontendActionFactory(&Finder));
	
	json_out->EndCurrent();
	
	return ret;
}

