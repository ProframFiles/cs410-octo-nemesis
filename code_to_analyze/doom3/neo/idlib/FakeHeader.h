#pragma once
#include <ctype.h>

void * _aligned_offset_malloc(size_t, size_t, size_t);
void * _aligned_offset_realloc(void*, size_t, size_t, size_t);
void * _aligned_offset_recalloc(void*, size_t, size_t, size_t, size_t);

void * _aligned_malloc (size_t, size_t);
void * _aligned_realloc (void*, size_t, size_t);
void* _aligned_recalloc(void*, size_t, size_t, size_t);
void _aligned_free (void*);

