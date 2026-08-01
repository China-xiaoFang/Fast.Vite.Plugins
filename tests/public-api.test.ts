import {
	createBuildInfoPlugin,
	createBundleBudgetPlugin,
	createCdnImportPlugin,
	createComponentRegistryPlugin,
	createCompressionPlugin,
	createDevRestartPlugin,
	createEnvGuardPlugin,
	createHtmlTemplatePlugin,
	createRouterMetaPlugin,
	createStaticCopyPlugin,
	createSubresourceIntegrityPlugin,
	createSvgIconsPlugin,
	createVirtualModulesPlugin,
} from "fast-vite-plugins";

import type {
	BuildInfoPluginOptions,
	BundleBudgetPluginOptions,
	CdnImportPluginOptions,
	ComponentRegistryPluginOptions,
	CompressionPluginOptions,
	DevRestartPluginOptions,
	EnvGuardPluginOptions,
	HtmlTemplatePluginOptions,
	RouterMetaPluginOptions,
	StaticCopyPluginOptions,
	SubresourceIntegrityPluginOptions,
	SvgIconsPluginOptions,
	VirtualModulesPluginOptions,
} from "fast-vite-plugins";
import type { Plugin } from "vite";

const buildInfo: BuildInfoPluginOptions = { version: "2.0.0" };
const bundleBudget: BundleBudgetPluginOptions = { budgets: [{ filter: /\.js$/, limit: 250_000 }] };
const cdnImport: CdnImportPluginOptions = {
	modules: { global: "Vue", js: "dist/vue.global.prod.js", name: "vue", version: "3.5.0" },
};
const componentRegistry: ComponentRegistryPluginOptions = { dirs: ["src/components"] };
const compression: CompressionPluginOptions = { algorithms: ["gzip", "brotli"] };
const devRestart: DevRestartPluginOptions = { paths: ["config", "schema.json"] };
const envGuard: EnvGuardPluginOptions = { schema: { VITE_API_URL: { pattern: /^https:\/\// } } };
const htmlTemplate: HtmlTemplatePluginOptions = { data: { APP_TITLE: "Fast" } };
const routerMeta: RouterMetaPluginOptions = { dir: "src/views" };
const staticCopy: StaticCopyPluginOptions = { targets: [{ dest: "LICENSE", src: "LICENSE" }] };
const subresourceIntegrity: SubresourceIntegrityPluginOptions = { algorithms: ["sha384", "sha512"], manifest: true };
const svgIcons: SvgIconsPluginOptions = { dir: "src/assets/icons" };
const virtualModules: VirtualModulesPluginOptions = { modules: { "virtual:config": "export default {};" } };

const individualPlugins: Plugin[] = [
	createBuildInfoPlugin(buildInfo),
	createBundleBudgetPlugin(bundleBudget),
	createCdnImportPlugin(cdnImport),
	createComponentRegistryPlugin(componentRegistry),
	createCompressionPlugin(compression),
	createDevRestartPlugin(devRestart),
	createEnvGuardPlugin(envGuard),
	createHtmlTemplatePlugin(htmlTemplate),
	createRouterMetaPlugin(routerMeta),
	createStaticCopyPlugin(staticCopy),
	createSubresourceIntegrityPlugin(subresourceIntegrity),
	createSvgIconsPlugin(svgIcons),
	createVirtualModulesPlugin(virtualModules),
];

void individualPlugins;
