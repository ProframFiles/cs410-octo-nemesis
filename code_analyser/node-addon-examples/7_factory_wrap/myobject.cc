#include <node.h>
#include "myobject.h"

using namespace v8;

MyObject::MyObject() {};
MyObject::~MyObject() {};

Persistent<Function> MyObject::constructor;

void MyObject::Init() {
  Isolate* isolate = Isolate::GetCurrent();
  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(New);
  tpl->SetClassName(String::NewSymbol("MyObject"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  tpl->PrototypeTemplate()->Set(String::NewSymbol("plusOne"),
      FunctionTemplate::New(PlusOne)->GetFunction());

  constructor = Persistent<Function>::New(isolate, tpl->GetFunction());
}

Handle<Value> MyObject::New(const Arguments& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  MyObject* obj = new MyObject();
  obj->counter_ = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
  obj->Wrap(args.This());

  return args.This();
}

Handle<Value> MyObject::NewInstance(const Arguments& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  const unsigned argc = 1;
  Handle<Value> argv[argc] = { args[0] };
  Local<Object> instance = constructor->NewInstance(argc, argv);

  return scope.Close(instance);
}

Handle<Value> MyObject::PlusOne(const Arguments& args) {
  Isolate* isolate = Isolate::GetCurrent();
  HandleScope scope(isolate);

  MyObject* obj = ObjectWrap::Unwrap<MyObject>(args.This());
  obj->counter_ += 1;

  return scope.Close(Number::New(obj->counter_));
}
