# v2 工程质量审查

## 审查范围

本次审查覆盖公共 API、类型设计、文件系统边界、Vite 生命周期、开发监听、构建与发布格式、依赖治理、ESLint/Prettier、自动化测试、CI、供应链发布、双语文档和贡献流程。

## v2 工程标准

| 领域     | 标准                                                                | 实现与验证                                                        |
| -------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| API      | 每个插件使用独立的 `create...Plugin` 工厂，不提供隐式组合入口       | 根入口按名称导出，公共 API 编译测试覆盖全部工厂与选项类型         |
| 模块格式 | Node 22+、ESM-only                                                  | 发布 `.mjs`、`.d.mts` 及对应 sourcemap                            |
| 构建     | TypeScript 6 + tsdown                                               | 根目录源码统一输出到根目录 `dist/`                                |
| Lint     | 不引用 Fast.ESLint.Config SDK，在仓库内维护可读规则                 | ESLint 10 flat config 覆盖 JS、TS、import、regexp、JSON、Markdown |
| 注释     | 公共类型、工厂和辅助函数说明用途、默认值、安全边界与错误条件        | TSDoc 与双语 API 文档共同维护                                     |
| 路径安全 | 所有生成与复制目标必须位于允许的根目录                              | 组件、路由、SVG、SRI、压缩与静态复制均执行边界检查                |
| 开发监听 | 防抖任务可取消，服务器关闭后不残留监听器                            | 自动化测试覆盖变更合并、重启和清理                                |
| 配置诊断 | 空列表、非法路径和无效数值在配置阶段失败                            | 统一使用 `fast-vite:<feature>` 错误前缀                           |
| 文件生成 | 结果稳定排序，内容不变时不重写                                      | 减少无意义 HMR、缓存失效和 Git 差异                               |
| 应用定位 | 公开插件直接服务 Web 应用的开发、构建、资源、安全和发布质量         | 不提供仅针对 npm 库模式的依赖外部化能力                           |
| 产物质量 | 支持逐文件/总量、raw/gzip/Brotli 预算，支持 SRI 和预压缩            | 真实 Vite 构建测试覆盖成功与失败路径                              |
| 发布     | 仓库根目录就是公开 npm 包，构建、打包和发布都从根目录执行           | Node 22.18/24.11、pnpm 11、Vite 8 CI 验证                         |
| 文档     | README、API、贡献、安全、工程审查及发布部署文档保持当前 v2 行为一致 | 文档与源码一起进入质量门禁                                        |

## Web 应用适用性审查

| 插件                               | Web 应用场景                    | 审查结论与边界                                                      |
| ---------------------------------- | ------------------------------- | ------------------------------------------------------------------- |
| `createComponentRegistryPlugin`    | Vue 组件注册与全局类型          | 保留；只扫描受控源码目录，并对名称冲突和输出越界报错                |
| `createRouterMetaPlugin`           | 页面文件到路由元数据            | 保留；只做静态分析，不执行应用源码                                  |
| `createSvgIconsPlugin`             | 仓库 SVG 生成 Vue 图标组件      | 保留；输入必须是可信仓库资源，不承担不可信 SVG 清洗                 |
| `createCdnImportPlugin`            | 浏览器依赖通过 CDN 全局变量加载 | 保留并显式启用；应固定版本，并验证 CDN、CSP、CORS 和网络可用性      |
| `createBuildInfoPlugin`            | 版本诊断、灰度与缓存排查        | 保留；生成信息会公开给浏览器，不应写入密钥                          |
| `createBundleBudgetPlugin`         | CI 中约束 JavaScript/CSS 体积   | 保留；推荐生产门禁使用默认错误模式                                  |
| `createCompressionPlugin`          | 生成 gzip/Brotli 预压缩资源     | 保留并显式启用；服务器或对象存储必须配置内容协商                    |
| `createSubresourceIntegrityPlugin` | 校验本地脚本和样式的内容完整性  | 保留；远程 CDN 与 publicDir 资源需要单独处理                        |
| `createDevRestartPlugin`           | 外部配置变化时重启开发服务器    | 保留；仅监听 Vite 模块图之外的输入                                  |
| `createStaticCopyPlugin`           | 构建后复制或转换静态资源        | 保留；目标被限制在 `outDir` 内，简单资源仍可优先使用 Vite publicDir |
| `createVirtualModulesPlugin`       | 注入构建期配置或生成模块        | 保留；消费项目需要为虚拟模块提供类型声明                            |
| `createEnvGuardPlugin`             | 启动与构建前校验环境变量        | 保留；诊断不输出变量值，浏览器可见变量仍应遵守 `VITE_` 暴露规则     |
| `createHtmlTemplatePlugin`         | HTML 占位符与标签注入           | 保留；默认转义替换值，仅可信内容才可关闭转义                        |

所有公开插件均直接作用于 Web 应用开发或生产构建，没有隐式启用；项目按需逐个导入。

## 质量门禁

`pnpm check` 统一执行：

1. tsdown ESM、类型声明与 sourcemap 构建；
2. TypeScript 6 严格类型检查；
3. 公共 API 编译型测试；
4. 类型感知 ESLint 10；
5. Prettier 格式检查；
6. Node 单元/文件系统测试；
7. 真实 Vite Web 应用构建、预算失败、SRI 与预压缩一致性集成测试。

发布前必须依次执行 `pnpm check` 和 `pnpm --config.ignore-scripts=true pack --dry-run`。CI 在 Node 22.18 与 24.11 两条受支持运行线使用 Vite 8 执行同一门禁，仅在 Node 24.11 检查归档。标签发布在完整检查通过后才会访问 npm。

## 明确保留的边界

- CDN 转换依赖 Vite/Rollup 提供的 AST 范围，无法安全支持普通 `export * from`。
- SVG 组件生成面向受信任源码资源，不是通用的不可信 SVG 清洗器。
- 预压缩只生成资源，不替代服务器内容协商配置。
- SRI 只覆盖本次 bundle 中的本地资源，不下载远程 CDN，也不自动处理 publicDir 文件。
- 外部配置重启不接受 glob；启动时不存在的目标按精确文件处理。
- 路由名称提取只支持静态 `defineOptions({ name })`，不执行应用源码。
- 插件库不负责消费项目的 CDN 可用性、CSP、缓存或发布平台配置。

这些限制均通过 TSDoc、API 文档、错误信息或测试显式表达，避免形成隐含行为。
