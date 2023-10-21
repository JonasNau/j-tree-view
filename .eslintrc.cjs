module.exports = {
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "import"],
	extends: ["plugin:@typescript-eslint/recommended", "prettier"],
	rules: {
		"quotes": "off",
		"@typescript-eslint/quotes": "off",
		"prefer-const": "off",
		"import/no-unused-modules": "off",
		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/no-array-constructor": "off",
	},
	// Exclude the following folders from linting
	ignorePatterns: [
		"node_modules/",
		"production/",
		"webapp/includes/frameworks",
	],
};
