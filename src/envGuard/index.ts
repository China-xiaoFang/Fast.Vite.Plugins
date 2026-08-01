import path from "node:path";

import { loadEnv } from "vite";

import type { EnvGuardPluginOptions, EnvRule, EnvSchema, EnvValidationIssue } from "./type";
import type { Plugin } from "vite";

/**
 * 校验环境变量并返回不包含实际值的问题列表。
 *
 * @param schema - 变量名与对应校验规则。
 * @param environment - 待校验的只读键值映射。
 * @returns 按 schema 声明顺序排列的问题。
 */
export function validateEnvironment(schema: EnvSchema, environment: Readonly<Record<string, string | undefined>>): EnvValidationIssue[] {
	const issues: EnvValidationIssue[] = [];

	for (const [key, configuredRule] of Object.entries(schema)) {
		const rule: EnvRule = configuredRule === true ? {} : configuredRule;
		const value = environment[key];
		const missing = value === undefined || (value.length === 0 && rule.allowEmpty !== true);
		if (missing && rule.required !== false) {
			issues.push({ key, message: "缺少必需变量或变量为空" });
			continue;
		}
		if (value === undefined) continue;

		if (rule.pattern) {
			rule.pattern.lastIndex = 0;
			if (!rule.pattern.test(value)) issues.push({ key, message: "格式不符合 pattern" });
		}
		if (rule.values && !rule.values.includes(value)) issues.push({ key, message: `必须是以下值之一：${rule.values.join(", ")}` });
		if (rule.validate) {
			const result = rule.validate(value, environment);
			if (result !== true) issues.push({ key, message: typeof result === "string" ? result : "未通过自定义校验" });
		}
	}

	return issues;
}

/**
 * 在 Vite 启动和构建前校验环境变量，尽早暴露缺失配置。
 *
 * @param options - 环境变量 schema、跳过模式和失败处理方式。
 * @returns 可直接加入 Vite `plugins` 的环境变量校验插件。
 */
export function createEnvGuardPlugin(options: EnvGuardPluginOptions): Plugin {
	return {
		name: "fast-vite:env-guard",
		config(config, env): void {
			if (options.skipModes?.includes(env.mode)) return;
			const root = path.resolve(config.root ?? process.cwd());
			const loaded = config.envDir === false ? {} : loadEnv(env.mode, path.resolve(root, config.envDir ?? "."), "");
			const environment: Record<string, string | undefined> = { ...loaded, ...process.env };
			const issues = validateEnvironment(options.schema, environment);
			if (issues.length === 0) return;

			const message = `[fast-vite:env-guard] 环境变量校验失败：\n${issues.map((issue) => `- ${issue.key}: ${issue.message}`).join("\n")}`;
			if (options.onInvalid === "warn") this.warn(message);
			else this.error(message);
		},
	};
}

export type { EnvGuardPluginOptions, EnvRule, EnvSchema, EnvValidationIssue } from "./type";
