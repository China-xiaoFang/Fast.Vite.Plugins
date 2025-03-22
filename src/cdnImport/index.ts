import fs from "fs";
import path from "path";
import externalGlobals from "rollup-plugin-external-globals";
import { viteExternalsPlugin } from "vite-plugin-externals";
import type { CdnImportOptions, Module } from "./type";
import type { HtmlTagDescriptor, Plugin, UserConfig } from "vite";

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

function getModuleInfo(module: Module, prodUrl: string): Module & { pathList?: string[]; cssList?: string[] } {
	prodUrl = module.prodUrl || prodUrl;
	const v = module;
	const version = module.version || getModuleVersion(v.name);
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
			name: data.name,
			version: data.version,
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
					name: data.name,
					version: data.version,
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

const cdnJsDelivrUrl = "https://cdn.jsdelivr.net/npm/{name}@{version}/{path}";
const cdnUnpkgUrl = "https://unpkg.com/{package}@{version}/{path}";

/**
 * CDN 导入
 * @param options
 * @returns
 */
function cdnImport(options: CdnImportOptions): Plugin[] {
	const { modules = [], prodUrl = cdnJsDelivrUrl, enableInDevMode = false, generateCssLinkTag, generateScriptTag } = options;

	let isBuild = false;

	const data = (Array.isArray(modules) ? modules : [modules])
		.map((v) => (typeof v === "function" ? v(prodUrl) : v))
		.map((v) => getModuleInfo(v, prodUrl));

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
						const cusomize = generateScriptTag?.(v.name, url) || {};
						const attrs = {
							src: url,
							crossorigin: "anonymous",
							...(v?.attrs ?? {}),
							...cusomize.attrs,
						};

						descriptors.push({
							tag: "script",
							attrs,
							...cusomize,
						});
					});
					v.cssList.forEach((url) => {
						const cusomize = generateCssLinkTag?.(v.name, url) || {};
						const attrs = {
							href: url,
							rel: "stylesheet",
							crossorigin: "anonymous",
							...(v?.attrs ?? {}),
							...cusomize.attrs,
						};
						descriptors.push({
							tag: "link",
							attrs,
							...cusomize,
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

export { cdnImport, cdnJsDelivrUrl, cdnUnpkgUrl };
