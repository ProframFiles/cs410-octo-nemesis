#pragma once

#include <string>
#include <stdio.h>
#include <memory>
#include <map>
#include <vector>
#include <deque>
#include <ostream>
#include <cassert>

namespace sjp {

class JSONValueBase;

typedef std::vector<char> tStringContainer;
typedef size_t tJSONKey;
typedef std::vector< std::pair< tJSONKey, JSONValueBase*> > tJSONMap;
typedef std::vector< JSONValueBase* > tJSONArray;


enum eValueType
{
	SJP_OBJECT,
	SJP_ARRAY,
	SJP_STRING,
	SJP_NUMBER,
	SJP_TRUE,
	SJP_FALSE,
	SJP_NULL
};

struct StreamedString
{
	StreamedString()
	{
		mString.reserve(16*1024);
	}

	inline void put(char val)
	{
		mString.push_back(val);
	}
	inline void write(const char* ptr, size_t num)
	{
		GrowIfNeeded(num);
		for (size_t i = 0; i < num; i++)
		{
			mString.push_back(*ptr++);
		}
	}
	inline void repeat(char chr, size_t num)
	{
		GrowIfNeeded(num);
		for (size_t i = 0; i < num; i++)
		{
			mString.push_back(chr);
		}
	}
	std::string& ToString()
	{
		mTempString.resize(mString.size());
		memcpy(&mTempString[0], &mString[0],mString.size());
		return mTempString;	
	}

	void GrowIfNeeded(size_t num)
	{
		if(mString.size() + num > mString.capacity()) mString.reserve(mString.capacity()*2);
	}
	std::vector<char> mString;
	std::string mTempString;
};

struct Indenter
{
	Indenter(int level) : mIndentLevel(level){}
	int mIndentLevel;
};

inline std::ostream & operator <<(std::ostream &os, Indenter val)
{ 
	const char* tabs = "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t"; 
	
	os.write(tabs, val.mIndentLevel);

	return os; 
}

inline StreamedString& operator <<(StreamedString &os, Indenter val)
{ 
	const char* tabs = "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t"; 
	
	os.write(tabs, val.mIndentLevel);

	return os; 
}

class JSONValueBase
{
	public:
	virtual ~JSONValueBase() {}

	virtual eValueType GetType() const
	{ return SJP_NULL; }


	virtual std::ostream& StreamOut(std::ostream &os, int indent_level) const
	{
		os << Indenter(indent_level) << "null";
		return os;
	}
	virtual void StreamOut(StreamedString &os, int indent_level) const
	{
		os << Indenter(indent_level);
		os.write("null", 4);
	}

};

std::ostream& operator <<(std::ostream &os,const JSONValueBase* val)
	{ return val->StreamOut(os, 0); }

class JSONValueString : public JSONValueBase
{
public:
	JSONValueString(size_t str_index, const tStringContainer& main_string) : mMainString(main_string), mStart(str_index),mSize(main_string.size()-1-str_index){}

	virtual eValueType GetType()
	{ return SJP_STRING; }
	
	virtual void StreamOut(StreamedString& os, int indent_level) const
	{
		//os.GrowIfNeeded(mSize + 4);
		os << Indenter(indent_level);
		os.put('"');
		os.write(&mMainString[mStart], mSize);
		os.put('"');
	}

	std::ostream& StreamOut(std::ostream& os, int indent_level) const
	{
		os << Indenter(indent_level);
		os.put('"');
		os.write(&mMainString[mStart], mSize);
		os.put('"');
		return os;
	}
	const tStringContainer& mMainString;
	size_t mStart;
	size_t mSize;

};

class JSONValueTrue : public JSONValueBase
{
public:
	virtual eValueType GetType()
	{ return SJP_TRUE; }

	std::ostream& StreamOut(std::ostream& os, int indent_level) const
	{
		os << Indenter(indent_level) << "true";
		return os;
	}

	virtual void StreamOut(StreamedString &os, int indent_level) const
	{
		//os.GrowIfNeeded(4);
		os << Indenter(indent_level);
		os.write("true", 4);
	}
};
class JSONValueFalse : public JSONValueBase
{
public:
	virtual eValueType GetType()
	{ return SJP_FALSE; }

	std::ostream& StreamOut(std::ostream& os, int indent_level) const
	{
		os << Indenter(indent_level) << "false";
		return os;
	}

	virtual void StreamOut(StreamedString &os, int indent_level) const
	{
		//os.GrowIfNeeded(5);
		os << Indenter(indent_level);
		os.write("false", 5);
	}

};

class JSONValueNumber : public JSONValueBase
{
public:
	JSONValueNumber(double number) : mNumberValue(number){}

	virtual eValueType GetType()
	{ return SJP_NUMBER; }

protected:
	std::ostream& StreamOut(std::ostream& os, int indent_level) const
	{
		os << Indenter(indent_level) << mNumberValue;
		return os;
	};
	
	virtual void StreamOut(StreamedString &os, int indent_level) const
	{
		//os.GrowIfNeeded(16);
		os << Indenter(indent_level);
		std::string str = std::to_string(mNumberValue);
		os.write(&str[0], str.size());
	}
	double mNumberValue;
};

class JSONValueInteger : public JSONValueBase
{
public:
	JSONValueInteger(int number) : mNumberValue(number){}

	virtual eValueType GetType()
	{ return SJP_NUMBER; }

protected:
	std::ostream& StreamOut(std::ostream& os, int indent_level) const
	{
		os << Indenter(indent_level) << mNumberValue;
		return os;
	};
	
	virtual void StreamOut(StreamedString &os, int indent_level) const
	{
		//os.GrowIfNeeded(16);
		os << Indenter(indent_level);
		std::string str = std::to_string(mNumberValue);
		os.write(&str[0], str.size());
	}
	int mNumberValue;
};

class JSONValueContainer : public JSONValueBase
{
public:
	virtual void AddValue(JSONValueBase* value, tJSONKey key) = 0;
};

class JSONValueArray : public JSONValueContainer
{
public:
	JSONValueArray() : mArrayValue(){}

	virtual eValueType GetType()
	{ return SJP_ARRAY; }

	virtual void AddValue(JSONValueBase* value, tJSONKey key)
	{
		mArrayValue.push_back(value);
	}
	std::ostream& StreamOut(std::ostream& os, int indent_level) const
	{
		return StreamImpl(os, indent_level);
	}
	virtual void StreamOut(StreamedString& os, int indent_level) const
	{
		os.GrowIfNeeded(1024);
		StreamImpl(os, indent_level);
	}


	template <typename tOutStream>
	tOutStream& StreamImpl(tOutStream& os, int indent_level) const
	{
		os << Indenter(indent_level);
		if(mArrayValue.size() > 1)
		{
			indent_level++;
			os.put('[');
			os.put('\n');
			for (int i = 0; i < mArrayValue.size()-1; ++i)
			{
				mArrayValue.at(i)->StreamOut(os, indent_level);
				os.put( ',');
				os.put( '\n');
			}
			mArrayValue.back()->StreamOut(os, indent_level);
			os.put('\n');
			os << Indenter(--indent_level);
			os.put(']');
		}
		else if(!mArrayValue.empty())
		{
			os.put('[') ;
			os.put(' ') ;
			mArrayValue.back()->StreamOut(os, 0);
			os.put(' ') ;
			os.put(']') ;
		}
		else
		{
			os.write("[ ]",3) ;
		}

		return os;
	};
	tJSONArray mArrayValue;
};

size_t AppendString(tStringContainer& container,const std::string& str)
{
	if(container.size()+str.size() > container.capacity()) container.reserve(container.capacity()*2);
	size_t ret =container.size();
	for (size_t i = 0; i < str.size(); i++)
	{
		container.push_back(str[i]);
	}
	container.push_back('\0');
	return ret;
}

class JSONValueObject : public JSONValueContainer
{
public:
	JSONValueObject(const tStringContainer& main_string) : mMainString(main_string), mObjectValue(), mIsBaseObject(false){}

	virtual eValueType GetType()
	{ return SJP_OBJECT; }

	virtual void AddValue(JSONValueBase* value, tJSONKey key)
	{
		mObjectValue.emplace_back(std::make_pair(key, value));
	}

	void SetBaseObject() {mIsBaseObject = true;}

	std::ostream& StreamOut(std::ostream& os, int indent_level) const
	{
		return StreamImpl(os, indent_level);
	}

	virtual void StreamOut(StreamedString& os, int indent_level) const
	{
		os.GrowIfNeeded(1024);
		StreamImpl(os, indent_level);
	}

	template <typename tOutStream>
	tOutStream& StreamImpl(tOutStream& os, int indent_level) const
	{
		os << Indenter(indent_level);
		const int num_members = static_cast<int>(mObjectValue.size());
		if(num_members > 0)
		{
			if (!mIsBaseObject)
			{
				indent_level++;
				os.put('{');
				os.put('\n');
			}
			
			int iteration = 1;
			for (tJSONMap::const_iterator i = mObjectValue.begin(); i != mObjectValue.end(); ++i)
			{
				os << Indenter(indent_level);
				size_t len = strlen(&mMainString[i->first]);
				if(len > 0)
				{
					
					os.put('"');
					os.write(&mMainString[i->first], len);
					os.write("\" : ", 4);
				}
				if(i->second->GetType() == SJP_OBJECT || i->second->GetType() == SJP_ARRAY) 
				{
					os.put('\n');
					i->second->StreamOut(os, indent_level);
				}
				else
				{
					i->second->StreamOut(os, 0);
				}
				os.put(',');
				os.put('\n');
				iteration++;
			}
			if (!mIsBaseObject)
			{
				os << Indenter(--indent_level);
				os.put('}');
			} 
		}

		else if(!mIsBaseObject)
		{
			os.write( "{ }",3);
		}

		return os;
	};
	tJSONMap mObjectValue;
	const tStringContainer& mMainString;
	bool mIsBaseObject;
};

class JSONObjectIO
{
public:
	JSONObjectIO() 
	{
		mStringData.reserve(10*1024);
		mStringData.resize(1, '\0');
		JSONValueObject* root = new JSONValueObject(mStringData);
		root->SetBaseObject();
		mObjects.emplace_back(root);
		mObjectStack.push_back(root);
		mCurrentKey = 0;
	};
	~JSONObjectIO() {};

	std::string ToString() const
	{
		StreamedString ss;
		mObjectStack.front()->StreamOut(ss, 0);
		return ss.ToString();
	}

	std::ostream& StreamOut(std::ostream& os) const
	{
		os << mObjectStack.front();
		return os;
	}

	inline void onNameString(const std::string& in)
	{
		if(mObjects.size() == 1) mStringData.clear(); 
		mCurrentKey = AppendString(mStringData, in);
	};

	inline void onValueString(const std::string& in)
	{
		size_t current_value = AppendString(mStringData, in);
		JSONValueString* obj = new JSONValueString(current_value,mStringData);
		mObjects.emplace_back(obj);
		mObjectStack.back()->AddValue(obj, mCurrentKey);
		mCurrentKey = mStringData.size()-1;
	};

	inline void onStartObject()
	{
		JSONValueObject* obj = new JSONValueObject(mStringData);
		mObjects.emplace_back(obj);
		mObjectStack.back()->AddValue(obj, mCurrentKey);
		mObjectStack.push_back(obj);
		mCurrentKey = mStringData.size()-1;
	};

	inline void onEndObject()
	{
		mObjectStack.pop_back();
	};

	inline void onValueInt(int in)
	{
		JSONValueInteger* obj = new JSONValueInteger(in);
		mObjects.emplace_back(obj);
		mObjectStack.back()->AddValue(obj, mCurrentKey);
		mCurrentKey = mStringData.size()-1;
	};

	inline void onValueDouble(double in)
	{
		JSONValueNumber* obj = new JSONValueNumber(in);
		mObjects.emplace_back(obj);
		mObjectStack.back()->AddValue(obj, mCurrentKey);
		mCurrentKey = mStringData.size()-1;
	};

	inline void onValueBool(bool in)
	{
		JSONValueBase* obj = NULL;
		if(in) obj = new JSONValueTrue;
		else obj = new JSONValueFalse;
		mObjectStack.back()->AddValue(obj, mCurrentKey);
		mCurrentKey = mStringData.size()-1;
	};

	inline void onStartArray()
	{
		JSONValueArray* obj = new JSONValueArray();
		mObjects.emplace_back(obj);
		mObjectStack.back()->AddValue(obj, mCurrentKey);
		mObjectStack.push_back(obj);
		mCurrentKey = mStringData.size()-1;
	};

	inline void onEndArray()
	{
		mObjectStack.pop_back();
	};

	inline void onValueNull()
	{
		JSONValueBase* obj = new JSONValueBase();
		mObjectStack.back()->AddValue(obj, mCurrentKey);
		mCurrentKey = mStringData.size()-1;
	};
	
	JSONObjectIO& StartObject(const std::string& name)
	{
		onNameString(name);
		onStartObject();
		return *this;
	}

	JSONObjectIO& StartArray(const std::string& name)
	{
		onNameString(name);
		onStartArray();
		return *this;
	}

	JSONObjectIO& EndCurrent()
	{
		mObjectStack.pop_back();
		return *this;
	}

	JSONObjectIO& EndAll()
	{
		mObjectStack.resize(1);
		return *this;
	}

	JSONObjectIO& AddNull(const std::string& name)
	{
		onNameString(name);
		onValueNull();
		return *this;
	}

	template <typename tValue>
	JSONObjectIO& AddValue(const std::string& name, tValue val)
	{
		nonExistentFunction();
		return this;
	}

	template <typename tValue>
	JSONObjectIO& AddArray(const std::string& name,const std::vector<tValue>& array)
	{
		StartArray(name);
		for (size_t i = 0; i < array.size(); ++i)
		{
			AddValue(array[i]);
		}
		return EndCurrent();
	}

	JSONObjectIO& AddValue(float val)
	{
		return AddValue(static_cast<double>(val));
	}

	JSONObjectIO& AddValue(double val)
	{
		onValueDouble(val);
		return *this;
	}

	JSONObjectIO& AddValue(bool val)
	{
		onValueBool(val);
		return *this;
	}

	JSONObjectIO& AddValue(const std::string& val)
	{
		onValueString(val);
		return *this;
	}

	JSONObjectIO& AddValue(const std::string& name,float val)
	{
		return AddValue(name, static_cast<double>(val));
	}

	JSONObjectIO& AddValue(const std::string& name,double val)
	{
		onNameString(name);
		onValueDouble(val);
		return *this;
	}

	JSONObjectIO& AddValue(const std::string& name,bool val)
	{
		onNameString(name);
		onValueBool(val);
		return *this;
	}

	JSONObjectIO& AddValue(const std::string& name,const std::string& val)
	{
		onNameString(name);
		onValueString(val);
		return *this;
	}

	private:

	
	std::vector<JSONValueContainer*> mObjectStack;
	std::deque<std::unique_ptr<JSONValueBase> > mObjects;
	tStringContainer mStringData;
	tJSONKey mCurrentKey;
};

	


std::ostream& operator <<(std::ostream &os, const JSONObjectIO& val)
{ 
	return val.StreamOut(os);
}

class JSONPrintbacks
{
public:
	JSONPrintbacks() {};
	~JSONPrintbacks() {};
	inline void onNameString(std::string& in)
	{
		printf("here at nameString %s \n", in.c_str());
	};
	inline void onValueString(std::string& in)
	{
		printf("here at valueString %s \n", in.c_str());
	};
	inline void onStartObject()
	{
		printf("here at startObject \n");
	};
	inline void onEndObject()
	{
		printf("here at endObject \n");
	};
	inline void onValueInt(int in)
	{
		printf("here at int %d \n", in);
	};
	inline void onValueDouble(double in)
	{
		printf("here at double %f \n", in);
	};
	inline void onValueBool(bool in)
	{
		if(in)
		{
			printf("here at bool true \n");
		}

		else
		{
			printf("here at bool false \n");
		}
	};
	inline void onStartArray()
	{
		printf("here at startArray \n");
	};
	inline void onEndArray()
	{
		printf("here at endArray \n");
	};
	inline void onValueNull()
	{
		printf("here at nullValueFunc \n");
	};


};
class EmptyCallbacks
{
public:
	void onNameString(std::string& in) {};
	void onValueString(std::string& in) {};
	void onStartObject() {};
	void onEndObject() {};
	void onValueInt(int in) {};
	void onValueDouble(double in) {};
	void onValueBool(bool in) {};
	void onStartArray(){};
	void onEndArray(){};
	void onValueNull(){}
};

class JSONCountbacks
{
public:
	JSONCountbacks(): mNameStringCount(0) {};
	~JSONCountbacks() {};
	inline void onNameString(std::string& in)
	{
		mNameStringCount++;
	};
	inline void onValueString(std::string& in)
	{
		mNameStringCount++;
	};
	inline void onStartObject()
	{
		mNameStringCount++;
	};
	inline void onEndObject()
	{
		mNameStringCount++;
	};
	inline void onValueInt(int in)
	{
		mNameStringCount++;
	};
	inline void onValueDouble(double in)
	{
		mNameStringCount++;
	};
	inline void onValueBool(bool in)
	{
		mNameStringCount++;
	};
	inline void onStartArray()
	{
		mNameStringCount++;
	};
	inline void onEndArray()
	{
		mNameStringCount++;
	};
	inline void onValueNull()
	{
		mNameStringCount++;
	};
private:
	size_t mNameStringCount;
	size_t mValueStringCount;
	size_t mStartObjectCount;
	size_t mEndObjectCount;

};
}
