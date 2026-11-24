# 微信小程序与小游戏开发

先读 [仓库入口](README.md)、[从零运行指南](docs/getting-started.md)、[目录与开发工具契约](docs/repository-layout.md) 和目标游戏的 `README.md`，确认项目类型、源码目录、构建产物及前置条件。小程序使用 `app.json` 和原生 TypeScript；原生 2D 小游戏使用 `game.js`、`game.json` 和 Canvas 2D；Cocos 游戏使用各自 `games/<game-id>/` 中的 Creator 工程与 TypeScript。

## 跨项目规则

- 微信编译、模拟器和真机预览使用 `wechatide-skill`。小程序操作页面元素，小游戏操作 Canvas；微信项目只传目标游戏实际构建产物目录，不能传仓库根。
- 修改 Cocos 游戏时编辑其 `games/<game-id>/assets/` 等源码。通过编辑器 MCP 读取场景和节点，先核对 `cocos://project/info` 对应目标工程。
- 从仓库根运行 `npm test`、`npm run typecheck`、`npm run check`；本地构建使用目标游戏或根别名。纯规则测试无需 Creator，完整类型检查需目标 Creator 完成导入。
- 验收至少包含一次本地编译和一次核心交互。3D 项目尽早真机验证启动、触控、帧率和切后台恢复。截图和日志需来自本次运行。
- 云操作先确认 EnvId 和用途。部署、上传、提审和发布按当前任务授权执行。账号凭证使用客户端本地存储或项目的 `.tooling/local/`。

项目入口和共享工具恢复见 [环境使用说明](环境使用说明.md)。可重复排障方法见 [开发排障与测试手册](docs/开发排障与测试手册.md)；早餐案例以 [早餐开发说明](games/breakfast-stall/README.md) 为准，不是其他游戏的强制教程。

## 多游戏目录约定

- 跨游戏只共享开发工具链，不共享云账号、排行榜、广告或通用玩法组件；不提前抽公共游戏框架。
- 公共脚本不得读取 `games/*/assets/`、游戏 AppID、Creator UUID 或启动页图片；这些身份由游戏自己检查。
- 目录划分优先，不要求所有 npm 依赖物理提升到根目录；共享 MCP 通过 Node 解析，不写死安装目录。
- 新增游戏、构建脚本或共享工具时按所有权更新文档：公共契约变化更新 README、环境说明、排障手册和本文件；单个游戏变化更新该游戏 README 与记录。
- 资源和 `.meta`、Creator UUID、启动页扩展必须整体保留；不得将历史设计/验收记录中的旧路径批量改写成新事实。
- 版本化的构建、检查和素材维护脚本是稳定开发入口。`.tooling/local/`、随机 `/tmp` 快照及旧迁移驱动不得成为日常运行依赖。
- 历史迁移资料集中在 [docs/archive/](docs/archive/README.md)，`docs/superpowers/` 按原任务约定保留；日常开发不要求先读这些资料。若文档、实际目录或计划不一致，先停止核对，不覆盖未提交改动，不自动扩大改动范围。
