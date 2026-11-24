# 微信小游戏工作区

基于 npm workspaces 的微信小游戏 Monorepo：各游戏独立管理 Cocos Creator 工程、素材与构建产物，共享开发、调试和 AI 工具链。

## 从这里开始

**新电脑或第一次接触本项目：阅读 [从零安装并运行指南](docs/getting-started.md)。**

教程以 Cocos Creator 和微信开发者工具界面为主，覆盖 macOS 与常规 Windows 10/11：安装工具、获取项目、导入源码、构建微信包并在模拟器完成一次帮助交互。普通运行不要求 Node、MCP、Skills 或 Token；Node 24 只用于可选验证与进阶开发。

## 当前游戏

| 游戏 ID | 名称 | 技术栈 | 工程与开发说明 |
| --- | --- | --- | --- |
| `breakfast-stall` | 《早点凑一单》 | Cocos Creator 3.8.8 LTS、TypeScript | [早餐开发说明](games/breakfast-stall/README.md) |

每款游戏独立拥有 Creator 工程、AppID、素材、存档、构建配置和产物；游戏之间不共享云账号、排行榜、广告或通用玩法组件。**仓库根不是微信游戏入口。**

## 公共命令（可选验证）

从零教程的第 6 节安装 Node 24 与 npm 后，在仓库根执行：

```bash
npm ci
npm test
npm run check
```

`npm test` 运行纯规则测试，无需 Creator；`npm run check` 包含公共布局与各游戏自己的检查。完整 `npm run typecheck` 需先由目标 Creator 完成导入并生成声明。构建与 Creator 启动别名见目标游戏说明。

## 文档导航

| 需要 | 文档 |
| --- | --- |
| 从零安装、构建与运行 | [从零运行指南](docs/getting-started.md) |
| 目录边界与新增游戏 | [目录与开发工具契约](docs/repository-layout.md) |
| 早餐专属构建、测试与验收 | [早餐开发说明](games/breakfast-stall/README.md) |
| 进阶排障与自动化测试 | [开发排障与测试手册](docs/开发排障与测试手册.md) |
| 可选 AI/MCP/Skills 与本机凭证 | [环境使用说明](环境使用说明.md) |
| 泛微信生态进阶资料 | [AI 开发资源手册](微信小程序与2D-3D小游戏AI开发资源手册.md) |
| 历史迁移资料 | [docs/archive/](docs/archive/README.md) |
| Agent 操作约束 | [AGENTS.md](AGENTS.md) |

`docs/superpowers/` 按原任务约定保存历史设计与验收资料，不是日常操作入口。Cocos 扩展自带文档归扩展自身维护。

## 共享工具与凭证

`.tooling/` 保存共享 MCP、Skills、微信类型和自动化依赖。根 `package-lock.json` 是工作区统一入口，采用 npm 默认物理提升，不强制嵌套。

凭证、Token、模拟器数据、截图和 Creator 缓存保存在忽略的 `.tooling/local/`，不要提交，不得把历史随机目录作为运行依赖。部署、上传、提审、发布需另行授权。
