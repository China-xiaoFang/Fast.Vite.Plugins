import eslintJs from "@eslint/js";
import eslintMarkdown from "@eslint/markdown";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigFlatGitignore from "eslint-config-flat-gitignore";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintPluginImportX from "eslint-plugin-import-x";
import eslintPluginJsonc from "eslint-plugin-jsonc";
import eslintPluginRegexp from "eslint-plugin-regexp";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
	// 忽略依赖、构建结果、压缩文件、锁文件和测试夹具；普通源码与文档仍参与检查。
	globalIgnores(
		[
			"**/node_modules/**",
			"**/{build,coverage,dist,output,temp,tmp}/**",
			"**/{.cache,.nitro,.nuxt,.output,.vercel}/**",
			"**/{.vite-inspect,.vitepress/cache}/**",
			"**/__snapshots__/**",
			"**/*.min.*",
			"**/auto-import?(s).d.ts",
			"**/components.d.ts",
			"**/{bun,deno,yarn}.lock",
			"**/bun.lockb",
			"**/package-lock.json",
			"**/pnpm-lock.yaml",
			"tests/fixtures/**/*.vue",
			"tests/fixtures/**/*.svg",
		],
		"fast-vite-plugins/ignores"
	),
	// 读取仓库根目录的 .gitignore，避免 ESLint 检查未纳入版本控制的文件。
	{
		name: "fast-vite-plugins/gitignore",
		...eslintConfigFlatGitignore({ strict: false }),
	},
	// 跨 JavaScript 与 TypeScript 生效的基础规则。
	{
		name: "fast-vite-plugins/common",
		files: ["**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}"],
		linterOptions: {
			// 无效的 eslint-disable 注释通常表示规则已经变化，应及时清理。
			reportUnusedDisableDirectives: "error",
		},
		rules: {
			// 要求数组回调在所有可到达分支返回值，避免 map/filter 等调用静默产生 undefined。
			"array-callback-return": "error",
			// 浏览器弹窗通常不适合生产代码；使用 warn 允许原型调试，同时确保发布前能够被发现。
			"no-alert": "warn",
			// switch 的 case 不创建词法作用域；要求用花括号包裹声明，避免跨 case 冲突。
			"no-case-declarations": "error",
			// 禁止反斜杠续行字符串，优先使用可读性更好的模板字符串。
			"no-multi-str": "error",
			// with 会让标识符解析不可预测，并且在严格模式和 ESM 中不可用。
			"no-with": "error",
			// 允许用 `void promise` 明确忽略 Promise，但禁止在普通表达式中滥用 void。
			"no-void": ["error", { allowAsStatement: true }],
			// 要求严格相等；保留 `value == null` 同时判断 null/undefined 的常用写法。
			eqeqeq: ["error", "always", { null: "ignore" }],
			// 幂运算统一使用 **，减少 Math.pow 嵌套并保持现代语法风格。
			"prefer-exponentiation-operator": "error",
			// 使用 Object.hasOwn，避免对象覆盖或缺少 hasOwnProperty 时产生异常。
			"prefer-object-has-own": "error",
			// 声明间顺序交给 import-x；这里只排序同一 import 的成员。
			"sort-imports": [
				"warn",
				{
					allowSeparatedGroups: false,
					ignoreCase: false,
					ignoreDeclarationSort: true,
					ignoreMemberSort: false,
					memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
				},
			],
		},
	},
	// @eslint/js 提供 JavaScript 基础正确性规则；本段只补充有明确维护理由的规则。
	{
		name: "fast-vite-plugins/javascript",
		files: ["**/*.{cjs,js,jsx,mjs}"],
		extends: [eslintJs.configs.recommended],
		languageOptions: {
			ecmaVersion: "latest",
			globals: globals.node,
			parserOptions: { ecmaFeatures: { jsx: true } },
			sourceType: "module",
		},
		rules: {
			// 控制台调用需要人工确认；warn/error 仍可用于必要的诊断输出。
			"no-console": ["warn", { allow: ["error", "warn"] }],
			// 防止调试断点进入发布代码并中断运行。
			"no-debugger": "error",
			// 禁止意外的恒定条件，但允许 while (true) 等有明确退出逻辑的循环。
			"no-constant-condition": ["error", { checkLoops: false }],
			// 禁止标签语句；包含多层循环 labeled break/continue 的代码应先重构控制流。
			"no-restricted-syntax": ["error", "LabeledStatement"],
			// 使用 let/const 替代 var；自动修复后应复核循环闭包和声明提升行为。
			"no-var": "error",
			// 禁止无说明的空代码块；允许用于“忽略失败”语义的空 catch。
			"no-empty": ["error", { allowEmptyCatch: true }],
			// 拒绝肉眼难以识别、可能导致解析差异的非常规空白字符。
			"no-irregular-whitespace": "error",
			// 变量和类先声明后使用；函数声明允许提升。
			"no-use-before-define": ["warn", { classes: true, functions: false, variables: true }],
			// 能保持引用不变的变量优先使用 const。
			"prefer-const": ["warn", { destructuring: "all", ignoreReadBeforeAssign: true }],
			// 优先箭头回调；自动修复后应复核 this、arguments 与函数名栈信息。
			"prefer-arrow-callback": ["error", { allowNamedFunctions: false, allowUnboundThis: true }],
			// 属性和值同名时使用对象简写，带引号键名不强制改写。
			"object-shorthand": ["error", "always", { avoidQuotes: true, ignoreConstructors: false }],
			// 使用 ||=、&&=、??=；涉及 getter 或 Proxy 时应复核求值次数。
			"logical-assignment-operators": ["error", "always", { enforceForIfStatements: true }],
			// 合并对象时优先展开语法，避免 Object.assign 的额外目标对象样板。
			"prefer-object-spread": "error",
			// 可变参数函数优先 rest 参数，避免依赖类数组 arguments。
			"prefer-rest-params": "error",
			// 调用可迭代对象时优先 spread，避免滥用 apply。
			"prefer-spread": "error",
			// 字符串拼接优先模板字符串，便于阅读和多段插值。
			"prefer-template": "error",
			// 同一作用域禁止重复声明，避免后声明遮盖前声明。
			"no-redeclare": "error",
		},
	},
	// TypeScript 使用类型感知的 recommended 与 stylistic 预置。
	{
		name: "fast-vite-plugins/typescript",
		files: ["**/*.{cts,mts,ts,tsx}"],
		extends: [...tseslint.configs.recommendedTypeChecked, ...tseslint.configs.stylisticTypeChecked],
		languageOptions: {
			ecmaVersion: "latest",
			parserOptions: {
				// Project Service 读取 tsconfig，为需要完整类型信息的规则提供语义数据。
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			// 使用 TypeScript 版本避免核心规则误判声明合并、类型和值的同名声明。
			"@typescript-eslint/no-redeclare": "error",
			// 未使用符号视为错误；以下划线开头表示参数或变量被有意忽略。
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					args: "after-used",
					argsIgnorePattern: "^_",
					caughtErrors: "all",
					caughtErrorsIgnorePattern: "^_",
					ignoreRestSiblings: true,
					varsIgnorePattern: "^_",
				},
			],
			// 声明文件、全局扩展和部分 SDK 仍需要 namespace。
			"@typescript-eslint/no-namespace": "off",
			// any 会绕过类型检查，但在第三方边界中有合理用途，因此只警告。
			"@typescript-eslint/no-explicit-any": "warn",
			// 默认要求 ESM import；工具链互操作代码需要时可按文件关闭。
			"@typescript-eslint/no-require-imports": "error",
			// 允许常见的短路和三元表达式调用模式。
			"@typescript-eslint/no-unused-expressions": ["error", { allowShortCircuit: true, allowTernary: true }],
			// 删除可由 TypeScript 明确推断的原始值类型标注，减少重复信息。
			"@typescript-eslint/no-inferrable-types": "error",
			// 非空断言可能隐藏空值缺陷，以警告提示逐步消除。
			"@typescript-eslint/no-non-null-assertion": "warn",
			// 可选链之后再做非空断言逻辑矛盾，通常表示边界条件设计有误。
			"@typescript-eslint/no-non-null-asserted-optional-chain": "error",
			// 类型依赖改用内联 type import；需复核仅靠 import 触发的模块副作用。
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					disallowTypeAnnotations: false,
					fixStyle: "inline-type-imports",
					prefer: "type-imports",
				},
			],
		},
	},
	// import-x 负责模块导入正确性、分组和排序，不猜测项目别名解析器。
	{
		name: "fast-vite-plugins/imports",
		files: ["**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}"],
		extends: [eslintPluginImportX.flatConfigs.recommended],
		rules: {
			// import 必须位于其他语句之前，避免模块依赖散落在执行逻辑中。
			"import-x/first": "error",
			// 合并同一模块的重复 import，避免绑定分散或副作用被误读。
			"import-x/no-duplicates": "error",
			// 按来源分组并排序；带副作用的裸 import 仅报告，移动前必须确认执行顺序。
			"import-x/order": [
				"error",
				{
					groups: [
						"builtin", // Node.js 内置模块
						"external", // 第三方依赖
						"internal", // 项目内部别名模块
						"parent", // 父级目录模块
						"sibling", // 同级目录模块
						"index", // 当前目录入口模块
						"object", // TypeScript import = require() 导入
						"type", // TypeScript 类型导入
						"unknown", // 无法识别分类的导入
					],
					"newlines-between": "always",
					alphabetize: { caseInsensitive: true, order: "asc" },
					warnOnUnassignedImports: true,
				},
			],
			// Vite/TypeScript 别名由项目编译器校验，避免共享配置绑定特定 resolver。
			"import-x/no-unresolved": "off",
			// 未配置 resolver 时，下列导出分析规则容易产生误报。
			"import-x/namespace": "off",
			"import-x/default": "off",
			"import-x/named": "off",
			// 不限制默认导出与相近命名导出的项目 API 风格。
			"import-x/no-named-as-default": "off",
			"import-x/no-named-as-default-member": "off",
		},
	},
	// 检查无效、冗余或容易产生回溯问题的正则表达式。
	{
		name: "fast-vite-plugins/regexp",
		files: ["**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx}"],
		extends: [eslintPluginRegexp.configs["flat/recommended"]],
	},
	// 严格 JSON 使用官方推荐规则。
	{
		name: "fast-vite-plugins/json",
		files: ["**/*.json"],
		extends: [eslintPluginJsonc.configs["flat/recommended-with-json"]],
	},
	// JSONC 允许注释和尾随逗号，不能复用严格 JSON 解析规则。
	{
		name: "fast-vite-plugins/jsonc",
		files: ["**/*.jsonc"],
		extends: [eslintPluginJsonc.configs["flat/recommended-with-jsonc"]],
	},
	{
		name: "fast-vite-plugins/vscode-jsonc",
		files: ["**/.vscode/settings.json"],
		rules: {
			// VS Code 的 settings.json 使用带注释的 JSONC 方言。
			"jsonc/no-comments": "off",
		},
	},
	// JSON5 使用自己的官方推荐预置。
	{
		name: "fast-vite-plugins/json5",
		files: ["**/*.json5"],
		extends: [eslintPluginJsonc.configs["flat/recommended-with-json5"]],
	},
	// 检查 Markdown 文档结构；代码块由各语言配置单独负责。
	{
		name: "fast-vite-plugins/markdown",
		files: ["**/*.md"],
		extends: [eslintMarkdown.configs.recommended],
	},
	// 浏览器集成夹具允许使用 document、window 等浏览器全局变量。
	{
		name: "fast-vite-plugins/browser-fixtures",
		files: ["tests/fixtures/integration/**/*.js"],
		languageOptions: { globals: globals.browser },
	},
	// 最后关闭与 Prettier 冲突的格式规则；ESLint 本身不会执行 Prettier。
	{
		...eslintConfigPrettier,
		name: "fast-vite-plugins/prettier",
	}
);
