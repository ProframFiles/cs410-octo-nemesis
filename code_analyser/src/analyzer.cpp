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
#include <algorithm>
#include <unordered_map>
#include <unordered_set>
#include "stopwatch.hpp"



using namespace clang;
using namespace clang::ast_matchers;
using namespace clang::tooling;
using namespace llvm;

namespace
{

struct MethodRecord
{
	std::string mUSR;
	std::string mFullName;
	std::string mName;
	std::string mFileName;
	std::vector<size_t> mArgumentClasses;
	std::vector<size_t> mBodyDependencies;
	size_t mCodeSize;
	size_t mParentClass;
};

struct ClassRecord
{
	std::string mUSR;
	std::string mFullname;
	std::string mName;
	std::string mFileName;
	std::unordered_set<size_t> mChildren;
	std::unordered_map<size_t, size_t> mMethodCallers;
	std::unordered_map<size_t, size_t> mFieldAccessors;
	std::unordered_set<size_t> mParents;
	std::unordered_set<size_t> mMethods;
	size_t mIndex;
	double mLookupTime;
	int mDeclarationBytes;

	void DumpToJSON(sjp::JSONObjectIO* json, std::vector<ClassRecord>& parent_array, std::vector<MethodRecord>& method_array, size_t index) const
	{
		json->StartObject();
		json->AddValue(std::string("qualifiedName"), mFullname);
		json->AddValue(std::string("name"), mName);
		json->AddValue(std::string("filename"), mFileName);
		json->AddValue(std::string("index"), static_cast<int>(index)); 
		json->AddValue(std::string("USR"), mUSR);
		json->AddValue(std::string("declarationSize"), mDeclarationBytes);
		json->AddValue(std::string("timeSpent"), mLookupTime);
		
		json->StartArray(std::string("parentArray"));
		for (auto i = mParents.begin(); i != mParents.end(); ++i)
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

		json->StartArray(std::string("methodCalls"));
		for (auto i = mMethodCallers.begin(); i != mMethodCallers.end(); ++i)
		{
			json->StartObject();
			json->AddValue(std::string("callerIndex"),  static_cast<int>(i->first));
			json->AddValue(std::string("count"),  static_cast<int>(i->second));
			json->EndCurrent();
		}
		json->EndCurrent();

		json->StartArray(std::string("memberDataRefs"));
		for (auto i = mFieldAccessors.begin(); i != mFieldAccessors.end(); ++i)
		{
			json->StartObject();
			json->AddValue(std::string("callerIndex"),  static_cast<int>(i->first));
			json->AddValue(std::string("count"),  static_cast<int>(i->second));
			json->EndCurrent();
		}
		json->EndCurrent();
		
		json->StartArray(std::string("methods"));
		for (auto i = mMethods.begin(); i != mMethods.end(); ++i)
		{
			if(method_array.at(*i).mFullName.size() > 0)
			{
				json->StartObject();
				json->AddValue( std::string("name"), method_array.at(*i).mFullName );
				json->AddValue( std::string("numBytes"), static_cast<int>(method_array.at(*i).mCodeSize) );
				json->EndCurrent();
			}
		}


		json->EndCurrent();
		json->EndCurrent();
	}

};



struct TempIndex
{
	size_t mPermIdx;
	const CXXRecordDecl* mDecl;
};

class ClassDeclCallback : public MatchFinder::MatchCallback
{
public:
	ClassDeclCallback(size_t num_files) 
		: mClassRecords()
		, mTotalCallbacks(0)
		, mNumLinks(0)
		, mTotalFiles(num_files)
		, mFileCount(0)
		, mNumMethods(0)
	{
		mClassRecords.reserve(2048);
		mPointerMap.reserve(2048);
		mIndexMap.reserve(2048);
		mDecls.reserve(2048);
	}

	virtual void run(const MatchFinder::MatchResult& Result)
	{
		mSW.Start();
		++mTotalCallbacks;
		if(const CXXRecordDecl* CE = Result.Nodes.getNodeAs<CXXRecordDecl>("class"))
		{
			if(( clang::SrcMgr::C_User == Result.SourceManager->getFileCharacteristic(CE->getLocStart()) ))
			{
				ProcessRecordDecl(CE, Result);
			}
		}
		if(const CXXMethodDecl* MD = Result.Nodes.getNodeAs<CXXMethodDecl>("method"))
		{
			++mNumMethods;
			ProcessMethodDecl(MD, Result);
		}
	}

	void ProcessMethodDecl(const CXXMethodDecl* MD, const MatchFinder::MatchResult& Result)
	{
		mTmpSS.clear();
		index::generateUSRForDecl(MD, mTmpSS);
		mTmpString = std::string(&mTmpSS[0], mTmpSS.size());
		size_t index = 0;
		std::unordered_map<std::string, size_t>::const_iterator find_index = mMethodIndexMap.find(mTmpString);
		

		if(find_index == mMethodIndexMap.end())
		{
			akj::cStopWatch sw;
			index = mMethodRecords.size();
			mMethodRecords.emplace_back();
			
			if(MD)
			{
				MethodRecord& mr = mMethodRecords.back();
				mr.mUSR = mTmpString;
				mr.mFileName = GetFilename(MD->getLocation(), Result);
				raw_svector_ostream sout(mTmpSS);
				if(MD->getIdentifier())
				{
					mr.mName = MD->getName();
				}
				mr.mFullName = MD->getNameAsString();
				mMethodIndexMap.insert(std::make_pair(mr.mUSR, index));
				mr.mCodeSize = GetSourceByteSize(MD, Result);
				std::unordered_map<const void*, size_t>::const_iterator find_parent = mPointerMap.find(MD->getParent());
				if(find_parent != mPointerMap.end())
				{
					ClassRecord& cr = mClassRecords.at(find_parent->second);
					cr.mMethods.insert(index);
					if(const Stmt* S = MD->getBody()) ProcessMethodBody(S, mr, cr, Result);
					cr.mLookupTime += sw.Stop();
				}
				
				
			}
		}
		else
		{
			index = find_index->second;
		}
	}

	void ProcessMethodBody(const Stmt* statement, MethodRecord& mr, ClassRecord& cr, const MatchFinder::MatchResult& Result)
	{
		for (Stmt::const_child_iterator s = statement->child_begin() ; s != statement->child_end(); ++s)
		{
			const Stmt* S = *s; 
			if(!S) continue;
			std::string Sclass = S->getStmtClassName();
			//printf("%s:\n", Sclass.c_str());
			//S->dumpPretty(*Result.Context);
			//printf("-------------------\n");
			if( const CXXMemberCallExpr *E = dyn_cast<CXXMemberCallExpr>(S)   ) 
			{
				if(const CXXMethodDecl* MD = E->getMethodDecl())
				{
					const CXXRecordDecl* CR = MD->getParent();
					AddExternalMethodCall(CR, cr);

				}
			}
			else if( const CXXConstructExpr *E = dyn_cast<CXXConstructExpr>(S)   ) 
			{
				if(const CXXConstructorDecl* CD = E->getConstructor())
				{
					const CXXRecordDecl* CR = CD->getParent();
					AddExternalMethodCall(CR, cr);
				}
			}
			else if( const MemberExpr *E = dyn_cast<MemberExpr>(S)   )
			{
				const ValueDecl* VD;
				const FieldDecl* FD;
				if( (VD = E->getMemberDecl()) && (FD = dyn_cast<FieldDecl>(VD) ))
				{
					const RecordDecl* CR = FD->getParent();
					AddExternalMemberRef(CR, cr);
				}
			} 
			ProcessMethodBody(S, mr, cr, Result);

		}
	}

	void AddExternalMethodCall( const RecordDecl* CR, ClassRecord &called_from ) 
	{
		std::unordered_map<const void*, size_t>::const_iterator find_callee = mPointerMap.find(CR);
		if(find_callee != mPointerMap.end())
		{
			auto called_ref = mClassRecords.at(find_callee->second).mMethodCallers[called_from.mIndex] += 1;
		}
	}

	void AddExternalMemberRef( const RecordDecl* CR, ClassRecord &called_from ) 
	{
		std::unordered_map<const void*, size_t>::const_iterator find_callee = mPointerMap.find(CR);
		if(find_callee != mPointerMap.end())
		{
			mClassRecords.at(find_callee->second).mFieldAccessors[called_from.mIndex] += 1;
		}
	}


	void ProcessRecordDecl(const CXXRecordDecl* CE, const MatchFinder::MatchResult& Result)
	{
		mTmpSS.clear();
		index::generateUSRForDecl(CE, mTmpSS);
		mTmpString = std::string(&mTmpSS[0], mTmpSS.size());
		std::unordered_map<std::string, size_t>::const_iterator find_it = mIndexMap.find(mTmpString);
		// is this a new thing? then insert it into the map
		if(find_it == mIndexMap.end())
		{	
			
			mClassRecords.emplace_back();
			ClassRecord& cr = mClassRecords.back();

			IterateOverParents(CE, mClassRecords.size()-1);
			IterateOverFields(CE, mClassRecords.size()-1);

			mDecls.emplace_back();
			mDecls.back().mDecl = CE;
			mDecls.back().mPermIdx = mClassRecords.size()-1;
			
			cr.mDeclarationBytes = GetSourceByteSize(CE, Result);
			
			
			mTmpSS.clear();
			raw_svector_ostream sout(mTmpSS);
			
			cr.mName = CE->getName();
			CE->printQualifiedName(sout);
			PrintTemplateParams(CE->getDescribedClassTemplate(), sout);
			StringRef name = sout.str();
			cr.mFullname = name;
//			std::string(name.data(), name.size());
			cr.mUSR = mTmpString;
			cr.mFileName = GetFilename(CE->getLocation(), Result);
			cr.mIndex =  mClassRecords.size()-1;

			mIndexMap.insert(std::make_pair(cr.mUSR, mClassRecords.size()-1));
			mPointerMap.insert(std::make_pair(CE, mClassRecords.size()-1));
			cr.mLookupTime = mSW.Stop();
		}
		
		else
		{
			// if it's not new, refresh the pointer for this traversal
			const CXXRecordDecl* prev = CE;
			mDecls.emplace_back();
			mDecls.back().mDecl = CE;
			mDecls.back().mPermIdx = find_it->second;
			mPointerMap.insert(std::make_pair(CE, find_it->second));
		}
	}

	
	std::string GetFilename(SourceLocation sloc, const MatchFinder::MatchResult& Result)
	{
		StringRef fname = Result.SourceManager->getFilename(sloc);
		mTmpFileNameString.clear();
		StringRef sub = "neo";
		if( !fname.empty() )
		{
			size_t index = fname.find(sub);
			
			if(index != StringRef::npos) 
			{
				mTmpFileNameString = fname.substr(index);
			}
			else
			{
				mTmpFileNameString = fname;
			}
			std::for_each(mTmpFileNameString.begin(), mTmpFileNameString.end(), [](char& c){
				if(c == '\\') c = '/';
			});
		}
		return mTmpFileNameString;
	}

	int GetSourceByteSize( const CXXRecordDecl* CE,  const MatchFinder::MatchResult& Result)
	{
		bool invalid = false;
		const char* start = Result.SourceManager->getCharacterData(CE->getOuterLocStart(), &invalid);
		const char* end = Result.SourceManager->getCharacterData(CE->getLocEnd(), &invalid);
		return static_cast<int> (end-start);
	}
	
	int GetSourceByteSize( const CXXMethodDecl* CE,  const MatchFinder::MatchResult& Result)
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
			mClassRecords.at(i).DumpToJSON(json, mClassRecords, mMethodRecords, i);
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
	int GetNumMethods() const { return static_cast<int>(mNumMethods); }
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
					mClassRecords.back().mParents.insert(item_index);
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
						ClassRecord& cr = mClassRecords.at(found_idx->second);
						cr.mChildren.insert(index);
						mClassRecords.back().mParents.insert(found_idx->second);
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
	std::unordered_map<std::string, size_t> mMethodIndexMap;
	std::vector<ClassRecord> mClassRecords;
	std::vector<MethodRecord> mMethodRecords;
	std::vector<TempIndex> mDecls;
	SmallVector<char, 1024> mTmpSS;
	std::string mTmpString;
	std::string mTmpFileNameString;
	size_t mTotalCallbacks;
	size_t mNumLinks;
	size_t mTotalFiles;
	size_t mFileCount;
	size_t mNumMethods;
	akj::cStopWatch mSW;
	
};


} 

int RunOnSourceFile(std::string home_dir,const std::vector<std::string>& files, ClassDeclCallback& callback)
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
		
		// ask for callbacks on every C++ class declaration
		ast_matchers::MatchFinder Finder;
		DeclarationMatcher class_decl_match = anyOf(recordDecl(decl().bind("class"), isDefinition()), methodDecl(decl().bind("method"), isDefinition()));
		//DeclarationMatcher method_decl_match = methodDecl(decl().bind("method"), isDefinition());
		Finder.addMatcher(class_decl_match, &callback);
		//Finder.addMatcher(method_decl_match, &callback);
		FrontendActionFactory* factory = newFrontendActionFactory(&Finder);

		// generate & traverse the AST
		Tool.run(factory);

		// cleanup references that only live as long as the AST
		callback.Cleanup();
	}
	return 0;
}

void RunOnAllSourceFiles(const sjp::CompilationDatabase& files, ClassDeclCallback& callback )
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
	ClassDeclCallback callback(compilationDB.Size());
	
	// time the run, for curiosities sake
	akj::cStopWatch sw;
	RunOnAllSourceFiles( compilationDB, callback);
	sw.Stop();
	
	// callback now has the collected analysis information, so dump to disk
	
	sjp::JSONObjectIO json_out;
	json_out.StartObject("root");
	json_out.StartArray("doom3");
	callback.DumpAllToJSON(&json_out);
	json_out.EndCurrent();
	json_out.StartObject("stats");
	json_out.AddValue(std::string("total callbacks"), callback.GetNumCallBacks());
	json_out.AddValue(std::string("total classes"), callback.GetNumClasses());
	json_out.AddValue(std::string("total methods"), callback.GetNumMethods());
	json_out.AddValue(std::string("total links"), callback.GetNumlinks());
	json_out.AddValue(std::string("total time"), sw.Read());
	json_out.EndCurrent();
	json_out.EndCurrent();
	std::ofstream fout("test_analysis_out.json", std::ios::binary);
	fout << json_out.ToString();


	return 0;
}
#endif
