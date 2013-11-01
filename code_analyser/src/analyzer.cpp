//===------------------Group 18 CPSC410 -- analyzer.cpp -------------------===//
//
//  When run as a standalone exe, takes one command line argument:
//  the compile_commands.json file of the codeabase to analyse
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
#include <unordered_set>
#include "stopwatch.hpp"



using namespace clang;
using namespace clang::ast_matchers;
using namespace clang::tooling;
using namespace llvm;




struct ClassRecord
{
	std::string mUSR;
	std::string mFullname;
	std::string mName;
	std::unordered_set<size_t> mChildren;
	double mLookupTime;
	int mDeclarationBytes;

	void DumpToJSON(sjp::JSONObjectIO* json, const std::vector<ClassRecord>& parent_array, size_t index) const
	{
		json->StartObject(mUSR);
		json->AddValue(std::string("qualifiedName"), mFullname);
		json->AddValue(std::string("name"), mName);
		json->AddValue(std::string("index"), static_cast<int>(index)); 
		json->AddValue(std::string("USR"), mUSR);
		json->AddValue(std::string("declarationSize"), mDeclarationBytes);
		json->AddValue(std::string("timeSpent"), mLookupTime);
		json->StartArray(std::string("childArray"));
		for (auto i = mChildren.begin(); i != mChildren.end(); ++i)
		{
			json->AddValue( parent_array.at(*i).mUSR );
		}
		json->EndCurrent();
		json->StartArray(std::string("childIndexArray"));
		for (auto i = mChildren.begin(); i != mChildren.end(); ++i)
		{
			json->AddValue( static_cast<int>(*i));
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
	ToolTemplateCallback(size_t num_files) 
		: mClassRecords()
		, mTotalCallbacks(0)
		, mNumLinks(0)
		, mTotalFiles(num_files)
		, mFileCount(0)
	{mClassRecords.reserve(1024);}

	virtual void run(const MatchFinder::MatchResult& Result)
	{
		mSW.Start();
		++mTotalCallbacks;
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
			cr.mLookupTime = mSW.Stop();
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

	void DumpAllToJSON(sjp::JSONObjectIO* json)
	{
		for (size_t i = 0; i < mClassRecords.size() ; i++)
		{
			std::string& usr = mClassRecords.at(i).mUSR;
			for (size_t si = 0; si < usr.size() ; si++)
			{
				if(usr[si]=='@' || usr[si]==':' || usr[si] == '#')
				{
					usr[si]='_';
				}
			} 
		}
		
		for (size_t i = 0; i < mClassRecords.size() ; i++)
		{
			mClassRecords.at(i).DumpToJSON(json, mClassRecords, i);
		}
	}
	virtual void onEndOfTranslationUnit() 
	{
		++mFileCount;
		printf("##################################################################\n");
		printf("##################################################################\n\n");
		printf("                         % 5d/%-5d                          \n", 
				static_cast<int>(mFileCount), static_cast<int>(mTotalFiles));
		printf("\n##################################################################\n");
		printf("##################################################################\n");
		Cleanup();
	}
	void Cleanup()
	{
		mDecls.clear();
		mPointerMap.clear();
	}

	int GetNumCallBacks() const { return static_cast<int>(mTotalCallbacks);}

	int GetNumlinks() const 
	{ 
		int count = 0;
		for (size_t c = 0; c < mClassRecords.size() ; c++)
		{
			const std::unordered_set<size_t>& kids = mClassRecords.at(c).mChildren;
			for (auto i = kids.begin(); i != kids.end(); ++i)
			{
				++count;
			}
		}
		return count;	
	}

	int GetNumClasses() const { return static_cast<int>(mClassRecords.size());}

private:

	void IterateOverParents(const CXXRecordDecl* CE, size_t index)
	{
		for (auto it = mDecls.begin(); it != mDecls.end(); ++it)
		{
			CXXBasePaths paths;
			size_t item_index = it->mPermIdx;
			if( CE->isDerivedFrom(it->mDecl, paths))
			{
				bool found = false;
				// are we immediately descended?
				for (auto p = paths.begin(); p != paths.end(); ++p)
				{
					if(p->size()<2)
					{
						found = true;
						break;
					}

				}
				if(found)
				{
					mClassRecords.at(item_index).mChildren.insert(index);
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
						mClassRecords.at(found_idx->second).mChildren.insert(index);
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
	size_t mTotalCallbacks;
	size_t mNumLinks;
	size_t mTotalFiles;
	size_t mFileCount;
	akj::cStopWatch mSW;
	
};


} 

int RunOnSourceFile(std::string home_dir,const std::vector<std::string>& files, ToolTemplateCallback& callback)
{	
	std::string ErrorMessage;

	// point llvm towards the compilation commands
	llvm::OwningPtr<CompilationDatabase> Compilations(
			CompilationDatabase::autoDetectFromDirectory(home_dir, ErrorMessage));

	if(Compilations)
	{
		// input our single source file
		ArrayRef<std::string> source(files);
		RefactoringTool Tool(*Compilations, source);
		
		// ask for callbacks on evvery C++ class declaration
		ast_matchers::MatchFinder Finder;
		DeclarationMatcher decl_match = recordDecl().bind("statementer");
		Finder.addMatcher(decl_match, &callback);
		FrontendActionFactory* factory = newFrontendActionFactory(&Finder);

		// generate & traverse the AST
		Tool.run(factory);

		// cleanup references that only live as long as the AST
		callback.Cleanup();
	}
	return 0;
}

void RunOnAllSourceFiles(const sjp::CompilationDatabase& files, ToolTemplateCallback& callback )
{
	int count = 0;
	const int total = static_cast<int>(files.Size());
	std::vector<std::string> file_strings;
	file_strings.reserve(files.Size());
	for (auto it = files.Begin(); it !=  files.End(); ++it)
	{
		file_strings.emplace_back(it->mFileName);
		
	}
	RunOnSourceFile(files.Front().mHomeDir, file_strings, callback);
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

	// the callback class holds info between calls to analyze multiple source files
	ToolTemplateCallback callback(compilationDB.Size());
	
	// time the run, for curiosities sake
	akj::cStopWatch sw;
	RunOnAllSourceFiles( compilationDB, callback);
	sw.Stop();
	
	// callback now has the collected analysis information, so dump to disk
	
	sjp::JSONObjectIO json_out;
	json_out.StartObject("root");
	json_out.StartObject("doom3");
	callback.DumpAllToJSON(&json_out);
	json_out.EndCurrent();
	json_out.StartObject("stats");
	json_out.AddValue(std::string("total callbacks"), callback.GetNumCallBacks());
	json_out.AddValue(std::string("total classes"), callback.GetNumClasses());
	json_out.AddValue(std::string("total links"), callback.GetNumlinks());
	json_out.AddValue(std::string("total time"), sw.Read());
	json_out.EndCurrent();
	json_out.EndCurrent();
	std::ofstream fout("test_analysis_out.json", std::ios::binary);
	fout << json_out.ToString();


	return 0;
}
#endif
