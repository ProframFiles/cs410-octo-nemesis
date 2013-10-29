#include "analyzer.hpp"
#include "node_includes.hpp"
#include "JSONReader.hpp"
#include "JSONCallbacks.hpp"
#include <stdio.h>


v8::Handle<v8::Value> Method(const v8::Arguments& args)
{
	DECLARE_V8_ISOLATE;
	DECLARE_HANDLESCOPE(scope);
	if (args.Length() < 2) {
	
		v8::ThrowException(v8::Exception::TypeError(v8::String::New("Wrong number of arguments")));
	
		return scope.Close(v8::Undefined());
	}
	if (!args[0]->IsString() || !args[1]->IsString()) {
		v8::ThrowException(v8::Exception::TypeError(v8::String::New("Wrong argument types: expected two strings")));
		return scope.Close(v8::Undefined());
	}



	v8::String::AsciiValue val1(args[0]);
	v8::String::AsciiValue val2(args[1]);

	printf("got 2 arguments: \n\t%s\n\t%s\n", *val1, *val2 );

	sjp::JSONObjectIO json_out;

	RunOnSourceFile( *val1, *val2, &json_out);

	std::string json_string = json_out.ToString();
	
	const char* string_ptr = json_string.empty() ? "" : json_string.c_str();

	return scope.Close(v8::String::New(string_ptr, static_cast<int>(json_string.size())));
}

void Init(v8::Handle<v8::Object> exports)
{
	exports->Set(v8::String::NewSymbol("SingleFile"),
							 v8::FunctionTemplate::New(Method)->GetFunction());
}

NODE_MODULE(analyzer, Init)


