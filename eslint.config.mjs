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
	// 忽略依赖、构建结果、缓存、生成文件和包管理器锁文件。
	globalIgnores(
		[
			"**/node_modules/**",
			"**/{dist,build,coverage,output,temp,tmp}/**",
			"**/{.cache,.nuxt,.output,.vercel,.nitro}/**",
			"**/{.vitepress/cache,.vite-inspect}/**",
			"**/__snapshots__/**",
			"**/*.min.*",
			"**/auto-import?(s).d.ts",
			"**/components.d.ts",
			"**/package-lock.json",
			"**/yarn.lock",
			"**/pnpm-lock.yaml",
			"**/bun.lock",
			"**/bun.lockb",
			"**/deno.lock",
		],
		"fast-vite-plugins/ignores/global"
	),
	// 项目测试夹具由对应工具解析，不交给通用 ESLint 配置处理。
	globalIgnores(["tests/fixtures/**/*.vue", "tests/fixtures/**/*.svg"], "fast-vite-plugins/ignores"),
	// 读取项目 `.gitignore`，补充仓库自己的忽略范围。
	{
		name: "fast-vite-plugins/ignores/git",
		...eslintConfigFlatGitignore({ strict: false }),
	},
	// Node.js 项目的 JavaScript 与 TypeScript 文件使用 Node.js 全局变量。
	{
		name: "fast-vite-plugins/globals/node",
		files: ["**/*.{js,cjs,mjs,jsx}", "**/*.{ts,cts,mts,tsx}"],
		languageOptions: {
			globals: globals.node,
		},
	},
	// 配置、脚本、测试与 CLI 等工程文件允许使用 console。
	{
		name: "fast-vite-plugins/globals/node-tooling",
		files: [
			["**/*.{config,setup}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}", "**/*.{js,cjs,mjs,jsx}"],
			["**/*.{config,setup}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}", "**/*.{ts,cts,mts,tsx}"],
			["**/{scripts,bin}/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}", "**/*.{js,cjs,mjs,jsx}"],
			["**/{scripts,bin}/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}", "**/*.{ts,cts,mts,tsx}"],
			["**/{test,tests}/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}", "**/*.{js,cjs,mjs,jsx}"],
			["**/{test,tests}/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}", "**/*.{ts,cts,mts,tsx}"],
			["**/*.{test,spec}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}", "**/*.{js,cjs,mjs,jsx}"],
			["**/*.{test,spec}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}", "**/*.{ts,cts,mts,tsx}"],
			["**/cli.{js,cjs,mjs,ts,cts,mts}", "**/*.{js,cjs,mjs,jsx}"],
			["**/cli.{js,cjs,mjs,ts,cts,mts}", "**/*.{ts,cts,mts,tsx}"],
		],
		languageOptions: {
			globals: globals.node,
		},
		rules: {
			"no-console": "off",
		},
	},
	// 跨 JavaScript、TypeScript 与 Vue 脚本生效的公共规则。
	{
		name: "fast-vite-plugins/common",
		files: ["**/*.{js,cjs,mjs,jsx}", "**/*.{ts,cts,mts,tsx}"],
		linterOptions: {
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
			"no-void": [
				"error",
				{
					allowAsStatement: true,
				},
			],
			// 要求严格相等；保留 `value == null` 同时判断 null/undefined 的常用写法。
			eqeqeq: ["error", "always", { null: "ignore" }],
			// 幂运算统一使用 **，减少 Math.pow 嵌套并保持现代语法风格。
			"prefer-exponentiation-operator": "error",
			// 使用 Object.hasOwn，避免对象覆盖或缺少 hasOwnProperty 时产生异常。
			"prefer-object-has-own": "error",

			// [可自动修复] 声明间顺序交给 import-x；这里只排序同一 import 的成员。
			"sort-imports": [
				"warn",
				{
					ignoreCase: false,
					ignoreDeclarationSort: true,
					ignoreMemberSort: false,
					memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
					allowSeparatedGroups: false,
				},
			],
		},
	},
	// JavaScript 本地覆写规则。
	{
		name: "fast-vite-plugins/javascript",
		files: ["**/*.{js,cjs,mjs,jsx}"],
		extends: [eslintJs.configs.recommended],
		languageOptions: {
			ecmaVersion: "latest",
			parserOptions: {
				ecmaFeatures: {
					// 普通 `.jsx` 文件需要显式开启 JSX 语法解析。
					jsx: true,
				},
			},
		},
		rules: {
			// 控制台调用在应用源码中需要人工确认；warn/error 仍可用于必要的诊断输出。
			"no-console": [
				"warn",
				{
					allow: ["warn", "error"],
				},
			],
			// 防止调试断点进入发布代码并中断运行。
			"no-debugger": "error",
			// 禁止意外的恒定条件，但允许 while (true) 等有明确退出逻辑的循环。
			"no-constant-condition": [
				"error",
				{
					checkLoops: false,
				},
			],
			// [高影响] 禁止标签语句；包含多层循环 labeled break/continue 的代码需先重构控制流。
			"no-restricted-syntax": ["error", "LabeledStatement"],
			// [高影响][可自动修复] 使用 let/const 替代 var；首次启用需复核循环闭包和声明提升行为。
			"no-var": "error",
			// 禁止无说明的空代码块；允许用于“忽略失败”语义的空 catch。
			"no-empty": [
				"error",
				{
					allowEmptyCatch: true,
				},
			],
			// 拒绝肉眼难以识别、可能导致解析差异的非常规空白字符。
			"no-irregular-whitespace": "error",
			// 变量和类先声明后使用；函数声明允许提升。warn 保留函数式组合和循环依赖重构空间。
			"no-use-before-define": [
				"warn",
				{
					classes: true,
					functions: false,
					variables: true,
				},
			],
			// [可自动修复] 能保持引用不变的变量优先使用 const；读取发生在赋值前时不做不可靠判断。
			"prefer-const": [
				"warn",
				{
					destructuring: "all",
					ignoreReadBeforeAssign: true,
				},
			],
			// [高影响][可自动修复] 优先箭头回调；批量修复后应复核 this/arguments 与函数名栈信息。
			"prefer-arrow-callback": [
				"error",
				{
					allowNamedFunctions: false,
					allowUnboundThis: true,
				},
			],
			// [可自动修复] 属性和值同名时使用对象简写，带引号键名不强制改写。
			"object-shorthand": [
				"error",
				"always",
				{
					ignoreConstructors: false,
					avoidQuotes: true,
				},
			],
			// [高影响][可自动修复] 使用 ||=、&&=、??=；涉及 getter/Proxy 的代码应复核求值次数。
			"logical-assignment-operators": ["error", "always", { enforceForIfStatements: true }],
			// [可自动修复] 合并对象时优先展开语法，避免 Object.assign 的额外目标对象样板。
			"prefer-object-spread": "error",
			// 可变参数函数优先 rest 参数，避免依赖类数组 arguments；该规则只报告，不自动改写签名。
			"prefer-rest-params": "error",
			// 调用可迭代对象时优先 spread；该规则只报告，避免自动改变 apply 的 this 语义。
			"prefer-spread": "error",
			// [可自动修复] 字符串拼接优先模板字符串，便于阅读和多段插值。
			"prefer-template": "error",
			// 同一作用域禁止重复声明，避免后声明遮盖前声明。
			"no-redeclare": "error",
		},
	},
	// TypeScript 本地覆写规则。
	{
		name: "fast-vite-plugins/typescript/type-checked",
		files: ["**/*.{ts,cts,mts,tsx}"],
		extends: [...tseslint.configs.recommendedTypeChecked, ...tseslint.configs.stylisticTypeChecked],
		languageOptions: {
			ecmaVersion: "latest",
			parserOptions: {
				projectService: true,
			},
		},
		rules: {
			// 使用 TypeScript 版本避免核心规则误判声明合并、类型和值的同名声明。
			"@typescript-eslint/no-redeclare": "error",
			// [高影响][可自动修复] 未使用符号视为错误；以下划线开头可显式表示参数或变量被有意忽略。
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
			// [默认关闭] 声明文件、全局扩展和部分 SDK 仍需要 namespace。
			"@typescript-eslint/no-namespace": "off",
			// any 会绕过类型检查，但在第三方边界和渐进式类型完善中有合理用途，因此只警告。
			"@typescript-eslint/no-explicit-any": "warn",
			// [高影响] 默认要求 ESM import；CommonJS、动态加载或工具链互操作代码可能需要按文件关闭。
			"@typescript-eslint/no-require-imports": "error",
			// 使用 TS 版本识别类型断言等语法；允许常见的短路和三元表达式调用模式。
			"@typescript-eslint/no-unused-expressions": [
				"error",
				{
					allowShortCircuit: true,
					allowTernary: true,
				},
			],
			// [可自动修复] 删除可由 TypeScript 明确推断的原始值类型标注，减少重复信息。
			"@typescript-eslint/no-inferrable-types": "error",
			// 非空断言可能隐藏空值缺陷；以警告提示逐步消除，避免一次性产生大量阻断错误。
			"@typescript-eslint/no-non-null-assertion": "warn",
			// 可选链之后再做非空断言逻辑矛盾，通常表示边界条件设计有误。
			"@typescript-eslint/no-non-null-asserted-optional-chain": "error",
			// [高影响][可自动修复] 类型依赖改用内联 type import；需复核仅靠 import 触发的模块副作用。
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
	// 默认启用的模块导入正确性与排序规则。
	{
		name: "fast-vite-plugins/import",
		files: ["**/*.{js,cjs,mjs,jsx}", "**/*.{ts,cts,mts,tsx}"],
		extends: [eslintPluginImportX.flatConfigs.recommended],
		rules: {
			// import 必须位于其他语句之前，避免模块依赖散落在执行逻辑中。
			"import-x/first": "error",
			// 合并同一模块的重复 import，避免绑定分散或副作用被误读。
			"import-x/no-duplicates": "error",
			// [高影响][可自动修复] 按来源分组并排序；带副作用的裸 import 仅报告，人工移动前必须确认执行顺序。
			"import-x/order": [
				"error",
				{
					groups: [
						// Node.js 内置模块
						"builtin",
						// 第三方依赖
						"external",
						// 项目内部别名模块
						"internal",
						// 父级目录模块
						"parent",
						// 同级目录模块
						"sibling",
						// 当前目录入口模块
						"index",
						// TypeScript import = require() 导入
						"object",
						// TypeScript 类型导入
						"type",
						// 无法识别分类的导入
						"unknown",
					],
					// 常用平台、框架和工具依赖优先于其他第三方依赖，并按声明顺序分层排序
					pathGroups: [
						// uni-app 平台生态
						{ pattern: "@dcloudio/**", group: "external", position: "before" },
						// Vue 核心、路由、状态管理和 VueUse 生态
						{ pattern: "{vue,@vue/**,vue-router,pinia,@pinia/**,@vueuse/**}", group: "external", position: "before" },
						// Element Plus 生态及其子路径
						{ pattern: "{element-plus,element-plus/**,@element-plus/**}", group: "external", position: "before" },
						// Fast Element Plus 生态及其子路径
						{ pattern: "{fast-element-plus,fast-element-plus/**,@fast-element-plus/**}", group: "external", position: "before" },
						// Fast China 组织包及其子路径
						{ pattern: "@fast-china/**", group: "external", position: "before" },
						// Lodash、lodash-es、lodash-unified 及其子路径
						{ pattern: "lodash{,-es,-unified}{,/**}", group: "external", position: "before" },
					],
					// 类型导入不参与 pathGroups 匹配，始终保留在 type 分组
					pathGroupsExcludedImportTypes: ["type"],
					// 所有 import 分组连续排列，不保留空行
					"newlines-between": "never",
					// 同一分组内按照模块路径字母升序排列
					alphabetize: {
						order: "asc",
						caseInsensitive: true,
					},
					// 对没有赋值给变量的副作用导入进行排序检查
					warnOnUnassignedImports: true,
				},
			],
			// [默认关闭] Vite/TypeScript 别名由项目解析器校验，避免共享配置绑定特定 resolver。
			"import-x/no-unresolved": "off",
			// [默认关闭] 未配置 resolver 时，namespace 导出的静态分析容易产生误报。
			"import-x/namespace": "off",
			// [默认关闭] 未配置 resolver 时，默认导出的静态分析容易产生误报。
			"import-x/default": "off",
			// [默认关闭] 不限制同时存在默认导出与相近命名导出的模块 API 风格。
			"import-x/no-named-as-default": "off",
			// [默认关闭] 不限制通过默认导入对象访问同名属性的项目 API 风格。
			"import-x/no-named-as-default-member": "off",
			// [默认关闭] 未配置 resolver 时，命名导出的静态分析容易产生误报。
			"import-x/named": "off",
		},
	},
	// 创建正则表达式正确性配置。
	{
		name: "fast-vite-plugins/regexp",
		files: ["**/*.{js,cjs,mjs,jsx}", "**/*.{ts,cts,mts,tsx}"],
		extends: [eslintPluginRegexp.configs["flat/recommended"]],
	},
	// 创建 JSON、JSONC 与 JSON5 配置。
	{
		name: "fast-vite-plugins/json/json",
		files: ["**/*.json"],
		extends: [eslintPluginJsonc.configs["flat/recommended-with-json"]],
	},
	{
		name: "fast-vite-plugins/json/jsonc",
		files: ["**/*.jsonc"],
		extends: [eslintPluginJsonc.configs["flat/recommended-with-jsonc"]],
	},
	{
		name: "fast-vite-plugins/json/json5",
		files: ["**/*.json5"],
		extends: [eslintPluginJsonc.configs["flat/recommended-with-json5"]],
	},
	{
		name: "fast-vite-plugins/json/vscode-settings",
		files: ["**/.vscode/settings.json"],
		rules: {
			// VS Code 的 settings.json 使用带注释的 JSONC 方言。
			"jsonc/no-comments": "off",
		},
	},
	{
		name: "fast-vite-plugins/sort/package-json",
		files: ["**/package.json"],
		rules: {
			// [高影响][可自动修复][按需启用] npm 的 files 清单按字母排序；数组顺序不改打包集合，但首次 diff 较大。
			"jsonc/sort-array-values": [
				"error",
				{
					order: { type: "asc" },
					pathPattern: "^files$",
				},
			],
			// [高影响][可自动修复][按需启用] 仅排序明确安全的 package.json 区域，不进入 exports 条件对象。
			"jsonc/sort-keys": [
				"error",
				// 根字段按常见阅读顺序组织，减少不同项目之间的清单噪声。
				{
					order: [
						"name",
						"version",
						"private",
						"packageManager",
						"description",
						"type",
						"keywords",
						"license",
						"homepage",
						"bugs",
						"repository",
						"author",
						"contributors",
						"funding",
						"files",
						"main",
						"module",
						"types",
						"exports",
						"typesVersions",
						"sideEffects",
						"unpkg",
						"jsdelivr",
						"browser",
						"bin",
						"man",
						"directories",
						"publishConfig",
						"scripts",
						"peerDependencies",
						"peerDependenciesMeta",
						"optionalDependencies",
						"dependencies",
						"devDependencies",
						"engines",
						"config",
						"overrides",
						"pnpm",
						"husky",
						"lint-staged",
						"eslintConfig",
						"prettier",
					],
					pathPattern: "^$",
				},
				// 各类依赖映射按包名排序，方便发现重复或异常依赖。
				{
					order: { type: "asc" },
					pathPattern: "^(?:dev|peer|optional|bundled)?[Dd]ependencies(Meta)?$",
				},
				// overrides/resolutions 只排序直接键；修改前仍应关注包管理器的模式匹配语义。
				{
					order: { type: "asc" },
					pathPattern: "^(?:resolutions|overrides|pnpm.overrides)$",
				},
			],
		},
	},
	{
		name: "fast-vite-plugins/sort/tsconfig",
		files: ["**/tsconfig.json", "**/tsconfig.*.json"],
		rules: {
			// tsconfig 是 JSONC，注释用于解释不直观的编译器取舍，必须保留。
			"jsonc/no-comments": "off",

			// [高影响][可自动修复][按需启用] 只调整顶层和 compilerOptions 的键顺序，不改写任何选项值或数组。
			"jsonc/sort-keys": [
				"error",
				// 顶层按继承、选项、项目引用和文件范围的阅读顺序排列。
				{
					order: ["extends", "compilerOptions", "references", "files", "include", "exclude"],
					pathPattern: "^$",
				},
				// compilerOptions 的顺序跟随 TypeScript 文档主题，便于检索和代码审查。
				{
					order: [
						/* Projects */
						"incremental",
						"composite",
						"tsBuildInfoFile",
						"disableSourceOfProjectReferenceRedirect",
						"disableSolutionSearching",
						"disableReferencedProjectLoad",
						/* Language and Environment */
						"target",
						"jsx",
						"jsxFactory",
						"jsxFragmentFactory",
						"jsxImportSource",
						"lib",
						"moduleDetection",
						"noLib",
						"reactNamespace",
						"useDefineForClassFields",
						"emitDecoratorMetadata",
						"experimentalDecorators",
						/* Modules */
						"baseUrl",
						"rootDir",
						"rootDirs",
						"customConditions",
						"module",
						"moduleResolution",
						"moduleSuffixes",
						"noResolve",
						"paths",
						"resolveJsonModule",
						"resolvePackageJsonExports",
						"resolvePackageJsonImports",
						"typeRoots",
						"types",
						"allowArbitraryExtensions",
						"allowImportingTsExtensions",
						"allowUmdGlobalAccess",
						/* JavaScript Support */
						"allowJs",
						"checkJs",
						"maxNodeModuleJsDepth",
						/* Type Checking */
						"strict",
						"strictBindCallApply",
						"strictFunctionTypes",
						"strictNullChecks",
						"strictPropertyInitialization",
						"allowUnreachableCode",
						"allowUnusedLabels",
						"alwaysStrict",
						"exactOptionalPropertyTypes",
						"noFallthroughCasesInSwitch",
						"noImplicitAny",
						"noImplicitOverride",
						"noImplicitReturns",
						"noImplicitThis",
						"noPropertyAccessFromIndexSignature",
						"noUncheckedIndexedAccess",
						"noUnusedLocals",
						"noUnusedParameters",
						"useUnknownInCatchVariables",
						/* Emit */
						"declaration",
						"declarationDir",
						"declarationMap",
						"downlevelIteration",
						"emitBOM",
						"emitDeclarationOnly",
						"importHelpers",
						"importsNotUsedAsValues",
						"inlineSourceMap",
						"inlineSources",
						"isolatedDeclarations",
						"mapRoot",
						"newLine",
						"noEmit",
						"noEmitHelpers",
						"noEmitOnError",
						"outDir",
						"outFile",
						"preserveConstEnums",
						"preserveValueImports",
						"removeComments",
						"sourceMap",
						"sourceRoot",
						"stripInternal",
						/* Interop Constraints */
						"allowSyntheticDefaultImports",
						"esModuleInterop",
						"forceConsistentCasingInFileNames",
						"isolatedModules",
						"preserveSymlinks",
						"verbatimModuleSyntax",
						/* Completeness */
						"skipDefaultLibCheck",
						"skipLibCheck",
					],
					pathPattern: "^compilerOptions$",
				},
			],
		},
	},
	// 创建 Markdown 结构与语法检查配置。
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
	// 创建 Prettier 兼容层。
	{
		...eslintConfigPrettier,
		name: "fast-vite-plugins/prettier",
	}
);
