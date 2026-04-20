const js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
    {
        ignores: ["node_modules/**", "playwright-report/**", "html-report/**", "coverage/**"]
    },
    {
        files: ["back_end/**/*.js", "front_end/js/**/*.js", "phase3_website/back_end/**/*.js", "phase3_website/front_end/js/**/*.js"],
        rules: {
            "complexity": ["warn", 10],
            "no-undef": "off",
            "no-unused-vars": "warn"
        }
    }
];
