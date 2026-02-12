import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";

export default defineConfig([
  ...nextCoreWebVitals,
  prettier,
  globalIgnores([".next/**", "out/**", "build/**"]),
]);
