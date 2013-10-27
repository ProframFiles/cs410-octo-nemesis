////////////////////////////////////////////////////////////////////////////
//
// file JSONReader.hpp
//
////////////////////////////////////////////////////////////////////////////

#pragma once

#include <string>
#include <cassert>
#include <functional>
#include <fstream>
#include <stdio.h>
#define _AKJ_WHITESPACE  " \n\t\r\f\b"
#define _AKJ_NUM_DELIM  " \n\t\r\f\b,}.]"
#define _AKJ_STRINGFIND  "\\\""
#define _AKJ_QUOTE 0x22
#define _AKJ_BACKSLASH 0x5c
#define _AKJ_BACKSPACE 0x8
#define _AKJ_FORMFEED 0xc
#define _AKJ_NEWLINE 0xa
#define _AKJ_CARRIAGE_RETURN 0xd
#define _AKJ_HORIZONTAL_TAB 0x9

namespace sjp
{
int stringToNumber(const char* p, double& r);

template <class tCallback>
class JSONReader;

class JSONException: public std::runtime_error
{
public:
	explicit JSONException(const std::string& _Message) : std::runtime_error("dsf" + _Message) {};
	explicit JSONException(const char* _Message) : std::runtime_error(_Message) {};
	template <class tCallback>
	explicit JSONException(const std::string& _Message, JSONReader<tCallback>* jsr) : std::runtime_error("dsf" + _Message) {};
	template <class tCallback>
	explicit JSONException(const char* _Message, JSONReader<tCallback>* jsr) : std::runtime_error(_Message) {};
};

template<class tCallbacks>
class JSONReader
{
	enum parse_state {INITIAL, GETSTRING, GET_O_VALUE, GET_A_VALUE, DONE_A_VALUE, DONE_O_VALUE };
public:
	JSONReader(tCallbacks& callbacks) :  mLoc(0), mJsonStr(mString), mCallbacks(callbacks) { init();};
	JSONReader(std::string& in, tCallbacks& callbacks) :  mLoc(0), mJsonStr(in), mCallbacks(callbacks) {init();};
	~JSONReader() {init();};
private:
	inline void init()
	{
		mTmpString.reserve(64);
	}
public:
	void parse(std::string& in)
	{
		mLoc = 0;
		mString = in;
		parse();
	};
	void parseFile(const wchar_t* in)
	{
		parseFile(std::wstring(in));
	};
	void parseFile(std::wstring& in)
	{
		file2String(in);
		mLoc = 0;
		parse();
	};
	void parse()
	{
		mCharArray = &mString[0];
		mSize = mString.size();
		mLoc = 0;
		if(tryConsume('{'))
		{
			consumeObject();
		}

		else if(tryConsume('['))
		{
			consumeArray();
		}

		else
		{
			throw JSONException("ok, didn't make it out of the gates");
		}
	};
private:
	void consumeObject()
	{
		mCallbacks.onStartObject();

		do
		{
			mCallbacks.onNameString(consumeString());
			consume(':');

			if(tryConsume('{'))
			{
				consumeObject();
			}

			else if(tryConsume('['))
			{
				consumeArray();
			}

			else
			{
				consumeValue();
			}
		}
		while(tryConsume(','));

		consume('}');
		mCallbacks.onEndObject();
	};
	void consumeArray()
	{
		mCallbacks.onStartArray();

		do
		{
			if(tryConsume('{'))
			{
				consumeObject();
			}

			else if(tryConsume('['))
			{
				consumeArray();
			}

			else
			{
				consumeValue();
			}
		}
		while(tryConsume(','));

		consume(']');
		mCallbacks.onEndArray();
	};

	void consumeValue()
	{
		if(tryNoConsume(_AKJ_QUOTE))
		{
			mCallbacks.onValueString(consumeString());
		}

		else if((mSize - mLoc) >= 4 && tryConsume('t') && tryConsume('r') && tryConsume('u') && tryConsume('e'))
		{
			mCallbacks.onValueBool(true);
		}

		else if((mSize- mLoc) >= 5 && tryConsume('f') && tryConsume('a') && tryConsume('l') && tryConsume('s') && tryConsume('e'))
		{
			mCallbacks.onValueBool(false);
		}

		else if((mSize- mLoc) >= 5 && tryConsume('n') && tryConsume('u') && tryConsume('l') && tryConsume('l'))
		{
			mCallbacks.onValueNull();
		}

		else
		{
			double tmpDoub = 0.0;
			int movePos = stringToNumber(mCharArray+mLoc, tmpDoub, static_cast<int>(mSize - mLoc));
			if(movePos > 0)
			{
				mLoc += movePos;
				mCallbacks.onValueDouble(tmpDoub);
			}
			else if(movePos < 0)
			{
				mLoc -= movePos;
				mCallbacks.onValueInt(static_cast<int>(tmpDoub));
			}
			else { throw JSONException("failed number read"); }
		}
	};
	inline void consume(char c)
	{
		skipNonsense();

		if(mCharArray[mLoc] != c)
		{
			throw JSONException(std::string("Failed consume: expected ") + c + "but got " + mJsonStr.substr(mLoc, 1));
		}

		mLoc++;
	};
	inline bool tryConsume(char c)
	{
		skipNonsense();

		if(mLoc >= (mSize - 1))
		{
			//_loc = jsonStr.length();
			return false;
		}

		else if(mCharArray[mLoc] != c)
		{
			return false;
		}

		mLoc++;
		return true;
	};
	inline bool tryNoConsume(char c)
	{
		skipNonsense();

		if(mLoc >= (mSize - 1))
		{
			//_loc = jsonStr.length();
			return false;
		}

		else if(mCharArray[mLoc] != c)
		{
			return false;
		}

		return true;
	};
	inline void skipNonsense()
	{
		while(mLoc < mSize && (mCharArray[mLoc] <= ' ' || mCharArray[mLoc] > '~'))
		{
			++mLoc;
		}
	};
	std::string& consumeString()
	{
		consume(_AKJ_QUOTE);
		const size_t sz = mJsonStr.size();
		size_t firstLoc = mLoc;
		int escapes = 0;
		while(mCharArray[mLoc] != '"')
		{
			while(mLoc < sz && mCharArray[mLoc] >= ' ' && mCharArray[mLoc] <= '~' && mCharArray[mLoc] != _AKJ_QUOTE && mCharArray[mLoc] != _AKJ_BACKSLASH)
			{
				++mLoc;
			}
			if(mLoc >= mJsonStr.size())
			{
				throw JSONException("Failed consumeString: unexpected end of input following ");
			}

			else if(mCharArray[mLoc] == _AKJ_BACKSLASH)
			{
				if(mCharArray[mLoc+1] != 'u')
				{
					escapes++;
					mLoc += 2;
				}

				else
				{
					mLoc += 2;
				}
			};
		}

		size_t tmpLength = mLoc - firstLoc - escapes;
		mTmpString.resize(tmpLength);

		for(size_t i = 0; i < tmpLength; i++)
		{
			char thisChar = mCharArray[firstLoc + i];

			if(thisChar < 0x20 || thisChar >= 0x90)
			{
				throw JSONException("string contains illegal character (char < 0x20)");
			}

			else if(thisChar == _AKJ_BACKSLASH)
			{
				firstLoc++;

				switch(mJsonStr[firstLoc + i])
				{
				case(_AKJ_QUOTE) :
					mTmpString[i] = _AKJ_QUOTE;
					break;

				case(_AKJ_BACKSLASH) :
					mTmpString[i] = _AKJ_BACKSLASH;
					break;

				case('/') :
					mTmpString[i] = '/';
					break;

				case('b') :
					mTmpString[i] = _AKJ_BACKSPACE;
					break;

				case('f') :
					mTmpString[i] = _AKJ_FORMFEED;
					break;

				case('n') :
					mTmpString[i] = _AKJ_NEWLINE;
					break;

				case('r') :
					mTmpString[i] = _AKJ_CARRIAGE_RETURN;
					break;

				case('t') :
					mTmpString[i] = _AKJ_HORIZONTAL_TAB;
					break;

				case('u') :
					firstLoc --;
					mTmpString[i] = _AKJ_BACKSLASH;
					//TODO: handle unicode here
					break;

				default:
					throw JSONException("unrecognized escape sequence: \\");
				}
			}

			else
			{
				mTmpString[i] = thisChar;
			}
		}

		mLoc++;
		return mTmpString;
	};
	void file2String(std::wstring& p)
	{
		std::ifstream fin;
		mString.clear();

		try
		{
			fin.open(p.c_str(), std::ios::binary);
			fin.seekg(0, std::ios::end);
			std::streamoff length = fin.tellg();
			if(length < 0) { throw JSONException("file read error: stream offset<0", this); }
			fin.seekg(0, std::ios::beg);
			mString.resize(static_cast<size_t>(length) + 1);
			fin.read(&mString[0], length);
			fin.close();
		}

		catch(const wchar_t* str)
		{
			wprintf(L"File Read Exception %s \n", str);
		}
	}
public:
	void test(std::string& in)
	{
		mJsonStr = in ;
		//jsonStr[10]='u';
		printf("parsing %s  \n", mJsonStr.c_str());
		consume(':');
		printf("consumed '%c', now at '%c' \n", ':', mJsonStr[mLoc]);
		assert(tryConsume('s'));
		printf("consumed '%c', now at '%c' \n", 's', mJsonStr[mLoc]);
		assert(tryConsume('d'));
		printf("consumed '%c', now at '%c' \n", 'd', mJsonStr[mLoc]);
		consume('d');
		printf("consumed '%c', now at '%c' \n", 'd', mJsonStr[mLoc]);
		consume('f');
		printf("consumed '%c', now at '%c' \n", 'f', mJsonStr[mLoc]);
		consumeString();

		if(mLoc == mJsonStr.length())
		{
			printf("consumed \"%s\", now at end \n", mTmpString.c_str());
		}

		else
		{
			printf("consumed \"%s\", now at _loc=%d of %d \n", mTmpString.c_str(), mLoc, mJsonStr.length());
		}
	};
private:
	tCallbacks& mCallbacks;
	size_t mLoc;
	size_t mSize;
	std::string mString;
	const char* mCharArray;
	std::string& mJsonStr;
	std::string mTmpString;
};


inline int stringToNumber(const char* p, double& r, const unsigned int maxChars)
{
	r = 0.0;
	bool neg = false;
	bool isInt = true;
	const char* initPtr = p;
	const char* maxPtr = p + maxChars;
	//skip other crap
	while(p < maxPtr && ((*p < '0') || (*p > '9')) && (*p != '-')) { ++p; }

	if(*p == '-')
	{
		neg = true;
		++p;
	}
	while(p < maxPtr && *p >= '0' && *p <= '9')
	{
		r = (r * 10.0) + (*p - '0');
		++p;
	}
	if(*p == '.')
	{
		double f = 0.0;
		int n = 0;
		++p;
		while(p < maxPtr && *p >= '0' && *p <= '9')
		{
			f = (f * 10.0) + (*p - '0');
			++p;
			++n;
		}
		if(f != 0.0) { isInt = false; }
		r += f / std::pow(10.0, n);
	}
	if((*p == 'e') || (*p == 'E'))
	{
		++p;
		double e = 0.0;
		bool expneg = false;
		if(*p == '-')
		{
			expneg = true;
			++p;
		}
		while(p < maxPtr && *p >= '0' && *p <= '9')
		{
			e = (e * 10.0) + (*p - '0');
			++p;
		}
		if(neg) { e = -e; }
		r = r * pow(10.0, e);
	}
	if(neg)
	{
		r = -r;
	}
	if(p == maxPtr) { return 0; }
	if(isInt) { return static_cast<int>(initPtr - p); }
	return static_cast<int>(p - initPtr);
}
}//end namespace jsp
#undef _AKJ_WHITESPACE
#undef _AKJ_QUOTE
#undef _AKJ_BACKSLASH
#undef _AKJ_BACKSPACE
#undef _AKJ_FORMFEED
#undef _AKJ_NEWLINE
#undef _AKJ_CARRIAGE_RETURN
#undef _AKJ_HORIZONTAL_TAB
