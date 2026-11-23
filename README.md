# 微信小游戏工作区

按游戏划分目录，共享微信开发、调试和 AI 工具链。不建立通用玩法框架，不强制所有依赖物理提升到根目录。

## 当前游戏

| 游戏 ID | 名称 | 技术栈 | Creator 工程 | 微信发布目录 |
| --- | --- | --- | --- | --- |
| `breakfast-stall` | 《早点凑一单》 | Cocos Creator 3.8.8 LTS、TypeScript | `games/breakfast-stall/` | `games/breakfast-stall/build/wechatgame-breakfast-release/` |

每款游戏独立拥有 Creator 工程、AppID、素材、存档、构建配置和产物；游戏之间不共享云账号、排行榜、广告或通用玩法组件。仓库根不是微信游戏入口。

## 常用命令

使用 Node 24 与 npm，在仓库根执行：

```bash
npm install
npm test
npm run typecheck
npm run build:breakfast
npm run dev:cocos:breakfast
node tools/check-monorepo-layout.cjs
```

- `npm test`：编译并运行当前游戏的规则与交互测试。
- `npm run typecheck`：检查当前游戏的 Cocos TypeScript 源码；需先由 Creator 完成工程导入并生成声明。
- `npm run build:breakfast`：本地构建早餐游戏发布包，不上传、提审或发布。
- `npm run dev:cocos:breakfast`：打开早餐 Creator 工程；同时只受控一个 Creator 工程。
- 游戏内原有 `npm --prefix games/breakfast-stall run build:wechatgame` 也可使用。

## 共享工具与凭证

`.tooling/` 保存共享 MCP、Skills、微信类型和自动化工具；`.tooling/bin/mini-ai-mcp` 的公共接口保持不变。npm 可按默认策略嵌套安装依赖，`.tooling/package-lock.json` 独立保留，启动器通过 Node 模块解析而不是写死安装目录。根 `package-lock.json` 是工作区统一入口。

首次恢复扩展依赖：

```bash
cocos_ext="$PWD/games/breakfast-stall/extensions/cocos-creator-mcp"
npm ci --prefix "$cocos_ext" --no-audit --no-fund
npm run --prefix "$cocos_ext" build
```

凭证、Token、模拟器数据、截图和 Creator 缓存保存在忽略的 `.tooling/local/`，不要提交。CloudBase 需先确认 EnvId 和用途，部署、上传、提审、发布需另行授权。

## 开发与验收

- 环境与工具恢复：[环境使用说明](环境使用说明.md)
- 构建、模拟器、日志与截图：[开发排障与测试手册](docs/开发排障与测试手册.md)
- 迁移路径与新增游戏约定：[多游戏目录迁移说明](docs/monorepo-migration.md)
- Agent 操作约束：[AGENTS.md](AGENTS.md)

新增游戏使用 `games/<game-id>/` 独立目录。有真实复用需求时再单独设计共享工具，不提前创建空 `packages/` 或共享游戏框架。历史文档中的旧路径对应当时记录，现行入口以本文件和迁移说明为准。
