import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist",
    "playwright-report",
    "test-results",
  ]),

  {
    files: ["**/*.{js,jsx}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.browser,
      },

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      /*
       * Existing pages intentionally load API data from effects.
       * React Hooks v7 flags synchronous state updates inside these
       * effects, but these flows are already tested and working.
       */
      "react-hooks/set-state-in-effect": "off",

      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],
    },
  },

  {
    files: [
      "e2e/**/*.js",
      "playwright.config.js",
    ],

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },

    rules: {
      "react-refresh/only-export-components": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },

  /*
   * These files intentionally export helpers/context/hooks alongside
   * components, so Fast Refresh warnings are not useful here.
   */
  {
    files: [
      "src/components/Dialog.jsx",
      "src/components/Toast.jsx",
      "src/context/AuthContext.jsx",
      "src/components/admin/AdminSections.jsx",
      "src/components/vendor/VendorSections.jsx",
    ],

    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
]);