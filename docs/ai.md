---
sidebar_position: 5
title: Using E7 with AI assistants
description: Install the E7 skill so Claude and other AI assistants write E7 instead of plain TypeScript.
---

# Using E7 with AI assistants

E7 looks like TypeScript, so AI assistants tend to write TypeScript that E7 rejects: generics, `any`,
regular expressions, union types, async code, `finally`. The **E7 skill** tells them, before they
write a line:

- that they are writing E7, a strict subset of TypeScript;
- what E7 rejects and how to write it instead (a rewrite for every rejected feature);
- the standard library, `e7:crypto`, `e7:encoding`, `e7:test` and the integer types;
- the rules for functions the app calls (only host types cross the boundary);
- to compile-check every script with `e7c --check` and test it with `e7 test`.

Every code example in the skill is compiled and run in E7's CI, so it cannot drift from the language.

## Does it help?

We gave three realistic tasks (a webhook verifier for an Android app, porting a TypeScript utility that uses
generics, regex and `try`/`catch`, and a remote-config parser) to an assistant with and without the skill.
Both had the E7 compiler available.

| | With the skill | Without |
|---|---|---|
| Checks passed | **17 / 17** | 15 / 17 |
| Average time per task | **127 s** | 206 s |

Both misses without the skill were functions that compile and pass their own tests but return an object or
a tuple to the app, which an app cannot receive — exactly the kind of rule the skill teaches.

## Claude Code

Install the plugin from the E7 repository:

```bash
/plugin marketplace add e7lang/e7
/plugin install e7@e7lang
```

On Claude Code 2.1.275 or later, `/plugin install e7 --marketplace e7lang/e7` does both in one step. From a
shell: `claude plugin marketplace add e7lang/e7` and `claude plugin install e7@e7lang`.

Claude then uses the skill automatically whenever you work on E7 code (`.e7` files, `.ts` files that import
`e7:` modules, or when you mention E7). You can also call it explicitly with `/e7:e7`.

Without the plugin system, copy the skill folder instead:

```bash
git clone --depth 1 https://github.com/e7lang/e7.git
cp -r e7/skills/e7 ~/.claude/skills/e7          # for you, in every project
cp -r e7/skills/e7 your-project/.claude/skills/  # for everyone working on a project
```

## claude.ai and the Claude API

Every [release](https://github.com/e7lang/e7/releases/latest) includes `e7-skill.zip`:

- **claude.ai**: upload `e7-skill.zip` as a custom skill in your settings (plans with code execution enabled).
- **Claude API**: upload it with the Skills API and reference it in `container.skills`.

## Other assistants

Assistants that can read web pages can use the docs written for them:

- [`/llms.txt`](https://e7lang.github.io/llms.txt): an index of the E7 docs
- [`/llms-full.txt`](https://e7lang.github.io/llms-full.txt): the skill and all documentation in one file

For tools that read project instructions (an `AGENTS.md`, rules files and similar), add a short note such as:

```text
Scripts in scripts/ are E7 (a strict TypeScript subset), not TypeScript. Before writing them, read
https://e7lang.github.io/llms-full.txt. Check every change with `e7c --check <file>` and run `e7 test`.
```

## Tips

- Ask for tests: "write it with `e7 test` tests" gives the assistant a fast feedback loop.
- If the E7 toolchain is not installed where the assistant runs, it can still check code with the npm package
  (`e7-js check`) or you can paste the result into the [playground](/playground).
- Keep the functions your app calls simple: strings, numbers, booleans, integers, `Uint8Array` and `KeyHandle`.
  Ask for JSON strings when the app needs structured results.
