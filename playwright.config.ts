import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./test/browser",
  testMatch: "**/*.e2e.ts",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3107",
    serviceWorkers: "allow",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3107",
    url: "http://127.0.0.1:3107/offline",
    timeout: 60000,
    reuseExistingServer: false,
  },
});
