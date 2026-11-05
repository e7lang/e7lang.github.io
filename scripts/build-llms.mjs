// Builds /llms.txt (index for AI tools, https://llmstxt.org) and /llms-full.txt (all E7 docs in one
// Markdown file) from the site docs, the synced reference docs and the E7 AI skill.
//   node scripts/build-llms.mjs [path-to-e7-checkout]     (run after scripts/sync-docs.mjs)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const SITE = "https://e7lang.github.io";
const candidates = [process.argv[2], process.env.E7_SRC, "e7", "../e7", "../e7fvm"].filter(Boolean);
const e7 = candidates.map((p) => resolve(p)).find((p) => existsSync(join(p, "skills", "e7", "SKILL.md")));
if (!e7) {
  console.error("build-llms: e7 checkout with skills/e7 not found");
  process.exit(1);
}

// strip front matter, MDX imports/components so the text reads as plain Markdown
function clean(md) {
  return md
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/^import .*$/gm, "")
    .replace(/^<\/?(Tabs|TabItem)[^>]*>\s*$/gm, "")
    .replace(/:::(tip|note|info|warning|caution)( [^\n]*)?\n/g, "> ")
    .replace(/^:::\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
const read = (p) => clean(readFileSync(p, "utf8"));

const pages = [
  ["What is E7?", "docs/intro.md", "/docs/intro"],
  ["Getting started", "docs/getting-started.mdx", "/docs/getting-started"],
  ["Language tour", "docs/language-tour.md", "/docs/language-tour"],
  ["Calling scripts from your app", "docs/host-apps.mdx", "/docs/host-apps"],
  ["Using E7 with AI assistants", "docs/ai.md", "/docs/ai"],
  ["Language specification", "docs/reference/SPEC.md", "/docs/reference/SPEC"],
  ["Standard library (e7.d.ts)", "docs/reference/stdlib.md", "/docs/reference/stdlib"],
  ["Embedding guide (C API and bindings)", "docs/reference/EMBEDDING.md", "/docs/reference/EMBEDDING"],
];

const index = `# E7

> E7 is a strict subset of TypeScript compiled to verified bytecode and run by e7vm, a small embeddable VM
> (C API; Kotlin/Java, Swift, C#, JavaScript/WebAssembly bindings) inside Android, iOS, Windows, macOS and
> Linux apps — typically for server-delivered algorithms such as request signing and signature verification.
> E7 looks like TypeScript but rejects many TypeScript features (any, try/catch, user generics, regex, async,
> union types other than with null/undefined, index signatures); read "Writing E7" before generating code.

## Writing E7 (start here when generating code)

- [Writing E7: rules, rewrites and workflow](${SITE}/llms-full.txt): the E7 AI skill plus all documentation in one file
- [E7 skill for AI assistants](https://github.com/e7lang/e7/tree/main/skills/e7): SKILL.md with references and compile-checked examples
- [Using E7 with AI assistants](${SITE}/docs/ai): how to install the skill in Claude Code and other tools

## Docs

${pages.filter(([t]) => t !== "Using E7 with AI assistants").map(([t, , u]) => `- [${t}](${SITE}${u})`).join("\n")}

## Tools

- [Playground](${SITE}/playground): compile and run E7 in the browser
- [Releases](https://github.com/e7lang/e7/releases/latest): e7 / e7c binaries, packages for Swift, Android/JVM, .NET, npm, VS Code
- [Source](https://github.com/e7lang/e7)
`;

const skill = join(e7, "skills", "e7");
const parts = [
  "# E7 documentation (full text for AI assistants)\n\nSource: " + SITE + ". Generated from the website docs and the E7 AI skill.",
  "# Writing E7 (AI skill)\n\n" + clean(readFileSync(join(skill, "SKILL.md"), "utf8")),
  "# E7 language reference for writing code\n\n" + clean(readFileSync(join(skill, "references", "language.md"), "utf8")).replace(/^# .*\n/, ""),
  "# Testing E7 scripts\n\n" + clean(readFileSync(join(skill, "references", "testing.md"), "utf8")).replace(/^# .*\n/, ""),
  ...pages.map(([t, p]) => `# ${t}\n\n` + read(p).replace(/^# .*\n/, "")),
];
writeFileSync("static/llms.txt", index);
writeFileSync("static/llms-full.txt", parts.join("\n\n---\n\n") + "\n");
console.log(`wrote static/llms.txt (${index.length} chars) and static/llms-full.txt`);
