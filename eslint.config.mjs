import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    globalIgnores([
        "**/node_modules",
        "**/build",
        "**/dist",
        "**/plugins"
    ]), {
        files: ["*.js"],
        extends: compat.extends("eslint:recommended"),
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.commonjs,
            },
            ecmaVersion: 12,
            sourceType: "commonjs"
        },
        rules: {
            semi: ["error", "always"],
            quotes: ["error", "double", {
                avoidEscape: true,
                allowTemplateLiterals: true,
            }],
            "no-inner-declarations": "off",
            "no-unused-vars": ["error", {
                caughtErrors: "none"
            }]
        }
    }, {
        files: ["eslint.config.mjs"],
        languageOptions: {
            ecmaVersion: 12,
            sourceType: "module",
        }
    }
]);