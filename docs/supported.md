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
reason and what to write instead (154 supported, 16 partly, 80 not).

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
| Library | `Array` (including `toSorted` / `toReversed` / `toSpliced` / `with`), `String`, `Math`, `Number`, `Map`, `Set`, `Date` (UTC), `JSON` (`JSON.parse(text) as T` is validated), `Error` with `cause`, `AggregateError`, `BigInt`, `Uint8Array` and the other typed arrays, `ArrayBuffer`, `DataView`, `TextEncoder` / `TextDecoder`, `structuredClone` |
| Modules | ES modules: named and default exports, namespace imports, re-exports, `import type`; built-in `e7:crypto`, `e7:encoding`, `e7:json`, `e7:test` |
| E7 extras | machine integers `i8` … `u64`, key handles for keys the app keeps, instruction budgets and memory limits, signed bytecode |

## Not supported

Each of these is a compile error that names the feature and suggests what to write instead.

| Not supported | Why | Write instead |
|---|---|---|
| `any`, `object`, `unknown` (except a `catch` variable) | every type is known when the script is compiled | a concrete type, an interface, or `T \| null` |
| unions of different types (`string \| number`), discriminated unions, `in` narrowing, intersections `A & B` | the representation of a value would depend on the value | one interface with a `kind` field and optional fields; an interface that extends both |
| index signatures, `Record`, `Partial`, `Pick`, `Omit`, `Required`, `Readonly`, `Exclude`, `ReturnType` and the other utility types; mapped, conditional, `keyof`, `typeof`, indexed access and template literal types | type-level computation; the object layout must be fixed | `Map<K, V>`, or write the interface out |
| optional and rest elements in tuple types (`[A, B?]`, `[A, ...B[]]`) | tuple layouts are fixed | `[A, B \| undefined]`, or an interface |
| `Symbol()` values, well-known symbols other than `[Symbol.iterator]`, `Proxy`, `Reflect`, `eval`, `new Function`, `globalThis`, `for...in`, `delete` | property names and code are fixed when compiling | `Object.keys`, a `Map`, an optional property set to `undefined`, string constants |
| function overloads, constructor overloads, `this` parameters, `arguments`, `call` / `apply` / `bind`, properties on functions, call and construct signatures, generic function types `<T>(x: T) => T`, generic methods in interfaces | each function has one signature and one compiled body | separate functions, optional parameters, rest parameters, a factory function, a generic function |
| methods as values (`arr.map(obj.method)`) | methods are not values | `arr.map(x => obj.method(x))` |
| class expressions, mixins, classes as values (`typeof C`), extending `Error` / `Map` / `Array`, index signatures in classes, `accessor` fields, `new.target`, `#x in obj`, `instanceof` with a generic class, `Box<Circle>` assigned to `Box<Shape>` | classes are declared, not created at run time; each instantiation of a generic class is its own class | class declarations, composition, `instanceof` on a non-generic base class, the wider type argument from the start |
| enums as run-time objects (`E[value]`, `Object.keys(E)`), heterogeneous enums, `declare enum` | enums are compile-time constants | a `switch` or a `Map<E, string>` |
| throwing values that are not `Error` objects | a `catch` variable is an `Error` | `throw new Error(message)` |
| `var`, decorators, namespaces, `declare global`, `declare module`, `declare const` / `declare class`, JSX, non-ASCII identifiers | not needed by E7's scripts, or need run-time metadata | `let` / `const`, ES modules, host functions (`declare function`) |
| dynamic `import()`, `import.meta`, circular imports | the host loads modules; a module is verified as a whole | static imports; move shared declarations into a third module |
| regular expressions (`/.../`, `RegExp`, `match`, `matchAll`, `search`) | an engine and its Unicode tables would add about 160 KB to every app | `indexOf`, `includes`, `startsWith`, `endsWith`, `split`, `replaceAll`, `trim` |
| timers and I/O (`setTimeout`, `setInterval`, `queueMicrotask`, `fetch`, `fs`) | the app is the event loop and owns all I/O | an async host function (`declare function f(): Promise<T>`) or data passed in |
| `Intl`, `toLocaleString`, `normalize`, locale-aware `localeCompare` | locale and Unicode data differ between platforms | ISO formats, `toFixed`, `padStart` |
| `WeakMap`, `WeakSet`, `WeakRef`, `FinalizationRegistry`, `SharedArrayBuffer`, `Atomics` | no weak references in the collector; no threads in a script | `Map` / `Set` with explicit removal, `ArrayBuffer` |
| `Array.isArray` | the static type already says it | nothing |
| an object literal with `get x()` passed where an interface declares the property `x: T` | E7 reads interface properties as fields | declare the accessor in the interface: `get x(): T` |

## Partly supported

| Feature | Works | Not supported |
|---|---|---|
| Union types | `T \| null \| undefined`, unions of literals of one type | unions of different types |
| `unknown` | a `catch` variable (narrow with `instanceof Error`) | `unknown` values elsewhere |
| `typeof` | `typeof x` as a compile-time constant | narrowing a union by `typeof` |
| `==` / `!=` | `x == null` / `x != null` | other loose comparisons (use `===`) |
| Computed property names | keys known at compile time (literals, literal consts, enum members) | keys computed at run time (use `Map`) |
| Generic functions as values | when a contextual function type fixes the type arguments | uninstantiated generic function values |
| Function compatibility with fewer parameters | function literals with fewer parameters | function values with fewer parameters (wrap in an arrow) |
| Custom iterables | `[Symbol.iterator]()` written as a generator | hand-written iterator objects with `next()` |
| Enum members | constant expressions | members computed at run time |
| `declare` fields | declaring a field set by the constructor | narrowing an inherited field's type |
| `JSON` | `JSON.stringify`, `JSON.parse(text) as T` (validated against `T`) | untyped `JSON.parse`, revivers |
| `Object` static methods | `keys`, `values`, `entries`, `assign`, `freeze` | `create`, `defineProperty`, prototypes, `fromEntries`, `groupBy` |
| `structuredClone` | arrays, object literals, `Map`, `Set`, `Date`, typed arrays, errors | class instances (write a `clone()` method) |
| `Date` | UTC: constructors, getters and setters, ISO strings | local time zones and locale formatting |
| Errors | `Error` and its subclasses, `cause`, `AggregateError`, `instanceof` | `stack` |
| Typed arrays | all typed arrays, `ArrayBuffer`, `DataView` | `SharedArrayBuffer`, `Atomics` |

A few runtime details differ from JavaScript on purpose (reading past the end of an array is an error,
machine integers wrap, dates are UTC): see the [spec, section 9](reference/SPEC.md#9-known-differences-from-javascript-summary).
