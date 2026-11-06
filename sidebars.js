// @ts-check
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
module.exports = {
  docs: [
    "intro",
    "getting-started",
    "language-tour",
    "supported",
    "host-apps",
    "ai",
    {
      type: "category",
      label: "Reference",
      collapsed: false,
      items: [
        "reference/SPEC",
        "reference/TYPESCRIPT",
        "reference/stdlib",
        "reference/EMBEDDING",
        "reference/DEPLOYMENT",
        "reference/DEBUGGING",
        "reference/BYTECODE",
        "reference/DESIGN",
        "reference/DESIGN-0.3",
        "reference/PRODUCTION",
        "reference/ROADMAP",
      ],
    },
  ],
};
