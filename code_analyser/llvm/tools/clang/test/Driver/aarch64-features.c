// RUN: %clang -target aarch64-none-linux-gnu -### %s -fsyntax-only 2>&1 | FileCheck %s

// The AArch64 PCS states that chars should be unsigned.
// CHECK: fno-signed-char

