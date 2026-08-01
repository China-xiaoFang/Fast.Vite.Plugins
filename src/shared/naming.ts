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
			return `${first.toLocaleUpperCase()}${rest.join("")}`;
		})
		.join("");
	identifier = identifier.replace(/[^\p{ID_Continue}$\u200C\u200D]/gu, "");

	if (!identifier) identifier = fallback;
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
