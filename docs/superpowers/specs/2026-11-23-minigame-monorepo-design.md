# 多游戏 Monorepo 组织设计

## 文档状态与恢复入口

本文描述**已确认的目标设计**，不是迁移已完成的事实声明。开始执行前先读 [Monorepo 执行状态与文档维护约定](../archive/monorepo-execution.md) 和 [迁移实施计划](../plans/2026-11-23-minigame-monorepo.md)，并以 Git 工作树为准。迁移完成时同步更新当前操作指南；历史设计、计划和验收记录保留当时事实，只增加迁移导航。

## 目标与边界

将当前只有《早点凑一单》的仓库调整为可继续容纳其他微信小游戏的 monorepo。每款游戏保有独立源码、Creator 工程、AppID、存档、素材、构建配置和微信发布目录；跨游戏只共享开发工具链。

当前没有共享云账号、排行榜、广告、通用玩法组件或跨游戏后端需求。不提前抽取通用游戏规则、场景 assets、游戏 UI、素材或运行时服务，不引入 Turborepo、Nx 或 pnpm，不自动上传、提审或发布任何游戏。

## 目录与所有权

```text
仓库根/
├─ games/
│  └─ breakfast-stall/           # 完整 Cocos Creator 3.8.8 工程
│     ├─ assets/                 # 场景、玩法、素材及对应 .meta
│     ├─ settings/               # Creator 工程和 MCP 配置
│     ├─ extensions/
│     │  ├─ breakfast-startup/   # 早餐专属启动页扩展及图片
│     │  └─ cocos-creator-mcp/   # 第一阶段原样保留的编辑器扩展
│     ├─ tests/                  # 本游戏 Node 测试
│     ├─ tools/                  # 本游戏构建、验收和素材工具
│     ├─ build.wechatgame.json
│     ├─ build.wechatgame.release.json
│     ├─ package.json
│     └─ tsconfig.json
├─ .tooling/                     # 共享 MCP、Skills、npm 开发依赖
├─ docs/                         # 通用指南、游戏设计与验收记录
├─ package.json                  # npm workspaces 与仓库级脚本
└─ package-lock.json             # 根 npm 锁文件
```

`games/breakfast-stall/` 是工程根，不再额外套一层 `cocos/`。游戏 ID 使用稳定英文标识 `breakfast-stall`，玩家标题继续为《早点凑一单》，不修改游戏内品牌、AppID、关卡、存档键或资源 UUID。

不创建空的 `packages/` 或共享游戏框架。出现真实复用需求时，再单独设计共享代码。

## 包管理与脚本

使用 npm workspaces，声明 `games/*` 和 `.tooling` 两个工作区。`.tooling` 已名为 `wechat-local-development-tools`，保留共享 MCP 服务、微信类型、自动化工具与 TypeScript；各游戏的 `package.json` 保留 Creator UUID、版本和本游戏命令。根 `package.json` 是私有工作区编排入口，统一声明当前 Node 24 工具链范围，不改变 Cocos 的 TypeScript 目标。

根提供 `test`、`typecheck`、`build:breakfast` 和 `dev:cocos:breakfast` 等明确的仓库级命令。游戏工作区提供 `test`、`typecheck` 和既有 `build:wechatgame`。`npm --prefix games/breakfast-stall run build:wechatgame` 继续可用；`npm --prefix cocos-game run build:wechatgame` 在完成迁移后不再作为兼容入口。

迁移时保留两份来源锁文件的内容：用 npm 生成根锁文件，不手抄依赖解析；Cocos MCP 扩展的独立锁文件保留。扩展 manifest 与其锁文件的版本差异单独核对，不在迁移中顺手升级扩展。

采用 npm 默认的依赖安装策略，不要求 `--install-strategy=nested`，也不追求所有依赖在物理上都位于根 `node_modules/`；目录划分与各游戏独立才是目标。npm 可将共享工具依赖保留在 `.tooling/node_modules/`，其独立锁文件继续保留。MCP 启动器通过 `require.resolve()` 从仓库根工作区和 `.tooling` 的正常 Node 搜索路径解析服务模块，兼容包的 `exports` 限制，不写死 `.tooling/node_modules/`。TypeScript 等命令通过根 `node_modules/.bin/` 或 npm 工作区 PATH 调用。根安装使用 `npm install` 并验证三个 stdio MCP 握手。

早餐启动页扩展的 `builder.js`、`hooks.js`、`package.json`、`breakfast-start.jpg`、`breakfast-start-art.jpg` 已全部纳入基线提交 `7e2237c`。迁移逐个核对这五个文件及启动页效果，不能只迁移旧提交中曾存在的文件。

## 构建与验收职责

通用构建逻辑只负责发现 Creator、执行指定构建配置、检查公共微信入口文件。`games/breakfast-stall/tools/build-wechatgame.cjs` 通过仓库根解析或 `COCOS_CREATOR_BIN` 找到 Creator，不依赖固定的 `cocos-game` 名称或相对层级。

早餐启动页扩展及 `first-screen.js`、`breakfast-start.jpg` 的检查留在早餐工程中。以后若出现第二个同类需求，再把通用启动页钩子提取为开发工具，不把早餐图片和文案放进共享包。

每款游戏形成一一映射：游戏 ID → Creator 工程 → AppID → 构建配置 → 独立产物。产物继续位于该工程的 `build/` 下；`wechatgame-breakfast-release` 保持现有 AppID、竖屏和发布模式。

## Cocos 与 MCP 约定

完整移动 `assets/`、`settings/`、`package.json`、`tsconfig.json`、两份构建 JSON、`tools/`、`tests/` 和 `extensions/`，保留目录与资源 `.meta`、场景引用、Bundle 配置和 Creator UUID。`library/`、`temp/`、`profiles/` 和 `build/` 由 Creator 或构建器重新生成，不纳入迁移提交。

第一阶段 `cocos-creator-mcp` 留在游戏工程，避免同时改变扩展发现机制。MCP 一次只操作一个 Creator 工程，继续使用 `127.0.0.1:3000/mcp`；开始读取前必须核对工程路径与当前场景。未来需要同时打开多个工程时，为每个工程分配独立端口并同步各客户端 URL，不能默认共用运行实例。扩展的 `dist` 和 `node_modules` 仍按既有方式本地恢复。

`dev:cocos:breakfast` 只负责按新工程路径启动 Creator，不自动复用或猜测现有 MCP 所属工程。迁移期间先关闭打开旧 `cocos-game` 的 Creator 窗口，再启动 `games/breakfast-stall/`；读取到的工程路径不匹配时立即停止场景操作，不通过换端口掩盖错误。确认新 MCP 后，必要时重载对应 Agent 客户端的 MCP 连接。端口冲突只记录为环境状态，不能算新工程验证成功。

## AI 工具、凭证与文档

微信 MCP、小游戏助手、CloudBase 连接和项目 Skills 保留在仓库根 `.tooling/`。`.tooling/apps`、缓存、`local/`、Token、模拟器数据与截图证据继续留在本机且不提交。各客户端的示例配置保留根启动器；真实本机路径不出现在新的共享脚本或提交中。

更新 `AGENTS.md`、环境说明、开发排障手册中的活动路径和命令；历史设计与验收记录保留当时的路径含义，不为制造“路径一致”而改写历史。补充仓库级入口文档，说明新游戏应创建独立目录和配置，而不是复制早餐资源形成隐式耦合。

根 `project.config.json` 含另一 AppID，但仓库根没有对应 `game.js` 和 `game.json`，不是当前游戏的有效运行入口。迁移时将它从根移除，不迁移进早餐工程，不改变或复用其中的 AppID；如后续确实需要该旧项目，另建独立游戏目录并恢复其完整源码。

## 迁移与验证顺序

1. 以提交 `7e2237c` 为基线，确认没有未提交业务改动。
2. 将完整 Creator 工程迁入 `games/breakfast-stall/`，更新生成物忽略规则。
3. 修正 Creator 发现逻辑、构建入口、测试与类型检查脚本、活动文档和 Agent 指南。
4. 引入根 npm workspaces 和仓库级命令，保留早餐专属构建验收。
5. 移除无效根微信入口，检查最终 diff、资源 meta 和敏感文件。
6. 让 Creator 重新导入迁移后的工程，通过 MCP 核对路径、场景和脚本引用。
7. 跑全部 35 项测试、严格规则测试编译、Cocos 类型检查及微信发布构建。
8. 从 `games/breakfast-stall/build/wechatgame-breakfast-release/` 重新打开或导入微信模拟器，验证启动页、帮助开关与一条取餐/撤回路线，保存本轮截图和日志。不得再用仓库根或旧 `cocos-game/` 产物验收。
9. 确认新工程及微信模拟器都工作后，关闭旧窗口，再清理旧 `cocos-game/` 遗留的忽略生成物；清理前核对绝对路径，不删除新工程、`.tooling/local/` 或任何本机凭证。检查现有 Agent 配置及文档，避免按仓库根打开微信项目。

验收不能只依赖 Git rename、构建退出码或触控指令的 `success`，必须核对真实工程和画面状态。真机帧率、切后台恢复与上传发布不在本次迁移范围。

## 非目标与延期决策

- 不建立跨游戏 `core`、共享云账号、排行榜、广告或通用玩法组件。
- 不统一多款游戏成同一 Creator 工程、场景或 Bundle。
- 不同时重构 MCP 扩展为全局扩展，不承诺多个 Creator 同时受控。
- 不重新设计游戏 UI、玩法、素材、存档或 AppID。
- 不因为包管理器变化升级微信、Creator、MCP 或游戏运行时依赖。
