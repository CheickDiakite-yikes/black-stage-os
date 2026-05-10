import js from "@eslint/js";
import tseslint from "typescript-eslint";

const browserGlobals = {
  document: "readonly",
  window: "readonly",
  HTMLElement: "readonly",
  console: "readonly"
};

export default [
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "node_modules/**",
      "BlackStage_OS_Build_Pack/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: browserGlobals
    }
  }
];
