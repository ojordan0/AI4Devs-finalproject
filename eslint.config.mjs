import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".claude/**",
      ".claude-auth/**",
      ".impeccable/**",
      ".next/**",
      "coverage/**",
      "design/**",
      "docs/**",
      "next-env.d.ts",
      "openspec/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
