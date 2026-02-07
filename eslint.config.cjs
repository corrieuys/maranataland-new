const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const parser = require("@typescript-eslint/parser");

module.exports = [
  {
    ignores: [
      "public/**",
      "node_modules/**",
      "dist/**",
      "worker-configuration.d.ts",
      ".wrangler/**",
      "drizzle/**",
      "migrations/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-undef": "off",
      ...tseslint.configs.recommended.rules,
    },
  },
];
