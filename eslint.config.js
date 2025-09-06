const js = require('@eslint/js')
const typescript = require('@typescript-eslint/eslint-plugin')
const typescriptParser = require('@typescript-eslint/parser')
const prettier = require('eslint-plugin-prettier')
const prettierConfig = require('eslint-config-prettier')

module.exports = [
	js.configs.recommended,
	prettierConfig,
	{
		files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
		ignores: ['dist/**', 'node_modules/**', '*.js', 'scripts/**'],
		languageOptions: {
			parser: typescriptParser,
			ecmaVersion: 2022,
			sourceType: 'module',
			parserOptions: {
				project: './tsconfig.json'
			},
			globals: {
				console: 'readonly',
				process: 'readonly',
				Buffer: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				module: 'readonly',
				require: 'readonly',
				setTimeout: 'readonly',
				setInterval: 'readonly',
				clearTimeout: 'readonly',
				clearInterval: 'readonly',
				setImmediate: 'readonly',
				clearImmediate: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': typescript,
			prettier: prettier
		},
		rules: {
			...typescript.configs.recommended.rules,
			'prettier/prettier': 'error',
			'semi': ['error', 'never'],
			'comma-dangle': ['error', 'never'],
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/consistent-type-definitions': ['error', 'type'],
			'@typescript-eslint/no-require-imports': 'off',
			'prefer-const': 'off',
			'func-style': ['error', 'declaration', { allowArrowFunctions: false }],
			'no-restricted-syntax': [
				'error',
				{
					selector: 'TSInterfaceDeclaration',
					message: 'Use type instead of interface'
				},
				{
					selector: "VariableDeclaration[kind='const'] > VariableDeclarator > ArrowFunctionExpression",
					message: 'Use function declarations instead of arrow function constants'
				},
				{
					selector: "VariableDeclaration[kind='let'] > VariableDeclarator > ArrowFunctionExpression",
					message: 'Use function declarations instead of arrow function constants'
				}
			]
		}
	}
]
