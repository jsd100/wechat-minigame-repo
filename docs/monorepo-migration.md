# 多游戏目录迁移说明

## 当前入口

2026-11-23 起，《早点凑一单》的唯一活动 Creator 工程为 `games/breakfast-stall/`。游戏 ID 为 `breakfast-stall`，玩家标题、AppID、玩法、存档键、Creator UUID、资源 `.meta` 和早餐启动页均保持独立。

| 用途 | 迁移前 | 当前 |
| --- | --- | --- |
| Creator 工程 | 旧单一工程目录 | `games/breakfast-stall/` |
| 微信发布目录 | 旧工程的 `build/wechatgame-breakfast-release/` | `games/breakfast-stall/build/wechatgame-breakfast-release/` |
| 构建 | 游戏目录内 npm 命令 | 根 `npm run build:breakfast` |
| 测试与类型 | 手工 TypeScript 长命令 | 根 `npm test`、`npm run typecheck` |
| 打开 Creator | 指定旧工程 | 根 `npm run dev:cocos:breakfast` |
| 共享 MCP | `.tooling/bin/mini-ai-mcp` | 路径不变，通过 Node 解析模块 |

迁移前的根 `project.config.json` 使用另一个 AppID，且根目录无 `game.js`、`game.json`，不是有效游戏入口；该配置已按设计删除，没有迁移或复用其 AppID。本机忽略的根私有配置也不再作为入口。

## 范围与依赖

本次是目录划分与共享开发工具链整理，不引入通用玩法框架、共享云账号、排行榜或广告，也不要求完整 monorepo 的所有依赖物理提升。npm workspaces 包含 `games/*` 和 `.tooling`，共享工具可按 npm 默认策略嵌套安装，独立 `.tooling/package-lock.json` 保留。Cocos MCP 扩展仍属于早餐工程，其独立依赖和锁文件不并入游戏工作区。

资源与启动页文件已在任务 1 核对 65 项哈希一致。构建、MCP、微信模拟器和旧生成物清理的实际结果以 [本次验收记录](superpowers/verification/2026-11-23-minigame-monorepo.md) 为准，未完成项不由本文推断。

## 新增游戏

1. 在 `games/<game-id>/` 创建独立工程与 `package.json`，将新游戏加入根脚本。
2. 分别配置 Creator UUID、AppID、素材、存档、构建配置和独立产物。
3. 从仓库根安装开发工具；游戏运行时需要的依赖留在游戏自己的工程中。
4. 一次只打开一个受控 Creator 工程，微信只传新游戏的实际构建目录。
5. 有真实跨游戏开发工具复用需求时再设计共享代码，不创建空 `packages/`。

## 历史资料

旧设计、计划与验收记录中的 `cocos-game/` 是当时真实路径，不批量改写。现行操作以 [README](../README.md)、[环境使用说明](../环境使用说明.md) 和 [开发排障与测试手册](开发排障与测试手册.md) 为准；迁移执行过程见 [执行状态](monorepo-execution.md)。
