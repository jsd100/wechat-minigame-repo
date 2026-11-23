# 多游戏 Monorepo 迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将早餐 Creator 工程迁入 `games/breakfast-stall/`，以 npm workspaces 统一管理开发工具，保持游戏构建、资源和微信交互不变。

**Architecture:** 完整移动单个 Creator 工程，保留资源 `.meta`、项目 UUID 和早餐专属扩展。仓库根只负责 npm 工作区编排与共享工具，不抽公共游戏框架；MCP 启动器和测试脚本适配 npm 依赖提升。

**Tech Stack:** Cocos Creator 3.8.8、TypeScript 5.9.3、Node 24、npm workspaces、微信开发者工具与 MCP。

**Spec:** `docs/superpowers/specs/2026-11-23-minigame-monorepo-design.md`

**执行前必读：** `docs/monorepo-execution.md` 记录当前阶段、不可违反的边界、恢复顺序和文档同步清单。本文的目标路径在任务实际完成前不代表当前文件位置；每项任务完成时更新本文复选框及执行状态文件。用户已要求迁移完成后同步更新所有当前项目文档，不能只修改源码而留下过时命令。

## Global Constraints

- 跨游戏只共享开发工具链，不修改玩法、AppID、存档键、素材、资源 UUID 或启动页文案。
- 只采用 npm，不引入 pnpm、Turborepo、Nx 或空共享包。
- `library/`、`temp/`、`profiles/` 和 `build/` 为重建产物，不迁移进版本控制。
- 一次只操作一个 Creator MCP 实例；路径不匹配时停止操作。
- 不上传、提审、发布或执行 CloudBase 写操作。

## Review Focus

- 资源 `.meta` 与场景引用必须在迁移后保持一致；任务 1 比较迁移前后受控文件。
- `.tooling` 被提升依赖后 MCP 和 `tsc` 仍可解析；任务 3 实测三条 stdio MCP 握手。
- 早餐专属启动页不能被通用化或漏迁；任务 2、5 检查五个扩展文件和实际启动脚本。
- 旧 Creator 或微信窗口可能让 MCP/截图来自错误目录；任务 4、5 强制核对新路径。
- 根旧微信配置含另一 AppID，不能误作游戏入口；任务 4 删除并只从新发布目录验收。

---

### Task 1: 完整迁移 Creator 工程并保留资源契约

**Files:**
- Move: `cocos-game/` 中所有受 Git 跟踪的内容 → `games/breakfast-stall/`
- Modify: `.gitignore`
- Create: `tools/check-monorepo-layout.cjs`
- Create: `package.json`（仅先声明私有工作区，脚本在任务 2、3 补齐）

**Interfaces:**
- Produces: 新 Creator 根 `games/breakfast-stall/`；布局检查命令 `node tools/check-monorepo-layout.cjs`。
- Preserves: `package.json` 的 `uuid`、`creator.version`、所有 `assets/**.meta` 与两个构建 JSON。

- [x] **Step 1: 核对基线并编写布局失败测试**

确认 `git status --short` 仅有已审阅的设计/计划文档；基线 `7e2237c` 包含早餐启动页五个文件。布局测试在迁移前运行，预期因 `games/breakfast-stall/package.json` 不存在而失败。

- [x] **Step 2: 移动完整工程**

创建 `games/` 后用 `git mv cocos-game games/breakfast-stall` 移动受控工程。保留 `assets/`、`settings/`、`extensions/`、`tools/`、`tests/`、`package.json`、`tsconfig.json` 和构建配置；不手工重建 `.meta` 或项目 UUID。

- [x] **Step 3: 更新忽略规则与布局检查**

将 `/cocos-game/{build,library,local,profiles,temp}/` 改为 `/games/*/...` 对应规则，保留全局 `node_modules/`、本机工具和凭证忽略。测试断言新工程必要文件存在、启动页五文件存在、旧 `cocos-game/package.json` 不再存在、构建输出名与 AppID 不变。

- [x] **Step 4: 验证移动没有改写受控源码**

运行 `git diff --summary`、`git diff --check` 和布局检查；核对 `git status` 中只有迁移、设计/计划及明确配置改动。此步不跑依赖旧 `temp` 的 Creator 类型检查。

- [x] **Step 5: 提交工程移动**

`git add` 后提交 `refactor: 将早餐工程迁移至多游戏目录`。

### Task 2: 修复构建、测试与游戏工作区入口

**Files:**
- Modify: `games/breakfast-stall/package.json`
- Modify: `games/breakfast-stall/tools/build-wechatgame.cjs`
- Create: `games/breakfast-stall/tools/test-rules.cjs`
- Create: `games/breakfast-stall/tools/typecheck.cjs`
- Modify: `package.json`

**Interfaces:**
- Produces: 游戏内 `npm run test`、`npm run typecheck`、`npm run build:wechatgame`；根 `npm run test`、`npm run typecheck`、`npm run build:breakfast`、`npm run dev:cocos:breakfast`。
- `build:wechatgame` 保留原 Creator 退出码 36 → 0 和早餐启动页校验。

- [ ] **Step 1: 先让布局测试覆盖仓库根定位与公共脚本**

增加断言：构建器不再含 `../.tooling` 的旧相对发现路径，游戏包名改为 `breakfast-stall`，根 `dev:cocos:breakfast` 指向新工程。先确认失败。

- [ ] **Step 2: 修复 Creator 路径与游戏脚本**

从脚本位置向上查找含 `.tooling` 的仓库根，不依赖调用命令时的 `process.cwd()`，仍优先 `COCOS_CREATOR_BIN`。新增仅负责编译纯规则模块并调用 `node --test tests/*.test.cjs` 的脚本，以及只传入游戏 `assets` 和生成 `temp/declarations/cc.d.ts` 的类型检查脚本。`test-rules.cjs` 在独立临时目录输出测试 JS，不把编译产物写入源码；`typecheck.cjs` 沿用现有 ES2015/装饰器/`skipLibCheck` 参数，不递归检查扩展。脚本不硬编码机器绝对路径。

- [ ] **Step 3: 在新工程运行静态验证**

先由新路径打开 Creator 并生成声明，再运行 `npm --prefix games/breakfast-stall run test`、`npm --prefix games/breakfast-stall run typecheck` 和 `npm --prefix games/breakfast-stall run build:wechatgame`。预期 35 项测试通过、类型退出 0、构建退出 0。

- [ ] **Step 4: 提交工作区脚本**

提交 `build: 为多游戏工程增加统一测试与构建入口`。

### Task 3: 引入 npm workspaces 并适配共享工具解析

**Files:**
- Modify: `package.json`
- Create: `package-lock.json`
- Modify: `.tooling/bin/mini-ai-mcp`
- Modify: `.tooling/package.json`
- Modify: `games/breakfast-stall/extensions/cocos-creator-mcp/package-lock.json`（仅用该扩展自身 npm 对齐根版本，保留依赖和独立 lockfile）

**Interfaces:**
- Workspaces: `games/*`、`.tooling`。
- MCP 模块通过 Node `require.resolve()` 从根依赖解析；凭证和 Node fallback 路径不变。
- 根依赖 `typescript` 仅用于开发；不升级共享 MCP 包或游戏运行时。

- [ ] **Step 1: 增加依赖提升的失败测试**

布局测试要求根 workspaces 包含 `.tooling`，启动器不再引用 `.tooling/node_modules/$module`，而是可定位到根安装后的模块。

- [ ] **Step 2: 配置 npm workspaces 并生成根锁文件**

根声明私有包、`games/*`、`.tooling`、`engines.node: ">=24 <25"`，根脚本委托游戏命令；共享 TypeScript 声明为根开发依赖。运行 `npm install`，不把扩展 `node_modules` 纳入 workspace。

- [ ] **Step 3: 修改 MCP 解析并实测**

用小型 Node 启动器按模块 specifier `require.resolve()`，再由 shell 启动该路径。保留 `mini-ai-mcp minigame|cloudbase|wechatide` 公共接口和 Token 读取规则。对三个服务发送换行 JSON `initialize` 和 `tools/list`；微信还需只读 `project_list`，CloudBase 只读 `auth(status)`。

- [ ] **Step 4: 验证根命令与工具版本**

运行 `npm ls --depth=0`、`npm test`、`npm run typecheck`，检查 `node_modules/.bin/tsc --version` 为 5.9.3。提交 `build: 使用 npm workspaces 统一共享开发工具`。

### Task 4: 清理入口并更新活动文档与 Agent 指南

**Files:**
- Delete: `project.config.json`
- Create: `README.md`
- Modify: `AGENTS.md`
- Modify: `环境使用说明.md`
- Modify: `微信小程序与2D-3D小游戏AI开发资源手册.md`
- Modify: `docs/开发排障与测试手册.md`
- Create: `docs/monorepo-migration.md`
- Modify: `docs/superpowers/verification/2026-11-20-breakfast-stall-sample.md`
- Modify: `docs/monorepo-execution.md`

**Interfaces:**
- 游戏 ID → 工程：`breakfast-stall` → `games/breakfast-stall/`。
- 微信验收：`games/breakfast-stall/build/wechatgame-breakfast-release/`。
- 历史设计记录不改写当时路径；活动文档只使用新路径和根命令。

- [ ] **Step 1: 用布局测试锁定根入口和新文档命令**

断言根 `project.config.json` 不存在，README 含 `games/breakfast-stall/`，AGENTS 与排障手册不再指导使用 `cocos-game/` 或 `.tooling/node_modules/.bin/tsc`。

- [ ] **Step 2: 删除无效根微信配置并更新活动文档**

根配置无 `game.js/game.json`，其 AppID 不迁移、不复用。README 记录多游戏边界、常用命令、共享工具恢复、AppID 与构建产物一一映射。历史文档只添加迁移说明，不伪造历史验证路径。

- [ ] **Step 3: 全量搜索活动配置和文档**

检查旧构建路径、根微信入口、固定 `.tooling/node_modules` 引用、敏感文件和意外生成物；核对 `.mcp` 启动器仍指向仓库根 `.tooling`。提交 `docs: 更新多游戏仓库开发入口与验收路径`。

### Task 5: 重导 Creator、构建微信包并验证真实交互

**Files:**
- Modify: `docs/superpowers/verification/2026-11-23-minigame-monorepo.md`（创建记录）
- Local only: `.tooling/local/monorepo-migration/`（忽略）

**Interfaces:**
- Creator: `games/breakfast-stall/`，`main` 场景。
- 微信：`games/breakfast-stall/build/wechatgame-breakfast-release/`。

- [ ] **Step 1: 关闭旧 Creator 并打开新工程**

结束打开旧 `cocos-game` 的 Creator 窗口，不终止其他无关进程。通过根 `dev:cocos:breakfast` 启动新工程，等待资源导入。读取 `cocos://project/info`；路径不是新工程时停止，不改场景。

- [ ] **Step 2: 检查场景、资源与全部静态验证**

读取 `main` 场景和 `Breakfast Game` 组件；核对启动页五文件、场景脚本 UUID 和纹理引用。执行根 `npm test`、`npm run typecheck`、`npm run build:breakfast`，预期 35/35、类型 0、构建 0。

- [ ] **Step 3: 只从新发布目录打开微信模拟器**

通过 `wechatide -c DeepSeekHarness open_project_window --project <新发布目录> --window-mode fullMode`，按需 `simulator_refresh`。截图确认《早点凑一单》首关/当前存档画面，日志无业务错误。

- [ ] **Step 4: 验证帮助与真实取餐撤回**

点击问号打开帮助，点米糕入碟，点茶叶蛋完成试玩并关闭；打开和关闭设置。正式关若停在第 12 关，先选 A、取油条、撤回，验证状态和画面恢复；不追求通关，不清存档。若触控仍无响应，保存驱动日志、截图与 `wx.getSystemInfoSync()` 结果，如实记录阻塞，不改玩法代码。

- [ ] **Step 5: 记录验收并清理旧目录**

记录本轮测试、构建、MCP、微信截图与未覆盖真机。确认新工程可用后，先关闭旧窗口，再仅删除旧 `cocos-game/` 中忽略的 `build/library/profiles/temp` 和空目录；删除前 `realpath` 必须精确等于旧路径，不能碰 `.tooling/local/`。

- [ ] **Step 6: 最终 diff 审查并提交**

检查 `git diff --check`、版本库文件、工作树与提交。提交 `test: 验证多游戏仓库迁移后的微信运行`。本轮不做真机或发布结论。

## 执行方式

建议当前会话顺序执行，因为 Creator/微信窗口与目录迁移强耦合，不能安全并行移动或构建同一工程。每个任务先验证再提交；若子任务选择执行，每个子任务完成后仍由主代理亲自检查 diff 和实际结果。
