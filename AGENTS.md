# 微信小程序与小游戏开发

先从项目配置确认任务目标。小程序使用 `app.json` 和原生 TypeScript。原生 2D 小游戏使用 `game.js`、`game.json` 和 Canvas 2D。Cocos 游戏使用各自 `games/<game-id>/` 中的 Creator 工程与 TypeScript；当前早餐工程为 `games/breakfast-stall/`，使用 Cocos Creator 3.8.8 LTS。

- 微信编译、模拟器和真机预览使用 `wechatide-skill`。小程序操作页面元素，小游戏操作 Canvas。读取当前项目和产物路径后再调用工具。
- 修改早餐 Cocos 项目时编辑 `games/breakfast-stall/assets/` 等源码。通过编辑器 MCP 读取场景和节点，先核对 `cocos://project/info` 对应新工程。调试包位于 `games/breakfast-stall/build/wechatgame/`。
- 从仓库根运行 `npm test`、`npm run typecheck`、`npm run build:breakfast`。发布包为 `games/breakfast-stall/build/wechatgame-breakfast-release/`；`npm run dev:cocos:breakfast` 打开早餐 Creator 工程。
- 小游戏助手 MCP 预览入口使用包含 `game.js` 的绝对目录。Cocos 项目传微信构建产物目录。
- 验收至少包含一次本地编译和一次核心交互。3D 项目尽早真机验证启动、触控、帧率和切后台恢复。截图和日志需来自本次运行。
- 云操作先确认 EnvId 和用途。部署、上传、提审和发布按当前任务授权执行。账号凭证使用客户端本地存储或项目的 `.tooling/local/`。

项目入口和 MCP 状态见 [环境使用说明](环境使用说明.md)，仓库总入口见 [README](README.md)。接手复现、截图或回归测试时，先看[开发排障与测试手册](docs/开发排障与测试手册.md)中的可执行命令和真实案例。

## 多游戏目录约定

- 跨游戏只共享开发工具链，不共享云账号、排行榜、广告或通用玩法组件；不提前抽公共游戏框架。
- 目录划分优先，不要求所有 npm 依赖物理提升到根目录；共享 MCP 通过 Node 解析，不写死安装目录。
- 当前唯一活动 Creator 工程为 `games/breakfast-stall/`；旧生成目录不得再用于开发或验收。
- 资源和 `.meta`、Creator UUID、启动页扩展必须整体保留；不得将历史设计/验收记录中的旧路径批量改写成新事实。
- 新增游戏、构建脚本或共享工具时同步更新 README、环境说明、排障手册和本文件；历史记录只加迁移导航。
- 迁移验收与安全清理由 [执行状态](docs/monorepo-execution.md) 记录。若文档、实际目录或计划不一致，先停止核对，不覆盖未提交改动，不自动扩大改动范围。
