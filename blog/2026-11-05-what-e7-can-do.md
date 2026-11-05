---
slug: what-e7-can-do
title: "E7 today: how close it is to TypeScript, what it does well, and what it can't do yet"
authors: [e7]
tags: [e7, release, overview]
description: An honest look at E7 0.1.0, the strict TypeScript subset that runs safely inside Android, iOS, Windows, macOS and Linux apps.
---

E7 is a strict subset of TypeScript. Its virtual machine, e7vm, is small enough to embed in Android, iOS, Windows,
macOS and Linux apps. You compile scripts to bytecode on your server and ship them to the app, which verifies the
bytecode and runs it in a sandbox. Request signing, signature verification and pricing or rule logic can then change
without an app release.

With [0.1.0](https://github.com/e7lang/e7/releases/tag/v0.1.0) out, this post sums up where E7 stands: how far it is
from "real" TypeScript, what it can do today, where it is strong, and what it deliberately or not-yet cannot do.
E7 is versioned 0.x on purpose: it is thoroughly tested and hardened, but it has not run in production yet, and a
minor release may still change the language, the C API or the bytecode format.

<!-- truncate -->

## How far is E7 from TypeScript?

The rule is simple: **every valid E7 program is valid TypeScript, but not the other way round.** E7 drops the
features that can only be resolved at run time. In exchange the compiler resolves every name and type statically, and
the VM can verify the bytecode before running it.

### What you get

What you need for algorithms and business logic is there:

- **Types:** `number`, `string`, `boolean`, `bigint`, arrays and tuples, `interface` and `type`, `class` (single
  inheritance, `implements`, `instanceof`), `enum`, closures and arrow functions.
- **Control flow:** `if`, `switch`, `for`, `for...of`, `while`, labeled `break` / `continue`.
- **Syntax:** block-scoped `let` / `const`, template strings, object spread, plain destructuring, `?.`, `??`, `!`,
  and narrowing on `!== null`, `instanceof` and early returns.
- **Modules:** `import` / `export`, `import type`, `import * as`.
- **Standard library:** String, Array, Map, Set, Math, JSON, Date, BigInt, Uint8Array, DataView,
  TextEncoder / TextDecoder. Behavior matches JavaScript, and the test suite checks it against Node.js.

E7 also adds a few things TypeScript does not have:

- **Machine integers** `i8` … `u64` that wrap on overflow, handy for hashes and bit manipulation.
- **JSON that checks itself:** `JSON.parse(text) as T` validates the data against `T`. `tryParse` from `e7:json`
  returns `null` for bad input instead of ending the call.
- **Built-in crypto and encodings** in `e7:crypto` and `e7:encoding` (more below).

```ts
import { tryParse, lastError } from "e7:json";

interface Payment { id: string; amount: number; currency?: string }

export function handle(body: string): string {
  const p = tryParse(body) as Payment | null;
  if (p === null) return "rejected: " + lastError(); // e.g. "expected a number at $.amount"
  return `ok ${p.id} ${p.amount} ${p.currency ?? "EUR"}`;
}
```

### What E7 rejects, and what to write instead

| TypeScript | E7 |
|---|---|
| `any`, `unknown` | a concrete type or `T \| null` |
| `try` / `catch` | in 0.1, return errors as values (`T \| null` or a result object). Since [0.2](/blog/e7-0-2), `try`/`catch` catches the errors Node.js also throws; `finally` is not supported yet |
| user-defined generics `f<T>()` | concrete types (built-in `Array<T>`, `Map<K, V>`, `Set<T>` are fine) |
| unions such as `string \| number` | one interface with a `kind` field; only unions with `null` / `undefined` are allowed |
| regular expressions | string methods: `split`, `indexOf`, `slice`, `replaceAll` |
| `async` / `await`, promises, `fetch` | synchronous code; the host app does the I/O and passes the data in |
| index signatures, `Record`, `Partial`, ... | `Map<string, V>`, or write the interface out |
| `for...in`, `delete`, `in`, `var`, `==` | `Object.keys`, `Map`, `let` / `const`, `===` |
| getters / setters, `#private`, decorators, abstract classes | plain methods |
| recursive interfaces | a `class` |
| destructuring with defaults or `...rest` | `slice` and `??` |

A few things also behave differently at run time:

- Reading an array or string out of bounds is a runtime error, not `undefined`.
- `Date` is UTC only.
- `toUpperCase` covers Latin, Greek and Cyrillic; `localeCompare` compares UTF-16 code units, not by locale.

**In short:** for algorithms, data processing and business rules, E7 covers most of everyday TypeScript. Porting code
mostly means changing error handling and removing dynamic tricks. It is not a general-purpose JavaScript runtime:
existing npm packages and front-end or Node.js code will not run as they are.

## What E7 can do today

1. **Ship algorithms without an app release.** `e7c` compiles to `.e7b` bytecode, optionally signed with your
   Ed25519 key. You deliver it over your CDN or API, and the app verifies it and runs it.
2. **Run on every major platform.**
   - A C API plus Kotlin/Java, Swift and C# bindings.
   - Published packages: an Android AAR, a JVM jar, a NuGet package, a Swift package, and prebuilt tools for Linux,
     macOS and Windows.
3. **Use a complete toolchain.**
   - Command-line tools: `e7c` (compile, sign, disassemble), `e7` (run, test) and `e7 debug`, a command-line
     debugger.
   - [`@e7lang/e7`](https://github.com/e7lang/e7/tree/main/packages/e7), a WebAssembly build that works anywhere
     Node.js 18+ runs.
   - A VS Code extension with diagnostics, one-click run and a full debugger: breakpoints, stepping and variables.
   - The [playground](/playground), which runs the real compiler and VM in your browser.
4. **Test scripts.** Write assertions with `e7:test` and run them with `e7 test`.
5. **Write E7 with AI assistants.** An [E7 skill](/docs/ai) teaches models the subset, so they produce code that
   compiles. Install it as a Claude Code plugin or upload the zip attached to each release. The site also publishes
   [`llms.txt`](https://e7lang.github.io/llms.txt).

## Where E7 is strong

- **Safe by construction.**
  - A bytecode verifier checks registers, types, indices and jump targets before anything runs. Tampered bytecode
    cannot break memory safety.
  - Every call has budgets for instructions (including heavy native calls), memory and call depth. An infinite loop
    is stopped, not a hang.
  - Scripts can only call the host functions you register. There is no file, network or system access.
  - The code has had four security reviews (each by a separate AI review agent; no third-party audit yet),
    differential testing against Node.js and OpenSSL, sanitizers and continuous fuzzing.
- **Keys stay in the host.** With a `KeyHandle`, a script can sign with a key from the Keychain, Keystore or DPAPI
  without ever reading it.
- **App Store friendly.** e7vm is a pure interpreter with no JIT, so it runs on iOS too.
- **Small.** The runtime library is about 470 KB with crypto included, or about 920 KB with the on-device compiler.
- **Fast where it matters.** iOS forces every engine to interpret, so the fair comparison is V8 with `--jitless`.
  e7vm is faster on five of six benchmarks:

  | Benchmark (x86-64, ms) | e7vm | V8 `--jitless` |
  |---|--:|--:|
  | `fib(30)`, recursive calls | 58 | 70 |
  | SHA-256 in pure script (`u32`), 1 MiB | 168 | 1159 |
  | String concat / split / Map | 384 | 293 |

  Standard crypto always runs as native code.
- **Nothing new to learn.** It is TypeScript syntax, so VS Code and `tsc --strict` work for writing and checking E7.
- **Crypto included.**
  - Hashes and key derivation: SHA-2/3, HMAC, HKDF, PBKDF2.
  - Encryption: AES-GCM / CBC / CTR, ChaCha20-Poly1305.
  - Signatures and key exchange: Ed25519, X25519, ECDSA (P-256/384/521), RSA (PKCS#1 v1.5 and PSS).
  - Encodings: hex, base64, base32, PEM.

## What E7 can't do (yet)

We would rather say this plainly:

- **No catchable exceptions.** Errors are values. This is the biggest difference in how you write code, and whether
  to add `try` / `catch` is still an open design question.
- **No user-defined generics, general unions or regex.** Writing general-purpose utility libraries is more verbose.
- **No async and no I/O.** Scripts cannot make requests, read files or use timers. The host app does that.
- **No npm ecosystem.** Existing JavaScript and TypeScript libraries generally need to be rewritten.
- **Not for UI or long-running services.** E7 is "an algorithm your app calls". It is not React Native and not
  Node.js.
- **Limited internationalization.** There is no `Intl`, `Date` is UTC only, and case mapping does not cover all of
  Unicode.
- **Performance has gaps.** String-heavy code is slower than V8's interpreter (384 ms vs 293 ms above). Without a JIT,
  peak compute speed cannot match V8 with its JIT enabled.
- **Package registries are not wired up yet.** npm, NuGet, Maven Central, the VS Code Marketplace, Open VSX and
  Homebrew are prepared but not published. For now, download everything from
  [GitHub Releases](https://github.com/e7lang/e7/releases).

## Try it

- Run code in the [playground](/playground).
- Follow [Getting started](/docs/getting-started) to install the toolchain.
- Read the [language tour](/docs/language-tour) for the full picture.

Feedback and issues are welcome on [GitHub](https://github.com/e7lang/e7/issues).
