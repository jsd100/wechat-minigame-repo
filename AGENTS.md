# 微信小程序与小游戏开发

先从项目配置确认任务目标。小程序使用 `app.json` 和原生 TypeScript。原生 2D 小游戏使用 `game.js`、`game.json` 和 Canvas 2D。3D 小游戏使用 `cocos-game/` 中的 Cocos Creator 3.8.8 LTS 与 TypeScript。

- 微信编译、模拟器和真机预览使用 `wechatide-skill`。小程序操作页面元素，小游戏操作 Canvas。读取当前项目和产物路径后再调用工具。
- 修改 Cocos 项目时编辑 `cocos-game/assets/` 等源码。通过编辑器 MCP 读取场景和节点。调试包位于 `cocos-game/build/wechatgame/`。从仓库根目录运行 `npm --prefix cocos-game run build:wechatgame`，生成发布包 `cocos-game/build/wechatgame-breakfast-release/`。
- 小游戏助手 MCP 预览入口使用包含 `game.js` 的绝对目录。Cocos 项目传微信构建产物目录。
- 验收至少包含一次本地编译和一次核心交互。3D 项目尽早真机验证启动、触控、帧率和切后台恢复。截图和日志需来自本次运行。
- 云操作先确认 EnvId 和用途。部署、上传、提审和发布按当前任务授权执行。账号凭证使用客户端本地存储或项目的 `.tooling/local/`。

项目入口和 MCP 状态见 [环境使用说明](环境使用说明.md)。接手复现、截图或回归测试时，先看[开发排障与测试手册](docs/开发排障与测试手册.md)中的可执行命令和真实案例。
