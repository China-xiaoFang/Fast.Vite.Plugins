import {
	buildInfo,
	bundleBudget,
	cdnImport,
	cdnJsDelivrUrl,
	cdnUnpkgUrl,
	componentRegistry,
	compression,
	devRestart,
	envGuard,
	htmlTemplate,
	routerMeta,
	staticCopy,
	subresourceIntegrity,
	svgIcons,
	virtualModules,
} from "fast-vite-plugins";
import type { Plugin } from "vite";
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

const buildInfoOptions: BuildInfoPluginOptions = { version: "2.0.0" };
const bundleBudgetOptions: BundleBudgetPluginOptions = { budgets: [{ filter: /\.js$/, limit: 250_000 }] };
const cdnImportOptions: CdnImportPluginOptions = {
	modules: { global: "Vue", js: "dist/vue.global.prod.js", name: "vue", version: "3.5.0" },
};
const componentRegistryOptions: ComponentRegistryPluginOptions = { dirs: ["src/components"] };
const compressionOptions: CompressionPluginOptions = { algorithms: ["gzip", "brotli"] };
const devRestartOptions: DevRestartPluginOptions = { paths: ["config", "schema.json"] };
const envGuardOptions: EnvGuardPluginOptions = { schema: { VITE_API_URL: { pattern: /^https:\/\// } } };
const htmlTemplateOptions: HtmlTemplatePluginOptions = { data: { APP_TITLE: "Fast" } };
const routerMetaOptions: RouterMetaPluginOptions = { dir: "src/views" };
const staticCopyOptions: StaticCopyPluginOptions = { targets: [{ dest: "LICENSE", src: "LICENSE" }] };
const subresourceIntegrityOptions: SubresourceIntegrityPluginOptions = { algorithms: ["sha384", "sha512"], manifest: true };
const svgIconsOptions: SvgIconsPluginOptions = { dir: "src/assets/icons" };
const virtualModulesOptions: VirtualModulesPluginOptions = { modules: { "virtual:config": "export default {};" } };

const individualPlugins: Plugin[] = [
	buildInfo(buildInfoOptions),
	bundleBudget(bundleBudgetOptions),
	cdnImport(cdnImportOptions),
	componentRegistry(componentRegistryOptions),
	compression(compressionOptions),
	devRestart(devRestartOptions),
	envGuard(envGuardOptions),
	htmlTemplate(htmlTemplateOptions),
	routerMeta(routerMetaOptions),
	staticCopy(staticCopyOptions),
	subresourceIntegrity(subresourceIntegrityOptions),
	svgIcons(svgIconsOptions),
	virtualModules(virtualModulesOptions),
];

void individualPlugins;
void cdnJsDelivrUrl;
void cdnUnpkgUrl;

type PublicApi = typeof import("fast-vite-plugins");
// @ts-expect-error 转换辅助函数属于内部实现，不是公共 API。
type _InternalHelperMustNotBePublic = PublicApi["transformCdnImports"];

// @ts-expect-error algorithms 只接受受支持的压缩算法。
compression({ algorithms: ["zip"] });
// @ts-expect-error conflict 只接受公开枚举值。
componentRegistry({ conflict: "replace" });
