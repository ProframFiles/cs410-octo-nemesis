#ifndef HPP_node_includes
#define HPP_node_includes


#include <node.h>

// NODE_MODULE_VERSION was incremented for v0.11

#if NODE_MODULE_VERSION > 0x000B
#  define DECLARE_V8_ISOLATE v8::Isolate* isolate = v8::Isolate::GetCurrent()
#  define ISOLATE_REF isolate
#  define ISOLATE_REF_PRE isolate, 
#  define ISOLATE_REF_POST , isolate 
#  define DECLARE_HANDLESCOPE(hs) v8::HandleScope hs(ISOLATE_REF)
#else
#  define DECLARE_V8_ISOLATE
#  define ISOLATE_REF 
#  define ISOLATE_REF_PRE
#  define ISOLATE_REF_POST
#  define DECLARE_HANDLESCOPE(hs) v8::HandleScope hs
#endif




#endif // HPP_node_includes