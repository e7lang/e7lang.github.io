---
sidebar_position: 4
title: What is supported
description: What E7 supports and what it rejects, at a glance, with the reasons.
---

# What is supported

E7 is a strict subset of TypeScript: every E7 program is valid TypeScript and behaves as it does on
Node.js. What E7 accepts, it runs exactly like JavaScript; what it cannot run exactly like JavaScript,
or cannot check before the script runs, is a compile error with a hint. This page is the summary; the
[TypeScript coverage table](reference/TYPESCRIPT.md) lists all 250 TypeScript features with their status, the
reason and what to write instead (155 supported, 17 partly, 78 not).

## Supported

| Area | What works |
|---|---|
| Types | `number`, `string`, `boolean`, `bigint`, arrays, tuples, `readonly`, interfaces and type aliases (also recursive and generic), `T \| null \| undefined`, **literal types** (`"GET" \| "POST"`, `0 \| 1`, `true`) and `as const`, enums, generics with constraints, type predicates (`x is T`) and assertion functions |
| Narrowing | `=== null`, truthiness, `instanceof`, literal comparisons, `switch` with exhaustiveness (`never` in `default`) |
| Classes and objects | single inheritance, `abstract`, getters and setters (also in object literals), `#private` fields and methods, `static` members and blocks, parameter properties, `implements`, the `this` return type |
| Functions | closures, arrows, default / optional / rest parameters, destructuring, functions as values (also `Math.sqrt`, `parseInt`, `String` where a callback is expected) |
| Syntax | spread, optional chaining, `??`, `??=` / `\|\|=` / `&&=`, template literals and tagged templates, computed keys known at compile time, labels, `try` / `catch` / `finally` |
| Iteration | `for...of`, **generators** (`function*`, `yield*`, `[Symbol.iterator]`), spread and destructuring of iterables; **async generators** (`async function*`, `[Symbol.asyncIterator]`) |
| Async | **`async` / `await`**, `Promise` (`then` / `catch` / `finally`, `all`, `allSettled`, `any`, `race`, `new Promise`), top-level `await`, `for await` over arrays, async generators and async iterable classes; callbacks run in the order of Node.js |
| Regular expressions | **literals and `RegExp`** (flags `dgimsuy`, named groups, lookbehind, `\p{...}`), `exec`, `test`, `match`, `matchAll`, `replace` / `replaceAll` with patterns and callbacks, `split`, `search` |
| Library | `Array` (including `toSorted` / `toReversed` / `toSpliced` / `with`), `String`, `Math`, `Number`, `Map`, `Set`, `Date` (UTC), `JSON` (`JSON.parse(text) as T` is validated), `Error` with `cause`, `AggregateError`, `BigInt`, `Uint8Array` and the other typed arrays, `ArrayBuffer`, `DataView`, `TextEncoder` / `TextDecoder`, `structuredClone` |
| Modules | ES modules: named and default exports, namespace imports, re-exports, `import type`; built-in `e7:crypto`, `e7:encoding`, `e7:json`, `e7:test` |
| E7 extras | machine integers `i8` … `u64`, key handles for keys the app keeps, instruction budgets and memory limits, signed bytecode |

## Not supported

| Not supported | Why | Write instead |
|---|---|---|
| `any`, `unknown`, `object` as types | every type is known when the script is compiled | a concrete type, an interface, or `T \| null` |
| unions of different types (`string \| number`), discriminated unions of objects | the representation of a value would depend on the value | one interface with a `kind` field and optional fields |
| index signatures, `Record`, `Partial`, mapped / conditional / `keyof` / `typeof` / template literal types, intersections | type-level computation; the object layout must be fixed | `Map<K, V>`, or write the interface out |
| `Symbol` values, `Proxy`, `Reflect`, `eval`, `for...in`, `delete`, `in` | property names are fixed when compiling | `Object.keys`, a `Map` |
| `var`, class expressions, mixins, decorators, namespaces, JSX, non-ASCII identifiers | not needed by E7's scripts | `let` / `const`, classes, ES modules |
| timers and I/O (`setTimeout`, `fetch`, `fs`) | the app is the event loop and owns all I/O | an async host function (`declare function f(): Promise<T>`) or data passed in |
| `Intl`, locale formatting, `normalize`, `WeakMap` / `WeakSet` | locale and Unicode data differ between platforms; no weak references in the collector | ISO formats, `Map` |
| an object literal with `get x()` passed where an interface declares the property `x: T` | e7 reads interface properties as fields | declare the accessor in the interface: `get x(): T` |

A few runtime details differ from JavaScript on purpose (reading past the end of an array is an error,
machine integers wrap, dates are UTC): see the [spec, section 9](reference/SPEC.md#9-known-differences-from-javascript-summary).
