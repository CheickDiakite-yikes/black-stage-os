import js from "@eslint/js";
import tseslint from "typescript-eslint";

const browserGlobals = {
  Blob: "readonly",
  URL: "readonly",
  clearTimeout: "readonly",
  document: "readonly",
  globalThis: "readonly",
  localStorage: "readonly",
  navigator: "readonly",
  setTimeout: "readonly",
  window: "readonly",
  HTMLElement: "readonly",
  console: "readonly"
};

const nodeGlobals = {
  Buffer: "readonly",
  console: "readonly",
  process: "readonly"
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
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      globals: nodeGlobals
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: browserGlobals
    }
  }
];
