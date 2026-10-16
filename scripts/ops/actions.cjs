"use strict";
const group = (name, rows) =>
  rows.map(([id, label, input]) => ({ id, label, group: name, input }));
module.exports = [
  ...group("setup", [
    ["env-init", "Create environment template (never overwrite)"],
    ["doctor", "Check tools/environment (secrets redacted)"],
    ["install", "Install locked dependencies"],
    ["browser-install", "Install Chromium for browser tests"],
  ]),
  ...group("quality", [
    ["dev", "Run development frontend (localhost)", "port"],
    ["build", "Build production frontend"],
    ["start", "Run production frontend (localhost)", "port"],
    ["lint", "Lint without fixing"],
    ["lint-fix", "Lint and fix source files"],
    ["typecheck", "Type-check"],
    ["test", "Run unit tests"],
    ["test-browser", "Run browser tests against local production build"],
    ["console-test", "Test operations console"],
    ["audit-ui", "Audit page, button and navigation contracts"],
    ["verify", "Lint + unit tests + production build + UI audit"],
    ["dependency-audit", "Audit production dependencies"],
  ]),
  ...group("maintenance", [
    ["health", "Check backend health through frontend proxy", "url"],
    ["cache-clean", "Remove local .next build cache", "clean"],
    ["open-backend", "Open sibling backend console (admins, DB, permissions)"],
  ]),
];
