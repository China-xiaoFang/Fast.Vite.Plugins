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

const STYLE_IMPORT_PATTERN = /\.(?:acss|css|less|pcss|postcss|sass|scss|sss|styl|stylus|ttss|wxss)(?:[?#].*)?$/i;

const isStyleImport = (source) => typeof source === "string" && STYLE_IMPORT_PATTERN.test(source);

const importOrderRule = eslintPluginImportX.rules.order;

/**
 * 复用 import-x/order 的全部行为，但把样式导入交给 style-imports-last 独立处理。
 *
 * @remarks
 * import-x/order 没有按路径忽略导入的选项。过滤静态样式 import 可以避免
 * alphabetize 改变 CSS 层叠顺序，其他副作用导入仍受 warnOnUnassignedImports 约束。
 */
const importOrderWithoutStylesRule = {
	...importOrderRule,
	create(context) {
		const listeners = importOrderRule.create(context);
		const checkImport = listeners.ImportDeclaration;

		return {
			...listeners,
			ImportDeclaration(node) {
				if (!isStyleImport(node.source.value)) {
					checkImport?.(node);
				}
			},
		};
	},
};

/** 只要求样式导入形成文件顶部 import 区域的最后一个连续分组，不改变组内顺序。 */
const styleImportsLastRule = {
	meta: {
		type: "suggestion",
		docs: {
			description: "Require stylesheet imports to form the final contiguous import group without sorting them.",
		},
		schema: [],
		messages: {
			styleImportsLast: "Style import `{{source}}` must occur after all non-style imports.",
		},
	},
	create(context) {
		return {
			Program(node) {
				const imports = node.body.filter((statement) => statement.type === "ImportDeclaration");
				let lastNonStyleImportIndex = -1;

				for (const [index, statement] of imports.entries()) {
					if (!isStyleImport(statement.source.value)) {
						lastNonStyleImportIndex = index;
					}
				}

				for (const statement of imports.slice(0, lastNonStyleImportIndex)) {
					if (isStyleImport(statement.source.value)) {
						context.report({
							node: statement,
							messageId: "styleImportsLast",
							data: { source: statement.source.value },
						});
					}
				}
			},
		};
	},
};

/** import-x 插件适配：样式导入不参与 import-x/order，其他规则保持上游实现。 */
const styleAwareImportXPlugin = {
	...eslintPluginImportX,
	rules: {
		...eslintPluginImportX.rules,
		order: importOrderWithoutStylesRule,
		"style-imports-last": styleImportsLastRule,
	},
};

const importXRecommended = {
	...eslintPluginImportX.flatConfigs.recommended,
	plugins: {
		"import-x": styleAwareImportXPlugin,
	},
};

/**
 * 跨 JavaScript、TypeScript 与 Vue 脚本生效的公共规则。
 *
 * @remarks
 * 默认规则面向 SDK、OA、Admin 与客户端项目使用同一套质量标准。这里只保留
 * 跨语言且误报较少的规则；纯格式和语法偏好交给 Prettier 或项目自行覆盖。
 */
export default defineConfig(
	// 忽略依赖、构建结果、缓存、生成文件和包管理器锁文件。
	globalIgnores(
		[
			"**/{.pnpm-store,node_modules}/**",
			"**/{dist,build,coverage,output,temp,tmp}/**",
			"**/unpackage/**",
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
		/**
		 * 跨 JavaScript、TypeScript 与 Vue 脚本生效的公共规则。
		 *
		 * @remarks
		 * 默认规则面向 SDK、OA、Admin 与客户端项目使用同一套质量标准。这里只保留
		 * 跨语言且误报较少的规则；纯格式和语法偏好交给 Prettier 或项目自行覆盖。
		 */
		rules: {
			// 要求数组回调在所有可到达分支返回值，避免 map/filter 等调用静默产生 undefined。
			"array-callback-return": "error",
			// 浏览器弹窗通常不适合生产代码；使用 warn 允许原型调试，同时确保发布前能够被发现。
			"no-alert": "warn",
			// switch 的 case 不创建词法作用域；要求用花括号包裹声明，避免跨 case 冲突。
			"no-case-declarations": "error",
			// 禁止动态执行字符串代码，避免代码注入和静态分析失效。
			"no-eval": "error",
			// 禁止通过字符串间接执行代码，避免绕过 no-eval 和静态分析。
			"no-implied-eval": "error",
			// 禁止使用 Function 构造器动态创建函数。
			"no-new-func": "error",
			// Promise executor 的返回值不会被 Promise 使用，通常表示遗漏了 resolve 或 reject。
			"no-promise-executor-return": "error",
			// 禁止反斜杠续行字符串，优先使用可读性更好的模板字符串。
			"no-multi-str": "error",
			// with 会让标识符解析不可预测，并且在严格模式和 ESM 中不可用。
			"no-with": "error",
			// Promise 是否等待由业务语义决定，不使用 `void promise` 作为 ESLint 规避语法。
			"no-void": "error",
			// 简单单行分支允许省略花括号；多行分支必须使用花括号，同一条件链保持一致。
			curly: ["error", "multi-line", "consistent"],
			// default 分支不是强制项，但存在时统一位于其他 case 之后。
			"default-case-last": "error",
			// 要求严格相等；保留 `value == null` 同时判断 null/undefined 的常用写法。
			eqeqeq: ["error", "always", { null: "ignore" }],
			// 使用幂运算符代替 Math.pow，使数学表达式更直接。
			"prefer-exponentiation-operator": "error",
			// 使用 Object.hasOwn 代替 obj.hasOwnProperty，兼容无原型对象以及同名方法被覆盖的对象。
			"prefer-object-has-own": "error",
			// 仅排序同一 import 声明中的导入成员；声明之间的分组和顺序交给 import-x/order。
			// 该规则无法自动修复成员顺序，使用 warn 避免历史代码因纯排序问题被立即阻断。
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
		/**
		 * JavaScript 本地覆写规则。
		 *
		 * @remarks
		 * `@eslint/js` 推荐预置负责基础正确性。本记录补充命名、声明顺序和现代语法约定，
		 * 供 SDK、管理端和客户端共同使用。
		 */
		rules: {
			// 变量和类型使用 camelCase；对象属性允许沿用外部协议字段名。
			camelcase: ["error", { properties: "never" }],
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
			// 禁止标签语句和 with，避免难以追踪的跳转与动态标识符解析。
			"no-restricted-syntax": ["error", "LabeledStatement", "WithStatement"],
			// 现代项目使用 let/const 替代 var，避免函数作用域和循环闭包陷阱。
			"no-var": "error",
			// 允许明确表示忽略失败的空 catch，其他空代码块视为遗漏。
			"no-empty": ["error", { allowEmptyCatch: true }],
			// 禁止肉眼难以识别、可能导致解析差异的非常规空白字符。
			"no-irregular-whitespace": "error",
			// 变量和类先声明后使用；函数声明允许使用 JavaScript 提升语义。
			"no-use-before-define": ["warn", { classes: true, functions: false, variables: true }],
			// 能保持引用不变的变量优先使用 const；读取发生在赋值前时不做不可靠判断。
			"prefer-const": [
				"warn",
				{
					destructuring: "all",
					ignoreReadBeforeAssign: true,
				},
			],
			// 属性和值同名时强制使用对象简写，带引号键名不强制改写。
			"object-shorthand": [
				"error",
				"always",
				{
					ignoreConstructors: false,
					avoidQuotes: true,
				},
			],
			// 不依赖动态 this 的回调使用箭头函数；允许确实需要调用方绑定 this 的普通函数。
			"prefer-arrow-callback": ["error", { allowNamedFunctions: false, allowUnboundThis: true }],
			// 将可等价改写的逻辑赋值统一为 ||=、&&=、??=，并覆盖对应的 if 赋值写法。
			"logical-assignment-operators": ["error", "always", { enforceForIfStatements: true }],
			// 创建新对象时用对象展开代替 Object.assign({}, source)，不改写会修改既有目标对象的调用。
			"prefer-object-spread": "error",
			// 使用具名 rest 参数代替 arguments，使参数范围明确并获得真实数组和类型推断能力。
			"prefer-rest-params": "error",
			// 参数数组展开调用时使用 fn(...args) 代替 fn.apply(thisArg, args)，使调用目标和参数更直观。
			"prefer-spread": "error",
			// 字符串中包含变量时使用模板字符串，减少多段 + 拼接和隐式类型转换造成的歧义。
			"prefer-template": "error",
			// 同一作用域禁止重复声明变量、函数或类，避免前一声明被覆盖；TS 文件由对应扩展规则处理。
			"no-redeclare": "error",
		},
	},
	// TypeScript 本地覆写规则。
	{
		name: "fast-vite-plugins/typescript/type-checked",
		files: ["**/*.{ts,cts,mts,tsx}"],
		extends: [
			eslintJs.configs.recommended,
			{
				name: "fast-vite-plugins/typescript/javascript-rules",
				/**
				 * JavaScript 本地覆写规则。
				 *
				 * @remarks
				 * `@eslint/js` 推荐预置负责基础正确性。本记录补充命名、声明顺序和现代语法约定，
				 * 供 SDK、管理端和客户端共同使用。
				 */
				rules: {
					// 变量和类型使用 camelCase；对象属性允许沿用外部协议字段名。
					camelcase: ["error", { properties: "never" }],
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
					// 禁止标签语句和 with，避免难以追踪的跳转与动态标识符解析。
					"no-restricted-syntax": ["error", "LabeledStatement", "WithStatement"],
					// 现代项目使用 let/const 替代 var，避免函数作用域和循环闭包陷阱。
					"no-var": "error",
					// 允许明确表示忽略失败的空 catch，其他空代码块视为遗漏。
					"no-empty": ["error", { allowEmptyCatch: true }],
					// 禁止肉眼难以识别、可能导致解析差异的非常规空白字符。
					"no-irregular-whitespace": "error",
					// 变量和类先声明后使用；函数声明允许使用 JavaScript 提升语义。
					"no-use-before-define": ["warn", { classes: true, functions: false, variables: true }],
					// 能保持引用不变的变量优先使用 const；读取发生在赋值前时不做不可靠判断。
					"prefer-const": [
						"warn",
						{
							destructuring: "all",
							ignoreReadBeforeAssign: true,
						},
					],
					// 属性和值同名时强制使用对象简写，带引号键名不强制改写。
					"object-shorthand": [
						"error",
						"always",
						{
							ignoreConstructors: false,
							avoidQuotes: true,
						},
					],
					// 不依赖动态 this 的回调使用箭头函数；允许确实需要调用方绑定 this 的普通函数。
					"prefer-arrow-callback": ["error", { allowNamedFunctions: false, allowUnboundThis: true }],
					// 将可等价改写的逻辑赋值统一为 ||=、&&=、??=，并覆盖对应的 if 赋值写法。
					"logical-assignment-operators": ["error", "always", { enforceForIfStatements: true }],
					// 创建新对象时用对象展开代替 Object.assign({}, source)，不改写会修改既有目标对象的调用。
					"prefer-object-spread": "error",
					// 使用具名 rest 参数代替 arguments，使参数范围明确并获得真实数组和类型推断能力。
					"prefer-rest-params": "error",
					// 参数数组展开调用时使用 fn(...args) 代替 fn.apply(thisArg, args)，使调用目标和参数更直观。
					"prefer-spread": "error",
					// 字符串中包含变量时使用模板字符串，减少多段 + 拼接和隐式类型转换造成的歧义。
					"prefer-template": "error",
					// 同一作用域禁止重复声明变量、函数或类，避免前一声明被覆盖；TS 文件由对应扩展规则处理。
					"no-redeclare": "error",
				},
			},
			...tseslint.configs.strictTypeChecked,
			...tseslint.configs.stylisticTypeChecked,
		],
		languageOptions: {
			ecmaVersion: "latest",
			parserOptions: {
				projectService: true,
				extraFileExtensions: [".vue", ".nvue"],
			},
		},
		/**
		 * TypeScript 本地覆写规则。
		 *
		 * @remarks
		 * 普通 TS/TSX 的命名函数与公共模块边界要求显式类型，内联回调保留上下文推断；
		 * strictTypeChecked 与 stylisticTypeChecked 预置负责补充类型语义和官方风格检查。
		 */
		rules: {
			// 单独使用 TypeScript 配置时也禁止用 void 操作符标记被忽略的 Promise。
			"no-void": "error",
			// 普通 TS/TSX 函数要求显式返回类型；内联回调和已有函数类型约束的表达式继续依赖上下文推断。
			"@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true, allowTypedFunctionExpressions: true }],
			// 导出函数和类的公共方法必须显式声明参数与返回类型，使公共 API 不依赖实现细节推断；参数不允许显式 any。
			"@typescript-eslint/explicit-module-boundary-types": ["error", { allowArgumentsExplicitlyTypedAsAny: false }],
			// 使用 TypeScript 版本避免核心规则误判声明合并、类型和值的同名声明。
			"@typescript-eslint/no-redeclare": "error",
			// 未使用符号视为错误；仅参数和异常可用下划线明确表示有意忽略。
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					args: "after-used",
					argsIgnorePattern: "^_",
					caughtErrors: "all",
					caughtErrorsIgnorePattern: "^_",
					ignoreRestSiblings: true,
				},
			],
			// [默认关闭] 声明文件、全局扩展和部分 SDK 仍需要 namespace。
			"@typescript-eslint/no-namespace": "off",
			// any 会绕过类型检查，但第三方边界和渐进迁移仍可能需要，因此只警告。
			"@typescript-eslint/no-explicit-any": "warn",
			// TypeScript 源码统一使用 ESM import；Node 工具文件由末尾覆写单独放开。
			"@typescript-eslint/no-require-imports": "error",
			// 禁止普通空函数，避免遗漏实现；仅允许无函数体逻辑的构造器和有意留空的重写方法。
			"@typescript-eslint/no-empty-function": ["error", { allow: ["constructors", "overrideMethods"] }],
			// 使用 TS 版本识别类型断言等语法；允许常见的短路和三元表达式调用模式。
			"@typescript-eslint/no-unused-expressions": [
				"error",
				{
					allowShortCircuit: true,
					allowTernary: true,
				},
			],
			// 删除可由 TypeScript 明确推断的原始值类型标注。
			"@typescript-eslint/no-inferrable-types": "error",
			// 禁止非空断言，要求显式处理空值边界。
			"@typescript-eslint/no-non-null-assertion": "error",
			// 可选链之后再做非空断言逻辑矛盾，通常表示边界条件设计有误。
			"@typescript-eslint/no-non-null-asserted-optional-chain": "error",
			// 纯类型依赖必须使用独立的 `import type`，避免生成无用运行时导入并统一导入声明结构。
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					disallowTypeAnnotations: false,
					fixStyle: "separate-type-imports",
					prefer: "type-imports",
				},
			],
			// 类型导入必须直接使用 import type，避免 `import { type X }` 仍产生模块副作用。
			"@typescript-eslint/no-import-type-side-effects": "error",
			// 类成员省略 public，但 private 和 protected 必须显式声明可见性。
			"@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "no-public" }],

			/** 仅在 Project Service 提供完整类型信息后应用的 TypeScript 类型感知规则覆写。 */
			// 返回 Promise 的函数统一声明为 async，使异步契约在实现上清晰可见。
			"@typescript-eslint/promise-function-async": "error",
			// 是否等待、返回或处理 Promise 由开发者根据业务顺序和异常语义决定。
			"@typescript-eslint/no-floating-promises": "off",
			// 不限制框架生命周期和事件回调的返回写法。
			"@typescript-eslint/strict-void-return": "off",
			// 核心 no-void 已禁止全部 void 操作符，关闭类型感知的重复诊断。
			"@typescript-eslint/no-meaningless-void-operator": "off",
			// 保留简洁的 `() => notify()` 回调，其他容易混淆 void 值与返回值的用法继续检查。
			"@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
			// 数字是模板字符串的常见安全插值；对象、any 和空值仍需显式处理。
			"@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
			// 动态删除对象字段是表单和字典的正常操作；数组 delete 仍由 no-array-delete 禁止。
			"@typescript-eslint/no-dynamic-delete": "off",
			// 纯静态工具类可能是 SDK 的有意 API 设计，不强制改写为函数或对象。
			"@typescript-eslint/no-extraneous-class": "off",
			// 弃用 API 需要可见，但兼容多个依赖版本时不应直接阻断构建。
			"@typescript-eslint/no-deprecated": "warn",
			// TypeScript 类型不一定覆盖外部输入的真实运行时，防御性条件仅提醒审查。
			"@typescript-eslint/no-unnecessary-condition": "warn",
			// 语法形式不影响类型安全，不强制 interface/type、索引类型、字面量属性和 RegExp API 的单一写法。
			"@typescript-eslint/consistent-type-definitions": "off",
			"@typescript-eslint/consistent-indexed-object-style": "off",
			"@typescript-eslint/class-literal-property-style": "off",
			"@typescript-eslint/prefer-regexp-exec": "off",
			// 纯类型导出必须使用 export type，避免生成或暗示不存在的运行时导出。
			"@typescript-eslint/consistent-type-exports": "error",
			// 只在构造阶段赋值且之后保持不变的私有成员应声明为 readonly。
			"@typescript-eslint/prefer-readonly": "error",
			// 原始类型的 || 与 ?? 可能承载不同业务语义，不为了风格强制互换。
			"@typescript-eslint/prefer-nullish-coalescing": ["error", { ignorePrimitives: true }],
			// 参数名称或独立 JSDoc 属于公共重载契约；仅合并真正重复的签名。
			"@typescript-eslint/unified-signatures": [
				"error",
				{
					ignoreDifferentlyNamedParameters: true,
					ignoreOverloadsWithDifferentJSDoc: true,
				},
			],
			// 联合类型和枚举新增成员时，switch 必须覆盖全部分支或显式提供 default。
			"@typescript-eslint/switch-exhaustiveness-check": "error",
			// 保持严格预置的 error-handling-correctness-only 模式，只在异常处理语义需要时要求 return await。
			"@typescript-eslint/return-await": "error",
			// 允许透明转发外部 Promise 的未知拒绝原因；静态可知的 string、number 等仍会被报告。
			"@typescript-eslint/prefer-promise-reject-errors": ["error", { allowThrowingUnknown: true }],
		},
	},
	// 默认启用的模块导入正确性与排序规则。
	{
		name: "fast-vite-plugins/import",
		files: ["**/*.{js,cjs,mjs,jsx}", "**/*.{ts,cts,mts,tsx}"],
		extends: [importXRecommended],
		/**
		 * 默认启用的模块导入正确性与排序规则。
		 *
		 * @remarks
		 * 该记录补充 import-x 推荐预置，统一导入位置、重复导入及分组顺序。依赖项目 resolver
		 * 的静态导出分析默认关闭，避免共享配置误判路径别名或自定义模块解析方式。
		 */
		rules: {
			// import 必须位于其他语句之前，避免模块依赖散落在执行逻辑中。
			"import-x/first": "error",
			// 合并同一模块的重复 import，避免绑定分散或副作用被误读。
			"import-x/no-duplicates": "error",
			// 非样式 import 按来源分组并排序，保持所有项目一致的模块结构。
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
						// 无法识别分类的导入
						"unknown",
						// TypeScript 类型导入始终位于所有非样式导入之后
						"type",
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
						// 项目根目录 @/ 别名归入 internal，并优先于其他 internal 导入
						{ pattern: "@/**", group: "internal", position: "before" },
					],
					// 类型导入不参与自定义 pathGroups 匹配，统一保留在 type 总分组
					pathGroupsExcludedImportTypes: ["type"],
					// type 总分组内部继续按照 builtin、external、internal、parent、sibling、index 来源层级排序
					sortTypesGroup: true,
					// 所有 import 分组连续排列，不保留空行
					"newlines-between": "never",
					// 同一分组内按照模块路径字母升序排列
					alphabetize: {
						order: "asc",
						caseInsensitive: true,
					},
					// 普通副作用导入同样参与检查；修复前必须确认 polyfill 和注册器执行顺序
					warnOnUnassignedImports: true,
				},
			],
			// 样式导入必须形成最后一个连续分组；不自动修复，避免改变 CSS 层叠顺序。
			"import-x/style-imports-last": "error",
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
		plugins: { regexp: eslintPluginRegexp },
		/**
		 * 正则表达式正确性与安全规则。
		 *
		 * @remarks
		 * 不直接继承 regexp 插件的完整推荐预置，避免把字符类简写、量词写法和标志排序等
		 * 纯偏好作为阻断错误。这里显式维护无效结构、潜在错误和灾难性回溯检查。
		 */
		rules: {
			// 控制字符通常来自复制或编码错误，要求使用可识别的转义写法。
			"no-control-regex": "error",
			// Unicode 组合字符可能让字符类匹配结果与视觉含义不一致。
			"no-misleading-character-class": "error",
			// 正则中的连续普通空格容易漏看，使用量词或明确转义更清晰。
			"no-regex-spaces": "error",

			// 相邻量词的作用范围容易被误读，保留警告供人工复核。
			"regexp/confusing-quantifier": "warn",
			// 断言与其内部条件矛盾时表达式永远无法按预期匹配。
			"regexp/no-contradiction-with-assertion": "error",
			// 字符类中的重复字符通常表示拼写或范围设计错误。
			"regexp/no-dupe-characters-character-class": "error",
			// 重复或被完全覆盖的分支通常表示条件遗漏。
			"regexp/no-dupe-disjunctions": "error",
			// 空分支可能是有意匹配空字符串，也可能是遗漏，因此只警告。
			"regexp/no-empty-alternative": "warn",
			// 空捕获组不会捕获有效内容，通常属于表达式残留。
			"regexp/no-empty-capturing-group": "error",
			// 空字符类永远无法匹配字符。
			"regexp/no-empty-character-class": "error",
			// 空分组通常表示编辑遗漏。
			"regexp/no-empty-group": "error",
			// 空前后查找不会表达有效约束。
			"regexp/no-empty-lookarounds-assertion": "error",
			// 多余嵌套断言可能改变捕获或回溯边界，应视为结构错误。
			"regexp/no-extra-lookaround-assertions": "error",
			// 检查 RegExp 构造器字符串和字面量中的无效语法及标志。
			"regexp/no-invalid-regexp": "error",
			// 不可见字符容易造成审查遗漏和匹配异常。
			"regexp/no-invisible-character": "error",
			// 捕获组边界具有误导性时，反向引用和替换结果可能不符合预期。
			"regexp/no-misleading-capturing-group": "error",
			// Unicode 字符的视觉形式与代码点不一致时容易产生错误匹配。
			"regexp/no-misleading-unicode-character": "error",
			// replaceAll 等全局操作缺少 g 标志时会在运行时失败或行为不一致。
			"regexp/no-missing-g-flag": "error",
			// 禁止 JavaScript 不支持的非标准正则标志。
			"regexp/no-non-standard-flag": "error",
			// 可选断言几乎总能通过，通常无法表达预期约束。
			"regexp/no-optional-assertion": "error",
			// 阻止可被构造输入触发的超线性回溯，降低拒绝服务风险。
			"regexp/no-super-linear-backtracking": "error",
			// 无效反向引用无法引用预期捕获内容。
			"regexp/no-useless-backreference": "error",
			// 替换字符串引用不存在的捕获组时不会得到预期结果。
			"regexp/no-useless-dollar-replacements": "error",
			// 零次量词会让对应模式永远不参与匹配，通常是边界笔误。
			"regexp/no-zero-quantifier": "error",
			// 使用严格模式检查容易产生歧义或跨引擎差异的正则结构。
			"regexp/strict": "error",
		},
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
		name: "fast-vite-plugins/json/vscode",
		files: ["**/.vscode/extensions.json", "**/.vscode/settings.json"],
		rules: {
			// VS Code 的工作区设置和扩展推荐文件使用带注释的 JSONC 方言。
			"jsonc/no-comments": "off",
		},
	},
	{
		name: "fast-vite-plugins/sort/package-json",
		files: ["**/package.json"],
		/**
		 * package.json 属性排序规则。
		 *
		 * @remarks
		 * `[高影响][可自动修复]`：固定项目组合默认启用，首次修复可能重排大量字段。
		 * 注意：这里故意不排序 `exports` 内部键；条件导出的键顺序具有模块解析语义。
		 */
		rules: {
			// [高影响][可自动修复] npm 的 files 清单按字母排序；数组顺序不改打包集合，但首次 diff 较大。
			"jsonc/sort-array-values": [
				"error",
				{
					order: { type: "asc" },
					pathPattern: "^files$",
				},
			],
			// [高影响][可自动修复] 仅排序明确安全的 package.json 区域，不进入 exports 条件对象。
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
		/**
		 * tsconfig.json 属性排序规则。
		 *
		 * @remarks
		 * `[高影响][可自动修复]`：固定项目组合默认启用，首次修复会重排大量字段，
		 * 但只改变 JSONC 的阅读顺序，不改变 TypeScript 编译选项值。
		 */
		rules: {
			// tsconfig 是 JSONC，注释用于解释不直观的编译器取舍，必须保留。
			"jsonc/no-comments": "off",

			// [高影响][可自动修复] 只调整顶层和 compilerOptions 的键顺序，不改写任何选项值或数组。
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
		// 只保留 ESLint 核心与 TypeScript 格式兼容规则，不加载当前项目未使用的框架规则。
		rules: Object.fromEntries(
			Object.entries(eslintConfigPrettier.rules).filter(
				([ruleName]) => ruleName !== "curly" && (!ruleName.includes("/") || ruleName.startsWith("@typescript-eslint/"))
			)
		),
	},
	// Node.js 配置、脚本、测试与 CLI 允许终端日志和 CommonJS 兼容加载。
	{
		name: "fast-vite-plugins/node-tooling",
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
		rules: {
			"@typescript-eslint/no-require-imports": "off",
			"no-console": "off",
		},
	}
);
