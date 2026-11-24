# 微信小游戏工作区

按游戏划分目录，共享微信开发、调试和 AI 工具链。不建立通用玩法框架，不强制所有依赖物理提升到根目录。

## 当前游戏

| 游戏 ID | 名称 | 技术栈 | 工程与开发说明 |
| --- | --- | --- | --- |
| `breakfast-stall` | 《早点凑一单》 | Cocos Creator 3.8.8 LTS、TypeScript | [games/breakfast-stall/README.md](games/breakfast-stall/README.md) |

每款游戏独立拥有 Creator 工程、AppID、素材、存档、构建配置和产物；游戏之间不共享云账号、排行榜、广告或通用玩法组件。仓库根不是微信游戏入口。

## 公共命令

使用 Node 24 与 npm，在仓库根执行：

```bash
npm ci
npm test
npm run typecheck
npm run check:layout
npm run check
npm run check:mcp
npm run build:breakfast
npm run dev:cocos:breakfast
```

- `npm test`：运行所有实现 `test` 的工作区，纯规则测试无需 Creator 或本机临时文件。
- `npm run typecheck`：运行所有实现 `typecheck` 的工作区；Cocos 工程需先完成 Creator 导入和声明生成。
- `npm run check:layout`：检查通用工作区结构、独立输出名和根锁完整性，不读取游戏资源或 AppID。
- `npm run check`：运行公共布局检查和每个游戏自己的 `check`。
- `npm run check:mcp`：验证三个 stdio MCP 握手及规定的只读调用。
- `npm run build:breakfast`、`npm run dev:cocos:breakfast`：早餐的本地构建和 Creator 启动别名，不上传、提审或发布。

## 边界与文档

- [目录与开发工具契约](docs/repository-layout.md)：公共、游戏、本机与历史资料的职责，脚本归属和新增游戏步骤。
- [环境使用说明](环境使用说明.md)：共享工具、Skills/MCP、凭证和本机恢复。
- [开发排障与测试手册](docs/开发排障与测试手册.md)：可重复排障方法及明确归属早餐的案例。
- [Agent 操作约束](AGENTS.md)：跨项目安全规则和项目发现方法。
- 单个游戏的前置条件、扩展、构建与验收：以该游戏 `README.md` 为准，不要求同步到所有公共文档。

## 共享工具与凭证

`.tooling/` 保存共享 MCP、Skills、微信类型和自动化工具；`.tooling/bin/mini-ai-mcp` 的公共接口保持不变。npm 采用默认物理提升，`.tooling/package-lock.json` 独立保留，启动器通过 Node 模块解析而不是写死安装目录。根 `package-lock.json` 是工作区统一入口。

凭证、Token、模拟器数据、截图和 Creator 缓存保存在忽略的 `.tooling/local/`，不要提交，不得把历史随机目录作为运行依赖。CloudBase 需先确认 EnvId 和用途，部署、上传、提审、发布需另行授权。

新增游戏使用 `games/<game-id>/` 独立目录。有真实复用需求时再单独设计共享工具，不提前创建空 `packages/` 或共享游戏框架。历史文档中的旧路径对应当时记录，现行入口以本文件和 [长期目录契约](docs/repository-layout.md) 为准。
