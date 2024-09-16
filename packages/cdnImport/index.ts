import fs from "fs";
import path from "path";
import externalGlobals from "rollup-plugin-external-globals";
import type { HtmlTagDescriptor, Plugin, UserConfig } from "vite";
import { viteExternalsPlugin } from "vite-plugin-externals";
import type { CdnImportOptions, Module } from "./type";

const isDev = process.env.NODE_ENV === "development";

/**
 * get npm module version
 * @param name
 * @returns
 */
function getModuleVersion(name: string): string {
	const pwd = process.cwd();
	const pkgFile = path.join(pwd, "node_modules", name, "package.json");
	if (fs.existsSync(pkgFile)) {
		const pkgJson = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
		return pkgJson.version;
	}

	return "";
}

/**
 * 是否完整的 url
 * @param path
 * @returns
 */
function isFullPath(path: string): boolean {
	return path.startsWith("http:") || path.startsWith("https:") || path.startsWith("//") ? true : false;
}

function renderUrl(
	url: string,
	data: {
		name: string;
		version: string;
		path: string;
	}
): string {
	const { path } = data;
	if (isFullPath(path)) {
		url = path;
	}
	return url
		.replace(/\{name\}/g, data.name)
		.replace(/\{version\}/g, data.version)
		.replace(/\{path\}/g, path);
}

function getModuleInfo(module: Module, prodUrl: string): Module & { version?: string; pathList?: string[]; cssList?: string[] } {
	prodUrl = module.prodUrl || prodUrl;
	const v = module;
	const version = getModuleVersion(v.name);
	let pathList: string[] = [];
	if (!Array.isArray(v.path)) {
		pathList.push(v.path);
	} else {
		pathList = v.path;
	}

	const data = {
		...v,
		version,
	};

	pathList = pathList.map((p) => {
		if (!version && !isFullPath(p)) {
			throw new Error(`modules: ${data.name} package.json file does not exist`);
		}
		return renderUrl(prodUrl, {
			...data,
			path: p,
		});
	});

	let css = v.css || [];
	if (!Array.isArray(css) && css) {
		css = [css];
	}

	const cssList = !Array.isArray(css)
		? []
		: css.map((c) =>
				renderUrl(prodUrl, {
					...data,
					path: c,
				})
			);

	return {
		...v,
		version,
		pathList,
		cssList,
	};
}

/**
 * CDN 导入
 * @param options
 * @returns
 */
function cdnImport(options: CdnImportOptions): Plugin[] {
	const { modules = [], prodUrl = "https://cdn.jsdelivr.net/npm/{name}@{version}/{path}", enableInDevMode = false } = options;

	let isBuild = false;

	const data = modules
		.map((m) => {
			const list = (Array.isArray(m) ? m : [m]).map((v) => (typeof v === "function" ? v(prodUrl) : v));
			return list.map((v) => getModuleInfo(v, prodUrl));
		})
		.flat();

	const externalMap: {
		[name: string]: string;
	} = {};

	data.forEach((v) => {
		externalMap[v.name] = v.var;
		if (Array.isArray(v.alias)) {
			v.alias.forEach((alias) => {
				externalMap[alias] = v.var;
			});
		}
	});

	const plugins: Plugin[] = [
		{
			name: "fast-vite-plugin-cdn-import",
			enforce: "pre",
			config(_, { command }): UserConfig {
				isBuild = command === "build";

				const userConfig: UserConfig = {
					build: {
						rollupOptions: {
							plugins: [],
						},
					},
				};

				if (isBuild) {
					userConfig.build.rollupOptions.plugins = [externalGlobals(externalMap)];
				}

				return userConfig;
			},
			transformIndexHtml(html): string | HtmlTagDescriptor[] {
				if (!isBuild && !enableInDevMode) {
					return html;
				}

				const descriptors: HtmlTagDescriptor[] = [];

				data.forEach((v) => {
					v.pathList.forEach((url) => {
						const attrs = {
							src: url,
							crossorigin: "anonymous",
							...(v?.attrs ?? {}),
						};

						descriptors.push({
							tag: "script",
							attrs,
						});
					});
					v.cssList.forEach((url) => {
						const attrs = {
							href: url,
							rel: "stylesheet",
							crossorigin: "anonymous",
							...(v?.attrs ?? {}),
						};
						descriptors.push({
							tag: "link",
							attrs,
						});
					});
				});

				return descriptors;
			},
		},
	];

	if (isDev && enableInDevMode) {
		plugins.push(
			viteExternalsPlugin(externalMap, {
				enforce: "pre",
			})
		);
	}

	return plugins;
}

export { cdnImport };