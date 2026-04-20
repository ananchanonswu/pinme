module.exports = [
    {
        ignores: ["phase3_website/**", "node_modules/**", "playwright-report/**", "html-report/**", "coverage/**"]
    },
    {
        files: ["back_end/**/*.js", "front_end/js/**/*.js"],
        rules: {
            "complexity": ["warn", 10]
        }
    }
];
