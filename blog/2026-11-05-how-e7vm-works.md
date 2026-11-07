---
slug: how-e7vm-works
title: "How e7vm works: from TypeScript to verified bytecode"
authors: [e7]
tags: [e7, internals, security]
description: The compiler, the .e7b format, the bytecode verifier, the interpreter and its memory model, the libraries E7 depends on, and every platform e7vm runs on.
---

E7 has two halves. A compiler turns a strict subset of TypeScript into bytecode on your server. A virtual machine
inside your app verifies that bytecode and then runs it in a sandbox. This post walks through both halves, lists
everything E7 depends on, and covers every platform e7vm runs on today.

<!-- truncate -->

## The big picture

![e7vm architecture: the build server compiles and optionally signs; the app verifies, links natives and runs the interpreter](/img/architecture-light.png#gh-light-mode-only)![e7vm architecture: the build server compiles and optionally signs; the app verifies, links natives and runs the interpreter](/img/architecture-dark.png#gh-dark-mode-only)

- **In production, compile on the server.** The app only loads `.e7b` files. The runtime library then contains no
  compiler, so it is smaller and exposes less attack surface.
- **On-device compilation is optional.** Build with `E7_WITH_COMPILER` to compile source inside the app. Even then,
  the output still goes through the verifier. The verifier trusts no input, not even its own compiler.

## The compiler

The compiler lives in `src/compiler`:

1. **Lexing and parsing** produce an AST.
2. **Type checking** resolves every name, type and member access at compile time. That is why E7 rejects `any`,
   dynamic keys and runtime type tests. Errors carry line and column, and often a "did you mean ...?" suggestion.
3. **Code generation** emits typed register bytecode. Integer and floating-point addition are different instructions,
   and a field access compiles to a read at a fixed offset.
4. **Debug information** (optional, `e7c --debug`) records source positions, statement boundaries and local variable
   names for the debugger.

## The `.e7b` format

An `.e7b` file contains:

- constant pools;
- the memory layouts of classes and records;
- function prototypes, each with a type table for its registers and its instructions;
- imported native functions, linked by name and signature;
- exported functions and a module initializer.

A CRC32 footer catches corrupted files. An optional Ed25519 signature covers every byte before it. If the app
configures trusted public keys, it refuses to load a module whose signature does not match. All integers are
little-endian and string constants are stored as UTF-16. The [bytecode reference](/docs/reference/BYTECODE) has the
full layout.

## The virtual machine

### Verify once, then run without type checks

Like the JVM and WebAssembly, e7vm verifies every function at load time with a dataflow type check (`verify.cpp`). It
guarantees that:

- every operand register has the type its instruction expects (an integer can never be used as a pointer);
- constant, register, field and function indices are in range;
- every jump target is valid;
- every call passes the right number and types of arguments.

Once a module passes, execution needs no type checks, and memory safety follows from verification. Only three runtime
checks remain: array bounds, null values and integer division by zero.

### A typed register machine

- Each register slot is 8 bytes with **no type tag**. The function prototype's type table says what each register
  holds.
- Instructions are specific to their types.
- Dispatch uses computed goto with GCC and Clang, and a `switch` with MSVC.

### Script calls do not use the C stack

Script frames live on a stack that the VM manages itself. That has two benefits:

- The call depth can be limited exactly.
- When the instruction budget runs out, a call can return "suspended" and the host can resume it on the next frame.
  Long computations do not have to block the UI.

### A debugger that costs nothing when off

The interpreter loop is compiled twice. The normal copy contains no debugger checks at all. The VM switches to the
second copy, which checks breakpoints and stepping, only while a debugger is attached.

### Memory

- **Precise garbage collection:** the register type tables are the GC's root maps, and object layouts say where the
  pointers are. Collection is currently a stop-the-world mark-and-sweep.
- **Isolated instances:** every VM instance has its own heap and its own memory limit. Instances share no state.
- **JavaScript-compatible strings:** strings are UTF-16, so `length` and indexing behave exactly as in JavaScript.
  That is what allows byte-for-byte differential tests against Node.js. Strings cross into the host as UTF-8.

### The sandbox

- **Budgets:** an instruction budget (heavy native calls such as BigInt arithmetic and PBKDF2 count by the work they do),
  a memory limit and a call-depth limit.
- **Explicit capabilities:** a script can only call the native functions the host registers. There is no file,
  network or system access.

## What E7 depends on

**At run time, only the C++17 standard library and two vendored C crypto libraries:**

| Library | Version and license | Used for |
|---|---|---|
| [BearSSL](https://bearssl.org/) | 0.6, MIT; only the primitives (no TLS, no X.509) | SHA-256/384/512, HMAC, AES-GCM, ChaCha20-Poly1305, and the random number generator |
| [Monocypher](https://monocypher.org/) | 4.0.3, CC0 or BSD-2 | X25519 and the Ed25519 core (paired with SHA-512) |

Everything else is part of E7:

- HKDF and PBKDF2 on top of BearSSL's HMAC.
- The whole standard library: strings, JSON, BigInt, Date, Map and the rest.

The runtime touches the operating system in only two places:

- it seeds the random number generator from the system's random source;
- `Date.now()` reads the clock.

There is no file, network or threading dependency.

**Development and release tooling does not ship in your app:**

- CMake builds everything.
- Emscripten builds the WebAssembly version.
- Node.js runs the npm package and the tests.
- `@vscode/debugadapter` powers VS Code debugging.
- Docusaurus builds this site, and mermaid-cli draws the diagrams.
- libFuzzer and ClusterFuzzLite fuzz the code.

## Where e7vm runs

| Environment | Delivered as | Notes |
|---|---|---|
| **Android** | AAR + JNI (Kotlin / Java) | API 21+; arm64-v8a, armeabi-v7a, x86_64, x86 |
| **iOS** | Swift package / xcframework | iOS 13+; no JIT, so it is App Store friendly |
| **macOS** | Swift package, command-line tools | macOS 11+; universal arm64 + x86_64 |
| **Windows** | C API, C# (NuGet), command-line tools | x64; MSVC and clang-cl (MinGW also verified) |
| **Linux** | C API, command-line tools | x64, arm64; 32-bit i386 is tested in CI |
| **JVM (desktop / server)** | jar with native libraries | same JNI binding as Android |
| **.NET** | NuGet `E7VM` | native libraries for win-x64, linux-x64, linux-arm64 and osx |
| **Browsers** | WebAssembly | powers the [playground](/playground) |
| **Node.js 18+** | npm `@e7lang/e7` (WebAssembly) | any OS; also runs and debugs scripts in the VS Code extension |

**Other platforms:** e7vm needs only C++17 and two portable C libraries, so it should build anywhere a C++17 compiler
exists, such as embedded Linux, consoles and other Unix systems. Those targets are not covered by CI yet. Keep two
limits in mind:

- Only little-endian architectures have been tested.
- A VM instance is single-threaded. To run in parallel, use one instance per thread.

**CI covers these compilers and builds:**

- GCC 13, Clang 16 and 18, MSVC, clang-cl, the Android NDK and the iOS toolchain;
- 32-bit, `switch` dispatch, shared-library and ASan + UBSan builds.

## Further reading

- [Language spec](/docs/reference/SPEC)
- [Embedding (C API)](/docs/reference/EMBEDDING)
- [Bytecode format](/docs/reference/BYTECODE)
- [Debugging](/docs/reference/DEBUGGING)
- [Production checklist](/docs/reference/PRODUCTION)
- [What is supported](/docs/supported)
