// @see: https://www.prettier.cn

module.exports = {
	// 指定最大换行长度
	printWidth: 150,
	// 缩进制表符宽度 | 空格数
	tabWidth: 4,
	// 使用制表符而不是空格缩进行 (true：制表符，false：空格)
	useTabs: true,
	// 结尾不用分号 (true：有，false：没有)
	semi: true,
	// 使用单引号 (true：单引号，false：双引号)
	singleQuote: false,
	// 在对象字面量中决定是否将属性名用引号括起来 可选值 "<as-needed|consistent|preserve>"
	quoteProps: "as-needed",
	// 在JSX中使用单引号而不是双引号 (true：单引号，false：双引号)
	jsxSingleQuote: false,
	// 多行时尽可能打印尾随逗号。（例如，单行数组永远不会出现逗号结尾。） 可选值"<none|es5|all>"，默认none
	trailingComma: "es5",
	// 在对象，数组括号与文字之间加空格 "{ foo: bar }" (true：有，false：没有)
	bracketSpacing: true,
	// 将 > 多行元素放在最后一行的末尾，而不是单独放在下一行 (true：放末尾，false：单独一行)
	bracketSameLine: false,
	// (x) => {} 箭头函数参数只有一个时是否要有小括号 (avoid：省略括号，always：不省略括号)
	arrowParens: "always",
	// 指定要使用的解析器，不需要写文件开头的 @prettier
	requirePragma: false,
	// 可以在文件顶部插入一个特殊标记，指定该文件已使用 Prettier 格式化
	insertPragma: false,
	// 用于控制文本是否应该被换行以及如何进行换行
	proseWrap: "preserve",
	// 在html中空格是否是敏感的 "css" - 遵守 CSS 显示属性的默认值， "strict" - 空格被认为是敏感的 ，"ignore" - 空格被认为是不敏感的
	htmlWhitespaceSensitivity: "css",
	// 控制在 Vue 单文件组件中 <script> 和 <style> 标签内的代码缩进方式
	vueIndentScriptAndStyle: false,
	// 换行符使用 lf 结尾是 可选值 "<auto|lf|crlf|cr>"
	endOfLine: "lf",
};