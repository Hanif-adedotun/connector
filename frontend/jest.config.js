const path = require("path");
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: path.join(__dirname) });

/** @type {import('jest').Config} */
const config = {
  displayName: "frontend",
  rootDir: __dirname,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  testMatch: [
    "<rootDir>/src/**/*.test.ts",
    "<rootDir>/src/**/*.test.tsx",
  ],
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{ts,tsx}",
    "!<rootDir>/src/middleware.ts",
    "!<rootDir>/src/app/**",
  ],
  coveragePathIgnorePatterns: [
    "<rootDir>/src/middleware.ts",
    "<rootDir>/src/app/",
    "<rootDir>/src/lib/push.ts",
    "<rootDir>/src/components/ui/delete.tsx",
    "<rootDir>/src/hooks/usePushNotifications.ts",
    "<rootDir>/src/hooks/useServiceWorker.ts",
    "<rootDir>/src/lib/service-worker.ts",
    "<rootDir>/src/lib/query-persister.ts",
    "<rootDir>/src/lib/supabase/server.ts",
    "<rootDir>/src/lib/supabase/client.ts",
    "<rootDir>/src/components/feed/FeedItem.tsx",
    "<rootDir>/src/components/brand/BriefWordmark.tsx",
  ],
};

module.exports = createJestConfig(config);
