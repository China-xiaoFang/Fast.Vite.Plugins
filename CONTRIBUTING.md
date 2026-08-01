# Contributing / 贡献指南

感谢你改进 fast-vite-plugins。提交变更前，请先创建 Issue 描述问题、期望行为和最小复现；小型文档修正可以直接提交 Pull Request。

## Development

需要 Node.js `^22.18.0 || >=24.11.0` 和 pnpm 11。仓库使用 TypeScript 6、ESLint 10 与 tsdown；发布格式为 ESM-only。

```bash
pnpm install --frozen-lockfile
pnpm check
```

## Pull requests

- 一个 PR 只解决一个清晰问题。
- 新增或修改公共 API 时，必须更新类型、TSDoc、README/API 文档、测试和 changelog。
- 文件生成插件必须保证稳定排序、内容未变化时不写入，并覆盖 Windows 路径。
- 涉及文件写入时必须验证目标边界；不要引入隐式递归删除。
- 新依赖需要说明为什么不能使用 Node/Vite 已提供能力，并评估发布体积和维护状态。
- `pnpm check` 必须通过且不能产生未预期文件。
- 仓库根目录就是公开 npm 包；不要手工修改 `dist/` 构建产物，它由 `pnpm build` 生成且不提交到 Git。
- 发布只能使用根 `package.json`；不要增加复制、同步或二次改写包清单的脚本。
- 公共 API 变更必须同步更新 API 文档、类型测试和当前版本 changelog，不保留无期限别名。

## Commit style

建议使用简洁的 Conventional Commits，例如：

```text
feat(compression): support custom asset filters
fix(cdn-import): preserve named export aliases
docs: explain virtual module declarations
```

## Reporting bugs

请提供 Node、Vite、fast-vite-plugins 版本，最小配置，实际/期望结果和完整错误文本。涉及环境变量时请删除密钥和值。
