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
#include "clang/AST/CXXInheritance.h"
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
#include <unordered_map>



using namespace clang;
using namespace clang::ast_matchers;
using namespace clang::tooling;
using namespace llvm;




struct ClassRecord
{
	std::string mUSR;
	std::string mFullname;
	std::string mName;
	std::vector<size_t> mChildren;
	int mDeclarationBytes;

	void DumpToJSON(sjp::JSONObjectIO* json, const std::vector<ClassRecord>& parent_array) const
	{
		json->StartObject(mUSR);
		json->AddValue(std::string("qualified name"), mFullname);
		json->AddValue(std::string("name"), mName);
		json->AddValue(std::string("USR"), mUSR);
		json->AddValue(std::string("DeclarationSize"), mDeclarationBytes);
		json->StartArray(std::string("childArray"));
		for (size_t i = 0; i < mChildren.size(); ++i)
		{
			json->AddValue( parent_array.at(mChildren.at(i)).mUSR );
		}

		json->EndCurrent();
		json->EndCurrent();
	}

};


namespace
{

struct TempIndex
{
	size_t mPermIdx;
	const CXXRecordDecl* mDecl;
};

class ToolTemplateCallback : public MatchFinder::MatchCallback
{
public:
	ToolTemplateCallback() 
		: mClassRecords()
	{mClassRecords.reserve(1024);}

	virtual void run(const MatchFinder::MatchResult& Result)
	{
		const CXXRecordDecl* CE = Result.Nodes.getNodeAs<CXXRecordDecl>("statementer");
		const CXXRecordDecl* def;
		if(CE != NULL 
			&& (clang::SrcMgr::C_User == Result.SourceManager->getFileCharacteristic(CE->getLocStart()))
			&& !CE->isInjectedClassName()
			&& (def = CE->getDefinition()))
		{
			ProcessRecordDecl(def, Result);
		}
	}

	void ProcessRecordDecl(const CXXRecordDecl* CE, const MatchFinder::MatchResult& Result)
	{
		mTmpSS.clear();
		index::generateUSRForDecl(CE, mTmpSS);
		std::string USR = std::string(&mTmpSS[0], mTmpSS.size());
		std::unordered_map<std::string, size_t>::const_iterator find_it = mIndexMap.find(USR);
		// is this a new thing? then insert it into the map
		if(find_it == mIndexMap.end())
		{	
			IterateOverParents(CE, mClassRecords.size());
			IterateOverFields(CE, mClassRecords.size());

			mDecls.emplace_back();
			mDecls.back().mDecl = CE;
			mDecls.back().mPermIdx = mClassRecords.size();
			mClassRecords.emplace_back();
			ClassRecord& cr = mClassRecords.back();
			cr.mDeclarationBytes = GetSourceByteSize(CE, Result);
			

			mTmpSS.clear();
			raw_svector_ostream sout(mTmpSS);
			cr.mName = CE->getName();
			CE->printQualifiedName(sout);
			PrintTemplateParams(CE->getDescribedClassTemplate(), sout);
			StringRef name = sout.str();
			cr.mFullname = std::string(name.data(), name.size());
			cr.mUSR = USR;
			mIndexMap.insert(std::make_pair(USR, mClassRecords.size()-1));
			mPointerMap.insert(std::make_pair(CE, mClassRecords.size()-1));
		}
		
		else
		{
			// if it's not new, refresh the pointer for this traversal
			const CXXRecordDecl* prev = CE->getCanonicalDecl();
			mDecls.emplace_back();
			mDecls.back().mDecl = CE;
			mDecls.back().mPermIdx = find_it->second;
			mPointerMap.insert(std::make_pair(CE, find_it->second));
		}
	}

	

	int GetSourceByteSize( const CXXRecordDecl* CE,  const MatchFinder::MatchResult& Result)
	{
		bool invalid = false;
		const char* start = Result.SourceManager->getCharacterData(CE->getOuterLocStart(), &invalid);
		const char* end = Result.SourceManager->getCharacterData(CE->getLocEnd(), &invalid);
		return static_cast<int> (end-start);

	}

	void DumpAllToJSON(sjp::JSONObjectIO* json) const
	{
		for (size_t i = 0; i < mClassRecords.size() ; i++)
		{
			mClassRecords.at(i).DumpToJSON(json, mClassRecords);
		}
	}

	void Cleanup()
	{
		mDecls.clear();
		mPointerMap.clear();
	}
private:

	void IterateOverParents(const CXXRecordDecl* CE, size_t index)
	{
		for (auto it = mDecls.begin(); it != mDecls.end(); ++it)
		{
			CXXBasePaths paths;
			size_t item_index = it->mPermIdx;
			if( CE->isDerivedFrom(it->mDecl, paths))
			{
				// are we immediately descended
				if(paths.begin()->size() < 2)
				{
					mClassRecords.at(item_index).mChildren.push_back(index);
				}
			}
		}
	}

	void IterateOverFields(const CXXRecordDecl* def, size_t index)
	{
		if(def)
		{
			// for each field, find the type
			// and then decide whether it's a complete type, and then 
			// decide whether we've encountered it before 
			for (RecordDecl::field_iterator i = def->field_begin(); i != def->field_end(); ++i)
			{
				QualType qt = i->getType().getCanonicalType();
				const Type* t = qt.getTypePtrOrNull();
				if(t != NULL)
				{
					NamedDecl* parent_decl = NULL;
					NamedDecl** decl_ptr = &parent_decl;
					t->isIncompleteType(decl_ptr);
					auto found_idx = mPointerMap.find(parent_decl);
					if(found_idx != mPointerMap.end())
					{
						mClassRecords.at(found_idx->second).mChildren.push_back(index);
					}
				}
			}
		}
		
	}

	void PrintTemplateParams(const ClassTemplateDecl*  TD, raw_svector_ostream& sout)
	{
		if(TD)
		{
			const TemplateParameterList* TP = TD->getTemplateParameters();
			ArrayRef<const NamedDecl*> param_array = TP->asArray();
			sout << '<';
			for (size_t i = 0; i < param_array.size(); i++)
			{
				if(i >0 ) sout << ", ";
				param_array[i]->printQualifiedName(sout);
			}
			sout << '>';
		}
	}
	std::unordered_map<const void*, size_t> mPointerMap;
	std::unordered_map<std::string, size_t> mIndexMap;
	std::vector<ClassRecord> mClassRecords;
	std::vector<TempIndex> mDecls;
	SmallVector<char, 1024> mTmpSS;
	std::string mTmpString;
};


} 

int RunOnSourceFile(std::string home_dir, std::string absolute_file, ToolTemplateCallback& callback)
{	

	const char*  dir_input[3] = {"tool-template", home_dir.c_str(), absolute_file.c_str()};
	int num_args = 3;
	std::string ErrorMessage;

	llvm::OwningPtr<CompilationDatabase> Compilations(
			CompilationDatabase::autoDetectFromDirectory(home_dir, ErrorMessage));

	if(Compilations)
	{
		ArrayRef<std::string> source(&absolute_file, 1);
		RefactoringTool Tool(*Compilations, source);
		ast_matchers::MatchFinder Finder;

		DeclarationMatcher decl_match = recordDecl().bind("statementer");
		Finder.addMatcher(decl_match, &callback);
		
		FrontendActionFactory* factory = newFrontendActionFactory(&Finder);

		Tool.run(factory);
		callback.Cleanup();
	}
	return 0;
}

void RunOnAllSourceFiles(const sjp::CompilationDatabase& files, ToolTemplateCallback& callback )
{
	int count = 0;
	const int total = static_cast<int>(files.Size());
	for (auto it = files.Begin(); it !=  files.End(); ++it)
	{
		auto opts = it->GetOptions();
		++count;
		printf("##################################################################\n");
		printf("##################################################################\n\n");
		printf("                         % 5d/%-5d                          \n", count, total);
		printf("\n##################################################################\n");
		printf("##################################################################\n");

		RunOnSourceFile(it->mHomeDir, it->mFileName, callback);
	}

}

#ifdef ANALYZER_STANDALONE
#include <iostream>
int main(int argc, const char **argv) 
{
	std::string arg1 = argv[1];
  	printf("got 1 arguments: \n\t%s\n", arg1.c_str() );
	
	sjp::CompilationDatabase compilationDB;
	sjp::CompilationDatabaseReader comp_reader(&compilationDB);
	sjp::JSONReader<sjp::CompilationDatabaseReader> json_reader(comp_reader);
	json_reader.parseFile(arg1);

	ToolTemplateCallback callback;

	RunOnAllSourceFiles( compilationDB, callback);
	sjp::JSONObjectIO json_out;
	callback.DumpAllToJSON(&json_out);
	std::ofstream fout("test_analysis_out.json", std::ios::binary);
	fout << json_out.ToString();
	return 0;
}
#endif
