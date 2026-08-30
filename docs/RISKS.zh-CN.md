# 风险指南

这些插件拥有构建进程的文件系统和网络信任。所有路径、远程资源和生成的 HTML 值都应按代码或部署配置审核。

## CDN 远程代码

`cdnImport` 会注入维护者选择的远程 JavaScript。应固定包版本、用 CSP 限制来源、验证可用性与 CORS，并在 CDN 能提供稳定字节时单独维护 SRI。插件不会让远程代码自动变得可信。

## SVG 与原始 HTML

`svgIcons` 会把 SVG 标记直接写入生成的 TSX 源码，只能扫描已审核的仓库 SVG。`htmlTemplate({ escape: false })` 只能接收可信静态内容，不能接收用户可控值。

## 构建信息公开

`buildInfo` 和 SRI 清单可能公开版本、提交标识、构建模式、文件名及部署结构。只生成允许公开的字段，并明确缓存策略。

## 静态复制与文件系统边界

`staticCopy` 能读取维护者指定的源，并写入当前 output 目录。源与目标不得重叠、互相包含或经过 symlink/junction；应审核转换结果以及多 output 的每个目标。

## SRI 与 publicDir

SRI 只计算当前 bundle 中的文件。`publicDir` 文件不在 bundle 中，无法自动校验；应将其纳入构建图、独立维护哈希，或在关闭 strict 时记录例外原因。

## 预压缩部署

压缩插件只生成 `.gz` 和 `.br` 同级文件。服务器仍需协商 `Accept-Encoding`，返回正确的 `Content-Encoding` 与内容类型，按编码区分缓存，并原子部署原文件和压缩文件。插件顺序固定为 SRI → 预算 → 压缩。
