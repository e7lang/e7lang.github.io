// @ts-check
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
module.exports = {
  docs: [
    "intro",
    "getting-started",
    "language-tour",
    "host-apps",
    "ai",
    {
      type: "category",
      label: "Reference",
      collapsed: false,
      items: [
        "reference/SPEC",
        "reference/stdlib",
        "reference/EMBEDDING",
        "reference/DEBUGGING",
        "reference/BYTECODE",
        "reference/DESIGN",
        "reference/PRODUCTION",
      ],
    },
  ],
};
