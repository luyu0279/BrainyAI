const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json",
                // projectFolderIgnoreList: ['**/node_modules', '**/build', "**/.plasmo", "**/resources/js", "tailwind.config.js", "scripts"],
                ecmaFeatures: {
                    jsx: true
                }
            },
        },
        rules: {
            "indent"           : [1, 4],
            "no-else-return"   : 1,
            "semi"             : [1, "always"],
            "space-unary-ops"  : 2,
            "no-console"       : 2,
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/prefer-for-of": "warn",
            "@typescript-eslint/ban-ts-ignore": "off"
        },
    },
    ...tseslint.configs.stylistic,
    {
        ignores: ["eslint.config.cjs", "tailwind.config.js", "build", ".plasmo", "resources/", ".prettierrc.mjs", "postcss.config.js"]
    }
);
