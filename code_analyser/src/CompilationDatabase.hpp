#pragma once

#include <string>
#include <set>
#include <vector>

namespace sjp {

class CompilationFile
{
public:
	void Clear()
	{
		mFileName.clear();
		mHomeDir.clear();
		mOptionIndex.clear();
		mOptionData.clear();
	}

	bool operator < (const CompilationFile& other) const
	{
		if (mHomeDir == other.mHomeDir)
		{
			return mFileName < other.mFileName;
		}
		return mHomeDir < other.mHomeDir;
	}

	std::vector<const char*> GetOptions() const
	{
		std::vector<const char*> opts;
		opts.reserve(mOptionIndex.size());
		for (size_t i = 0; i < mOptionIndex.size(); i++)
		{
			opts.push_back(&mOptionData[0] + mOptionIndex.at(i));
		}
		return opts;
	}

	void SetOptions(const std::string& option_string)
	{
		mOptionData.clear();
		mOptionData.reserve(option_string.size()+16);
		bool in_string = false;
		bool found_break = false;
		for (size_t i = 0; i < option_string.length(); ++i)
		{
			if(found_break) 
			{
				mOptionIndex.push_back(static_cast<int>(mOptionData.size()));
				found_break = false;
			}
			mOptionData.push_back(option_string[i]);
			if(!in_string && (option_string[i] == ' ' || option_string[i] == '\t'))
			{
				mOptionData.back() = '\0';
				mOptionIndex.push_back(static_cast<int>(mOptionData.size()));
				//skip all whitespace
				while(option_string[i] == ' ' || option_string[i] == '\t') ++i;
				--i;
			}
			else if(option_string[i] == '"' || option_string[i] == '\'') in_string = !in_string;
		}
		mOptionData.push_back('\0');
	}

	std::string mFileName;
	std::string mHomeDir;
private:
	std::vector<int> mOptionIndex;
	std::vector<char> mOptionData;
};

class CompilationDatabase
{
public:
	CompilationDatabase()
		: mFiles() 
	{}

	std::set<CompilationFile>::const_iterator Begin() const
	{
		return mFiles.begin();
	}

	std::set<CompilationFile>::const_iterator End() const
	{
		return mFiles.end();
	}

	size_t Size() const
	{
		return mFiles.size();
	}

	void AddFile(const CompilationFile& file)
	{
		mFiles.insert(file);
	}

private:
	std::set<CompilationFile> mFiles;
	std::vector<const char*> mOptionStrings;
};


class CompilationDatabaseReader 
{
public:
	CompilationDatabaseReader( CompilationDatabase* db): mDB(db) {}

	void onNameString(std::string& in) {
		if(!in.empty() && in[0] == 'd') mCurrentParseState = PARSING_DIR;
		else if(!in.empty() && in[0] == 'c') mCurrentParseState = PARSING_COMMAND;
		else if(!in.empty() && in[0] == 'f') mCurrentParseState = PARSING_FILE;
		else mCurrentParseState = PARSING_NONE;
	};
	void onValueString(std::string& in)
	{
		switch(mCurrentParseState)
		{
			case PARSING_FILE:
				mTempFile.mFileName = in;
				break;
			case PARSING_COMMAND:
				mTempFile.SetOptions(in);
				break;
			case PARSING_DIR:
				mTempFile.mHomeDir = in;
				break;
			default:
			break;
		}

	};
	void onStartObject() 
	{
		mTempFile.Clear();
		mCurrentParseState = PARSING_NONE;
	};
	void onEndObject() 
	{
		mDB->AddFile(mTempFile);

	};
	void onValueInt(int in) {};
	void onValueDouble(double in) {};
	void onValueBool(bool in) {};
	void onStartArray(){};
	void onEndArray(){};
	void onValueNull(){}

private:
	enum eParseState
	{
		PARSING_DIR,
		PARSING_COMMAND,
		PARSING_FILE,
		PARSING_NONE
	};
	CompilationFile mTempFile;
	eParseState mCurrentParseState;
	CompilationDatabase* mDB;
};




} // end namespace sjp
