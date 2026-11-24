# Monorepo 工具职责与可复现性改进实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 分离公共工具与游戏工具职责，让纯规则测试脱离 Creator 缓存，并让命令、文档和验收可按各自边界独立复现。

**Architecture:** 保留 npm workspaces 与游戏工程边界。根只负责公共目录/依赖检查和跨工作区编排；早餐负责自己的资源、身份、Creator 和玩法验收。版本化脚本取代本机一次性驱动，但不引入公共玩法框架或第二个实际游戏。

**Tech Stack:** Node 24、npm workspaces、TypeScript 5.9.3、Cocos Creator 3.8.8、Node `node:test`、微信开发者工具与 MCP。

**Spec:** `docs/superpowers/specs/2026-11-24-monorepo-tooling-boundaries-design.md`

**执行方式：** 用户已明确同意按本轮建议继续，使用当前会话 `executing-plans` 顺序实现，不另建迁移 worktree。

## Global Constraints

- 纯规则测试无需 Creator；完整 Cocos 类型检查显式依赖 Creator 导入。
- 不引入 Nx、Turborepo、pnpm、公共玩法框架或新的空 `packages/`。
- 继续使用 npm workspaces 和 npm 默认物理提升，不强制嵌套依赖。
- 不改变玩法、素材、场景、AppID、存档键、Creator UUID、构建输出名或启动页文案。
- 使用当前 `main` 工作区顺序实现；不并行启动 Creator、微信构建或修改同一文件。
- 不上传、提审、发布、写 CloudBase、清存档或改真实账号配置。
- 版本化稳定脚本可以成为 npm 入口；`.tooling/local/`、随机 `/tmp` 快照及旧迁移驱动不得成为日常运行依赖。

## Review Focus

- 没有 `temp/declarations/cc.d.ts` 的干净源码树：纯规则测试必须通过，不复制声明。任务 2 用隔离源码副本验证。
- 加入第二个具有 `test`/`typecheck` 的工作区：根命令必须实际执行它，而不是静默只跑早餐。任务 1 在测试临时目录创建一次性 fixture 验证。
- 错误场景组件引用、缺失早餐资源或缺失 Creator 声明：对应检查必须给出有用失败，而不是文字巧合或 TS 裸报。任务 1、2 覆盖。
- 从 `/` 调用 Creator 启动器、缺 Token/Node、子进程启动失败或信号终止：必须有明确诊断。任务 3 用无害替身验证，不启动第二个 Creator。
- 新贡献者阅读文档：公共文档不得把早餐身份当公共约束，也不得把本机随机目录当恢复前提。任务 4 由文档所有权核对和最终独立审查覆盖。

---

### Task 1: 分离公共目录契约、工作区编排与早餐检查

**Files:**
- Modify: `tools/check-monorepo-layout.cjs`
- Create: `tools/check-mcp.cjs`
- Create: `games/breakfast-stall/tools/check-project.cjs`
- Modify: `games/breakfast-stall/package.json`
- Modify: `package.json`
- Modify: `package-lock.json`（仅由 npm 同步）

**Interfaces:**
- 根 `check:layout` 只检查公共工作区与公共文件；不读取 `games/*/assets/`、AppID 或 Creator UUID。
- 根 `test`、`typecheck` 使用 `npm run <name> --workspaces --if-present`。
- 早餐 `check` → `node tools/check-project.cjs`，检查其项目身份与组件引用。
- 根 `check` → `npm run check:layout && npm run check --workspaces --if-present`。
- 根 `check:mcp` → `node tools/check-mcp.cjs minigame cloudbase wechatide`。

- [x] **Step 1: 写公共布局与早餐身份的失败检查**

在隔离临时目录创建公共布局 fixture，不包含早餐资源；断言公共检查只验证 workspace、独立输出名、忽略规则、游戏 `check` 脚本和根锁完整性。先确认旧脚本因固定早餐路径/AppID 而不符合边界。

在早餐检查中解析 `package.json`、构建配置、`assets/main.scene` 和 `BreakfastGame.ts.meta`，要求 `Breakfast Game` 节点组件的压缩 UUID 来自该元数据；检查五个启动页文件。先确认旧公共脚本混淆职责，且单纯文本匹配无法验证组件归属。

- [x] **Step 2: 实现职责分离并验证第二工作区**

收窄公共布局脚本；新增早餐 `tools/check-project.cjs` 与游戏 `check`。根测试/类型改为遍历 workspaces，新增上述稳定检查入口。用只读复制的方式运行真实根检查及早餐检查。

在测试临时目录新增最小 `games/other/package.json`（`test`、`typecheck` 和 `check` 均写入记录文件），运行根命令；断言第二工作区确实执行。临时 fixture 不提交、不成为产品依赖。

- [x] **Step 3: 移入共享 MCP 检查并验证**

把已经验证过的 stdio 握手驱动整理为根 `tools/check-mcp.cjs`，根目录由 `__dirname` 定位，输出报告到 `.tooling/local/checks/`。运行 `npm run check:mcp`；Expected: 三个 initialize/tools 成功，微信 `project_list`、CloudBase `auth(status)` 只读调用成功。

- [x] **Step 4: 运行检查并提交**

Run: `npm run check:layout && npm run check --workspace=breakfast-stall && npm run check:mcp && npm test && npm run typecheck`.
Expected: 全部退出 0，早餐 35/35；文档导航尚未在本任务更新，不据此宣称完整验收。
提交：`refactor: 分离公共目录检查与早餐工程契约`。

### Task 2: 让纯规则测试脱离 Creator 缓存

**Files:**
- Create: `games/breakfast-stall/tests/types/cc.d.ts`
- Modify: `games/breakfast-stall/tools/test-rules.cjs`
- Modify: `games/breakfast-stall/tools/typecheck.cjs`
- Modify: `games/breakfast-stall/tools/build-wechatgame.cjs`

**Interfaces:**
- 测试声明只提供 `primitives.IGeometry` 的 `positions`、`normals`、`colors`、`indices` 数字数组字段；不提供 Cocos 运行时。
- 纯测试编译输入不包含 `temp/declarations/cc.d.ts`。
- 完整类型检查在缺少 Creator 声明时给出明确前置条件。
- 所有包装器分别处理 `error`、`signal` 和退出码。

- [ ] **Step 1: 创建无声明的失败测试与异常路径测试**

在隔离副本复制受控源码/清单/脚本，不复制 `temp/`、`node_modules/` 或 `.tooling/local/`，按根清单安装 npm 依赖。先运行当前纯测试，Expected: 因 `cc.d.ts` 不存在而失败。

以不存在的 TypeScript 可执行文件和受控信号替身调用包装器，先确认当前代码丢失启动错误/信号诊断；测试临时目录清理用可控异常触发。

- [ ] **Step 2: 添加最小测试声明并修正包装器**

在早餐 `tests/types/cc.d.ts` 定义实际测试所需的几何类型，替换测试编译输入中的完整 Creator 声明。测试发现、编译和运行放入 `try/finally`，统一报告子进程错误和信号；完整类型检查先验证声明存在。

- [ ] **Step 3: 验证纯测试自举与真实类型检查**

Run: 在隔离副本从根目录执行 `npm ci --ignore-scripts --no-audit --no-fund`，随后 `npm test`。
Expected: 没有 Creator 或 `temp/declarations/cc.d.ts`，35/35 通过，临时编译目录清理。
Run: 当前仓库 `npm run typecheck`。
Expected: 真实 Cocos 类型检查退出 0；删除隔离副本中的声明后类型检查给出“先打开 Creator 完成导入”而不是 TS6053。

- [ ] **Step 4: 提交**

提交：`test: 让早餐规则测试脱离 Creator 缓存`。

### Task 3: 修正 Creator 与微信 CLI 的可移植入口

**Files:**
- Create: `games/breakfast-stall/tools/open-creator.cjs`
- Modify: `.tooling/bin/mini-ai-mcp`
- Modify: `package.json`
- Modify: `games/breakfast-stall/tools/bake-food-contours.py`
- Modify: `games/breakfast-stall/assets/breakfast/runtime/food-contours.ts`

**Interfaces:**
- 早餐 `dev:cocos` → `node tools/open-creator.cjs`，根 `dev:cocos:breakfast` 只转发。
- Creator 查找沿用仓库 `.tooling/apps` 和 `COCOS_CREATOR_BIN`，按脚本位置定位，不使用调用者 `$PWD`。
- 微信 CLI 默认 `/usr/local/bin/wechatide`，可用 `WECHAT_IDE_BIN` 覆盖；Token 读取规则不变。
- 素材生成注释改为 `games/breakfast-stall/tools/bake-food-contours.py`，只改注释，不重算素材。

- [ ] **Step 1: 用无害替身写可移植性失败测试**

从 `/` 调用启动器，使用临时目录中的假 Creator/微信 CLI 记录 argv，断言工程路径来自脚本位置、微信 override 生效。先确认根 `$PWD` 和固定微信路径的缺陷；不启动真实 Creator 或第二个受控实例。

- [ ] **Step 2: 实现启动器与环境覆盖**

根别名转发游戏内 Creator 启动器；微信 CLI 使用 `WECHAT_IDE_BIN`。保持 Token、Node fallback 和模块解析不变。更新素材来源注释。

- [ ] **Step 3: 验证并提交**

Run: 替身 argv 检查、根 `npm test`、`npm run typecheck`、`.tooling/bin/mini-ai-mcp` 无参数用法检查。
Expected: 路径正确、原公共接口保留，35/35 与真实类型检查通过。
提交：`fix: 修正开发工具的可移植启动路径`。

### Task 4: 写清公共契约、游戏说明和历史边界

**Files:**
- Create: `docs/repository-layout.md`
- Create: `games/breakfast-stall/README.md`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `环境使用说明.md`
- Modify: `docs/开发排障与测试手册.md`
- Modify: `docs/monorepo-execution.md`
- Modify: `docs/monorepo-migration.md`

**Interfaces:**
- 长期目录契约与新增游戏步骤由 `docs/repository-layout.md` 承接。
- 早餐完整前置条件、扩展与构建/测试/验收由早餐 README 承接。
- 迁移台账和历史记录不再作为日常必读。

- [ ] **Step 1: 按所有权编写文档**

写清公共/游戏/本机/历史四层职责、脚本归属、测试与 Creator 前置条件、依赖方向及新增游戏步骤。README 保留游戏注册表，链接游戏 README，不复制其完整教程。

- [ ] **Step 2: 修正恢复与归档导航**

恢复顺序为根依赖 → 扩展依赖及构建 → Creator 导入 → 完整类型检查与构建；纯规则测试无需 Creator。执行台账补充完成事实并归档；历史记录不改写当时路径。

- [ ] **Step 3: 全量核对文档和运行入口**

搜索公共文档中的早餐私有约束、旧路径命令、随机本机目录和“临时脚本才能运行”的指示；核对 README 的每个命令均来自真实 npm scripts。布局测试不再用文档关键词充当运行证明。
提交：`docs: 明确公共工具与游戏工程职责边界`。

### Task 5: 干净恢复、真实验收与独立审查

**Files:**
- Create: `docs/superpowers/verification/2026-11-24-monorepo-tooling-boundaries.md`
- Local only: `.tooling/local/checks/`（忽略）

**Interfaces:**
- 纯测试恢复与 Creator 前置条件分别验证，不复制声明来冒充完整自举。
- Creator 与微信只使用 `games/breakfast-stall/` 及其发布产物。

- [ ] **Step 1: 干净源码副本验证**

从最终提交的 Git 快照创建独立 checkout，恢复 npm 依赖；不复制 `node_modules/`、`.tooling/local/` 或 `temp/declarations/cc.d.ts`。先执行纯规则测试，证明无 Creator 缓存依赖；再按文档补充 Creator 声明，运行完整类型检查、公共与早餐检查。

- [ ] **Step 2: 真实 Creator 与微信构建验收**

读取 `cocos://project/info` 确认新工程及 `main` 场景；运行全部根检查、完整类型检查、三条 MCP 握手与 `npm run build:breakfast`。从新发布目录打开微信，复验帮助或设置一次核心交互，保存本轮截图和错误日志。

- [ ] **Step 3: 独立整体审查与修复**

请独立审查者只读检查完整 diff，重点为公共/游戏边界、可复现性、锁文件和文档真值。Critical/Important 按测试先红后绿修复，Minor 记录延期，不重复无限审查。

- [ ] **Step 4: 记录并提交**

将真实命令、测试数量、构建、交互证据、未覆盖真机与延期项写入验收记录。检查 `git diff --check`、版本库文件与工作树，提交：`test: 验证松耦合工具链与可复现验收`。
