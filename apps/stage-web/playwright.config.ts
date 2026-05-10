import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 8_000
  },
  use: {
    baseURL: "http://127.0.0.1:4187",
    trace: "retain-on-failure",
    viewport: {
      width: 1440,
      height: 1000
    }
  },
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 4187 --strictPort",
    url: "http://127.0.0.1:4187",
    reuseExistingServer: false,
    timeout: 60_000
  }
});
