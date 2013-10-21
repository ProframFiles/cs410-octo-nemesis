// RUN: %clang_cc1 -verify -fopenmp -ast-print %s | FileCheck %s
// RUN: %clang_cc1 -fopenmp -x c++ -std=c++11 -emit-pch -o %t
// RUN: %clang_cc1 -fopenmp -std=c++11 -include-pch %t -fsyntax-only -verify %s -ast-print
// expected-no-diagnostics

#ifndef HEADER
#define HEADER

struct St{
 int a;
};

struct St1{
 int a;
 static int b;
// CHECK: static int b;
#pragma omp threadprivate(b)
// CHECK-NEXT: #pragma omp threadprivate(b)
} d;

int a, b;
// CHECK: int a;
// CHECK: int b;
#pragma omp threadprivate(a)
// CHECK-NEXT: #pragma omp threadprivate(a)
#pragma omp threadprivate(d, b)
// CHECK-NEXT: #pragma omp threadprivate(d,b)

template <class T> T foo() {
  static T v;
  #pragma omp threadprivate(v)
  return v;
}
//CHECK: template <class T = int> int foo() {
//CHECK-NEXT: static int v;
//CHECK-NEXT: #pragma omp threadprivate(v)
//CHECK: template <class T> T foo() {
//CHECK-NEXT: static T v;
//CHECK-NEXT: #pragma omp threadprivate(v)

int main () {
  static int a;
// CHECK: static int a;
#pragma omp threadprivate(a)
// CHECK-NEXT: #pragma omp threadprivate(a)
  a=2;
  return (foo<int>());
}

#endif
