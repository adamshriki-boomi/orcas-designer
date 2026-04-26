import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // The codebase intentionally fetches data on user-change inside an
      // effect (every Supabase-backed hook follows this pattern). The rule
      // assumes apps use Suspense + use() for data fetching; we don't yet.
      // Keep visibility as a warning so genuine cascading-render bugs still
      // surface, without erroring on the universal pattern.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
