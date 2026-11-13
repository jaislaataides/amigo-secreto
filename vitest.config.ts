import { defineConfig } from "vitest/config";
import { FAKE_FIREBASE_ADMIN_ENV } from "./test/fixtures/fakeFirebaseAdminEnv";

export default defineConfig({
  test: {
    environment: "node",
    include: ["api/**/*.test.ts", "src/**/*.test.ts", "src/**/*.test.tsx"],
    env: FAKE_FIREBASE_ADMIN_ENV,
  },
});
