// ESLint config for the Amano src/ tree. Legacy flat files are ignored during the
// rewrite (see .eslintignore) and removed in the cleanup slice.
module.exports = {
  root: true,
  extends: ["@react-native", "plugin:import/typescript"],
  plugins: ["import", "react-hooks"],
  settings: {
    "import/resolver": {
      typescript: { project: "./tsconfig.json" },
    },
  },
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    // Imports ordered & grouped; absolute aliases first, then relative.
    "import/order": [
      "warn",
      {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        pathGroups: [
          { pattern: "@app/**", group: "internal" },
          { pattern: "@navigation/**", group: "internal" },
          { pattern: "@theme/**", group: "internal" },
          { pattern: "@i18n/**", group: "internal" },
          { pattern: "@components/**", group: "internal" },
          { pattern: "@features/**", group: "internal" },
          { pattern: "@services/**", group: "internal" },
          { pattern: "@data/**", group: "internal" },
          { pattern: "@hooks/**", group: "internal" },
          { pattern: "@domain/**", group: "internal" },
        ],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],
  },
};
