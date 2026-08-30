/**
 * 按 UTF-16 代码单元执行与系统区域设置无关的稳定字符串排序。
 *
 * @param left - 左侧字符串。
 * @param right - 右侧字符串。
 * @returns 左侧较小时为 `-1`，相等时为 `0`，否则为 `1`。
 */
export function compareStrings(left: string, right: string): number {
	if (left === right) return 0;
	return left < right ? -1 : 1;
}

/**
 * 生成稳定且符合 Prettier 引号选择规则的 JavaScript 字符串字面量。
 *
 * @param value - 要写入生成源码的字符串。
 * @returns 已转义并包含引号的 JavaScript 字符串字面量。
 */
export function toJavaScriptStringLiteral(value: string): string {
	const doubleQuotes = value.split('"').length - 1;
	const singleQuotes = value.split("'").length - 1;
	const quote = doubleQuotes > singleQuotes ? "'" : '"';
	let content = "";

	for (const character of value) {
		if (character === "\\") content += "\\\\";
		else if (character === quote) content += `\\${quote}`;
		else if (character === "\u2028") content += "\\u2028";
		else if (character === "\u2029") content += "\\u2029";
		else if (character.charCodeAt(0) < 0x20) content += JSON.stringify(character).slice(1, -1);
		else content += character;
	}

	return `${quote}${content}${quote}`;
}

/**
 * 将文件名、路径片段或 kebab-case 名称转换为合法的 PascalCase 标识符。
 *
 * @param value - 文件名、路径片段或自由格式名称。
 * @param fallback - 清理后为空时使用的标识符。
 * @returns 符合 ECMAScript Unicode 标识符规则的 PascalCase 名称。
 */
export function toPascalCase(value: string, fallback = "GeneratedComponent"): string {
	const words = value
		.replace(/([a-z\d])([A-Z])/g, "$1 $2")
		.split(/[^\p{L}\p{N}_$]+/u)
		.filter(Boolean);

	let identifier = words
		.map((word) => {
			const [first = "", ...rest] = Array.from(word);
			return `${first.toUpperCase()}${rest.join("")}`;
		})
		.join("");
	identifier = identifier.replace(/[^\p{ID_Continue}$\u200C\u200D]/gu, "");

	identifier ||= fallback;
	if (!/^[$_\p{ID_Start}]/u.test(identifier)) identifier = `_${identifier}`;
	return identifier;
}

/**
 * 按 ECMAScript Unicode 标识符规则检查名称。
 *
 * @param value - 要检查的完整字符串。
 * @returns 字符串可直接作为 JavaScript 标识符时返回 `true`。
 */
export function isValidIdentifier(value: string): boolean {
	return /^[$_\p{ID_Start}][$\u200C\u200D\p{ID_Continue}]*$/u.test(value);
}

const RESERVED_BINDING_NAMES = new Set([
	"await",
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"enum",
	"export",
	"extends",
	"false",
	"finally",
	"for",
	"function",
	"if",
	"implements",
	"import",
	"in",
	"instanceof",
	"interface",
	"let",
	"new",
	"null",
	"package",
	"private",
	"protected",
	"public",
	"return",
	"static",
	"super",
	"switch",
	"this",
	"throw",
	"true",
	"try",
	"typeof",
	"var",
	"void",
	"while",
	"with",
	"yield",
]);

/** 判断名称能否安全地出现在生成模块的词法绑定位置。 */
export function isValidBindingIdentifier(value: string): boolean {
	return isValidIdentifier(value) && !RESERVED_BINDING_NAMES.has(value);
}
