// 选项说明：https://prettier.io/docs/options

module.exports = {
	// 首选换行宽度，不是不可超过的硬性行长上限。
	printWidth: 150,
	// 一个缩进层级的宽度；使用 Tab 时按此宽度展示。
	tabWidth: 4,
	// 使用 Tab 缩进；对齐仍可能使用空格。
	useTabs: true,
	// 在语句末尾保留分号。
	semi: true,
	// JavaScript 字符串优先使用双引号。
	singleQuote: false,
	// 仅在语法需要时为对象属性名添加引号。
	quoteProps: "as-needed",
	// JSX 属性使用双引号。
	jsxSingleQuote: false,
	// 在 ES5 支持的位置保留多行尾随逗号，不为函数参数添加尾随逗号。
	trailingComma: "es5",
	// 在对象字面量的大括号内侧保留空格。
	bracketSpacing: true,
	// 多行 HTML、Vue 和 JSX 开始标签的右尖括号单独换行。
	bracketSameLine: false,
	// 箭头函数即使只有一个参数，也保留参数括号。
	arrowParens: "always",
	// 格式化不要求文件包含 @prettier 或 @format 标记。
	requirePragma: false,
	// 不自动插入表示文件已格式化的 pragma 标记。
	insertPragma: false,
	// 保留 Markdown 正文现有的换行安排。
	proseWrap: "preserve",
	// 根据 CSS 的默认 display 行为判断 HTML 空白是否敏感。
	htmlWhitespaceSensitivity: "css",
	// 不额外缩进 Vue 的 script 和 style 标签内容。
	vueIndentScriptAndStyle: false,
	// 统一使用 LF 换行。
	endOfLine: "lf",
};
