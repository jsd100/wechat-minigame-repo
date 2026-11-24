# Monorepo 目录与开发工具契约

本文是当前长期目录与职责边界。新开发者先读 [仓库入口](../README.md) 和 [从零运行指南](getting-started.md)；开发具体游戏时读目标游戏的 `README.md`。只有审计历史迁移时才需要 [归档资料](archive/README.md)、旧设计或计划。

## 依赖方向

```text
仓库编排与共享开发工具 → 游戏自有工具 → 游戏源码、资源与产物
```

跨游戏只共享开发工具链，不共享玩法、场景、素材、存档、云账号、排行榜、广告或通用运行时组件。公共脚本不得读取 `games/*/assets/`、游戏 AppID、Creator UUID 或启动页图片；这些身份由游戏自己检查。

## 四层职责

| 层 | 内容 | 职责边界 |
| --- | --- | --- |
| 仓库公共 | 根 `package.json` / 锁文件、根 `tools/`、`.tooling/`、公共指南 | npm workspaces、公共命令、通用目录/依赖检查、MCP、Skills、类型与自动化工具。根不是微信运行入口。 |
| 游戏 `games/<game-id>/` | Creator 工程、源码、扩展、构建配置、游戏脚本和 README | 独立 AppID、素材、存档、UUID、构建产物、业务检查和验收。 |
| 本机 | `.tooling/local/`、Creator 缓存、Token、模拟器数据与截图 | 不进提交，不得成为运行依赖。可在本机记录证据，但不能要求复制历史随机目录。 |
| 历史 | `docs/archive/` 的迁移说明与执行台账、`docs/superpowers/` 的任务资料 | 保留当时事实与证据，不充当日常命令入口。`docs/superpowers/` 不移动、不改写历史正文，只在归档移动直接影响时修复链接。 |

## 脚本归属

| 入口 | 所有者 | 作用与前置条件 |
| --- | --- | --- |
| `npm test` | 根遍历实现 `test` 的 workspaces | 纯规则测试，无需 Creator 或 `temp/declarations/cc.d.ts`。 |
| `npm run typecheck` | 根遍历实现 `typecheck` 的 workspaces | 完整 Cocos 类型检查，需先打开目标 Creator 完成导入并生成声明。 |
| `npm run check:layout` | 根 `tools/check-monorepo-layout.cjs` | 检查通用 workspace、独立输出名、忽略规则、游戏 `check` 脚本和根锁完整性；不读取游戏资源。 |
| `npm run check` | 根布局检查 + 各游戏 `check` | 分别验证公共契约与各游戏身份；`.tooling` 不实现游戏 `check`。 |
| `npm run check:mcp` | 根 `tools/check-mcp.cjs` | 验证三个 stdio MCP 握手及规定的只读调用；不是目录检查。 |
| `node tools/check-documentation.cjs` | 根 `tools/check-documentation.cjs` | 验证日常文档与归档的本地链接、从零教程入口；不检查游戏运行或外部 URL。 |
| `npm run build:breakfast` | 早餐 `tools/build-wechatgame.cjs` | 本地发布构建，需 Creator 与早餐启动页扩展，不上传发布。 |
| `npm run dev:cocos:breakfast` | 早餐 `tools/open-creator.cjs` | 打开早餐 Creator，脚本按自身位置定位工程；一次只受控一个 Creator。 |

`npm install` / `npm ci` 按根清单恢复依赖，采用 npm 默认物理提升，不强制嵌套。`.tooling` 与 Cocos 扩展的独立锁文件保留。版本化的构建、检查和素材维护脚本是稳定开发入口，不是一次性临时脚本。

## 游戏内部契约

每个 `games/<game-id>/` 应包含：

- 独立 `assets/`、`settings/`、`extensions/` 及资源 `.meta`；
- `tools/` 中的构建、类型检查、资源维护和身份/场景检查；
- `tests/` 中的纯逻辑测试及所需最小测试声明；
- `package.json` 中的 Creator UUID、版本、`check` 和本游戏命令；
- 独立微信构建 JSON、AppID、存档键和 `build/` 产物；
- 游戏自己的 `README.md`，写明前置条件、扩展所有权、命令和验收路径。

早餐的最小测试声明只覆盖纯测试所需几何数据类型；完整 `typecheck` 仍用 Creator 生成的真实声明，不能用测试桩替代引擎类型检查。

## 新增游戏

1. 在 `games/<game-id>/` 创建独立工程与 `package.json`，不要复制早餐素材、AppID、存档键、UUID 或启动页。
2. 分别配置 Creator UUID、AppID、素材、存档、构建配置和独立产物名。
3. 按需实现游戏自己的 `test`、`typecheck`、`check`、`build:wechatgame` 和 `dev:cocos`；根测试与检查会自动纳入这些工作区，不要求修改公共脚本。
4. 在游戏 README 中写清前置条件和验收方法；根 README 只登记游戏及必要的显式 `build:<game-id>` / `dev:cocos:<game-id>` 别名。
5. 从仓库根安装开发工具；游戏运行时需要的依赖留在游戏自己的工程中。
6. 一次只打开一个受控 Creator 工程，微信只传新游戏的实际构建目录。
7. 只有真实跨游戏开发工具复用需求出现时，才单独设计共享工具；不创建空 `packages/` 或公共玩法框架。

## 文档维护

- 公共目录、命令或共享工具变化：更新本文、README、AGENTS 与环境说明。
- 公共安装或首次运行流程变化：更新 README 的导航、[从零运行指南](getting-started.md) 与 AGENTS；教程不复制到 AI 环境或排障手册。
- 单个游戏玩法、素材、配置或验收变化：更新该游戏 README 与游戏记录，不要求同步所有公共文档。
- AI/MCP 或凭证变化：只更新 `环境使用说明.md` 及对应模板说明。
- `docs/archive/` 只保留已完成迁移资料；`docs/superpowers/` 按既有任务约定维护，不作为日常文档入口。
- 历史迁移资料只加导航，不批量改写历史路径或伪造历史验证。
