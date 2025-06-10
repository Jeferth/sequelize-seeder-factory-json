import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      ecmaVersion: 2021,
      sourceType: "commonjs",
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      sourceType: "module",
    },
  },
];
