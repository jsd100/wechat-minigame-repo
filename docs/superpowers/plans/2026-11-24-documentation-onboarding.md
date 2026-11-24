# 文档职责统一与从零运行实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 收敛日常文档职责，提供 macOS 与 Windows 可照做的 GUI 从零运行教程，并保留进阶工具与历史资料。

**Architecture:** README 链接单一从零教程；早餐保留游戏专属说明，排障与 AI 配置各归其位。两份迁移文档移入 `docs/archive/`，`docs/superpowers/` 和扩展资料保持原处。教程以 GUI 为主，Node/npm 与命令行构建仅作可选验证。

**Tech Stack:** Markdown、Node 24 `node:test`、Cocos Creator 3.8.8 LTS、微信开发者工具、macOS 与 Windows 10/11。

**Spec:** `docs/superpowers/specs/2026-11-24-documentation-onboarding-design.md`

**执行方式：** 用户已批准设计与在当前 `main` 原地执行，使用当前会话 `executing-plans` 顺序实现，不另建实现 worktree。

## Global Constraints

- 只改文档与文档验证，不改游戏源码、资源、构建配置、启动脚本、AppID 或工具职责。
- GUI 是首次运行主路径；Node、MCP、Skills、Token、自动化测试和命令行启动/构建是进阶可选项。
- macOS 与常规 Windows 10/11 分开写，不增加 WSL 分支。
- `docs/superpowers/` 不移动、不改写历史正文，仅修复归档移动直接造成的两个相对链接；Cocos 扩展自带文档不动；AI 资源手册保留。
- 不删除仍有用途的资料；只归档两份迁移说明并修复移动造成的相对链接。
- Windows 没有本机实测时不得宣称通过；macOS 以本轮真实构建与交互为证据。
- 不上传、提审、发布、写 CloudBase、清存档或改真实账号配置。

## Review Focus

- 没有 Node 的新机器走 GUI：Creator 能构建，微信能导入实际产物；任务 2 按教程逐步核对，扩展依赖只在 MCP 可选章节出现。
- 没有 Creator 本机 profile 的首次导入：按仓库事实核对 GUI 的平台、输出名和 `build` 目录，不要求重建命令行 JSON；任务 2、4 验证产物。
- Windows 读者：不能套用 macOS `.app`、shell 路径或 `open` 命令；任务 2 文档审查，任务 4 独立审查。
- 只导入仓库根的新手：教程必须明确 Creator 源码目录与微信产物目录不同；任务 2 链接/内容检查，任务 4 微信实测。
- 归档与历史引用：移动后相对链接仍有效，`docs/superpowers/` 不移动、不改写；任务 1、3、4 检查。

---

### Task 1: 建立文档导航检查并归档迁移资料

**Files:**
- Create: `tools/check-documentation.cjs`
- Create: `docs/archive/README.md`
- Rename: `docs/monorepo-execution.md` → `docs/archive/monorepo-execution.md`
- Rename: `docs/monorepo-migration.md` → `docs/archive/monorepo-migration.md`
- Modify: `AGENTS.md`
- Modify: `docs/repository-layout.md`
- Link-only: `docs/superpowers/verification/2026-11-20-breakfast-stall-sample.md`
- Link-only: `docs/superpowers/specs/2026-11-23-minigame-monorepo-design.md`

**Interfaces:**
- `node tools/check-documentation.cjs` 检查现行 Markdown 相对链接、教程入口和已归档文件位置，返回非零表示导航断裂。
- `docs/archive/README.md` 是历史入口；`docs/superpowers/` 保持原目录与既有任务约定。

- [x] **Step 1: 写失败的文档导航检查**

用 Node 内置模块实现检查器：扫描日常文档的本地 Markdown 链接，跳过 `docs/superpowers/` 与扩展上游文档；检查 `docs/getting-started.md` 存在、两份迁移文件只在 `docs/archive/`，并禁止日常文档链接旧 `docs/monorepo-{execution,migration}.md` 路径。先运行，Expected: 因从零教程与归档入口不存在而失败。

- [x] **Step 2: 移动两份迁移资料并修正归档内部链接**

先读取文件再使用明确路径的 `git mv`。建立 `docs/archive/README.md` 解释归档边界。保留历史事实，仅调整迁移说明与执行台账中的导航和归档相对链接；`docs/superpowers/` 原位置与历史正文保留，仅将上述两个受移动影响的链接指向 `docs/archive/`。

- [x] **Step 3: 更新 Agent 与目录契约，验证链接**

在 AGENTS 中将入门教程、AI 环境、历史归档分别导航；在目录契约中写明日常文档、`docs/archive/` 与 `docs/superpowers/` 的职责。暂不创建教程，Expected: 检查器仍只因教程缺失而失败，不再报归档旧路径或移动后的相对链接错误。

- [x] **Step 4: 提交归档与检查器**

Run: `node tools/check-documentation.cjs` 并记录预期教程缺失；`git diff --check`。提交：`docs: 归档迁移资料并建立文档导航检查`。

### Task 2: 编写双平台 GUI 从零运行教程

**Files:**
- Create: `docs/getting-started.md`
- Modify: `README.md`
- Modify: `games/breakfast-stall/README.md`
- Modify: `docs/repository-layout.md`

**Interfaces:**
- 教程固定源码目录 `games/breakfast-stall/`、产物目录 `games/breakfast-stall/build/wechatgame-breakfast-release/`、输出名 `wechatgame-breakfast-release`。
- README 只提供入口与公共命令摘要，详细安装步骤只存于从零教程。

- [x] **Step 1: 核对官方安装来源与 GUI 构建事实**

核对 Cocos Creator 3.8.8 LTS 官方下载、微信开发者工具下载和 Creator「项目 → 构建发布」。列出平台、现有 AppID、竖屏、输出名与 `build` 目录。GUI 配置不依赖本机忽略的旧 `profiles/`，不要求手动重建 `build.wechatgame.*.json`。

- [x] **Step 2: 编写安装、克隆、构建、运行和成功标准**

macOS 与 Windows 分节：官方安装包、HTTPS 克隆、Creator 导入源码目录、等待导入、GUI 构建、微信选择小游戏并导入产物、帮助流程实测。微信账号需有该小游戏 AppID 的开发权限。写明普通 GUI 不需要 Node/MCP；新克隆缺少 MCP `dist/` 时，在扩展管理器禁用该可选扩展或忽略其加载错误，同时确认早餐启动页扩展启用。MCP 扩展使用前需 Node 安装并构建依赖。首轮只要求本地模拟器运行，不包含真机或发布。

- [x] **Step 3: 添加可选验证与进阶路径**

Node 24 安装后运行 `npm ci`、`npm test`、`npm run check`；类型检查需 Creator 已导入生成声明。CLI 仅作进阶：macOS 默认 `.tooling/apps/CocosCreator.app`，其他位置/Windows 用 `COCOS_CREATOR_BIN` 指定实际可执行文件。说明 Windows 尚未本机实测。

- [x] **Step 4: 收敛 README 与早餐说明，运行文档检查**

README 链接教程、早餐说明、AI 环境、排障和历史入口；早餐 README 只保留游戏专属配置、测试、脚本与验收。Run: `node tools/check-documentation.cjs`，Expected: 所有现行文档和归档链接通过。提交：`docs: 增加双平台从零运行教程`。

### Task 3: 收窄进阶环境、排障与资源手册职责

**Files:**
- Modify: `环境使用说明.md`
- Modify: `docs/开发排障与测试手册.md`
- Modify: `微信小程序与2D-3D小游戏AI开发资源手册.md`
- Modify: `AGENTS.md`
- Modify: `docs/repository-layout.md`

**Interfaces:**
- 通用安装只链接 `docs/getting-started.md`；AI 配置只留在 `环境使用说明.md`。
- 排障手册继续承载真实案例、MCP 与自动化，不复制入门教程。

- [x] **Step 1: 收窄 AI 环境说明**

保留客户端模板、Skills/MCP、Cocos 扩展依赖构建、Token 与本机恢复，删除与通用安装/原生项目教程重复的内容，开头标明“可选，不是首次运行前置”。链接早餐扩展 README 与从零教程。

- [x] **Step 2: 收窄排障与资源手册**

排障保留真实案例、截图/日志采集与分层验证；安装和 GUI 构建链接从零教程。资源手册保留泛生态内容，将本项目入口改为从零教程，修正不存在的旧锚点。

- [x] **Step 3: 核对文档维护规则与全部链接**

更新 AGENTS 与目录契约的维护边界，检查现行文档不再有互相矛盾的 Node/MCP 前置或微信导入路径。Run: `node tools/check-documentation.cjs && npm test && npm run check`，Expected: 文档检查、35 个规则测试、公共与早餐检查全部通过。提交：`docs: 统一入门、进阶与历史资料职责`。

### Task 4: 真实验收、独立审查与收尾

**Files:**
- Create: `docs/superpowers/verification/2026-11-24-documentation-onboarding.md`
- Local only: `.tooling/local/checks/`（忽略）

**Interfaces:**
- macOS 证据必须来自本轮 Creator/微信运行；Windows 明确未实测。
- 最终验收不包含上传、提审、发布或真机结论。

- [ ] **Step 1: 核对 Creator 工程与 macOS GUI 构建结果**

创建不含 `node_modules/`、MCP `dist/`、旧 `profiles/` 和旧构建产物的干净副本，在 Creator 中导入该副本；读取 `cocos://project/info` 确认干净工程及 `main` 场景。通过 `builder_manage` 打开构建面板，核对 GUI 的平台、输出名和 `build` 目录，再实际构建发布包。未配置 MCP 时按教程禁用/忽略该可选扩展，确认早餐启动页启用。记录 GUI 路径与命令行构建的区别，不修改受控游戏配置。

- [ ] **Step 2: 从新产物目录复验微信帮助流程**

使用 `wechatide-skill` 先检查状态，再只打开实际发布目录。按教程点问号、米糕、茶叶蛋，验证暂存、A 单打包和自动补入 B 单，保存本轮截图和错误过滤日志；不清存档、不改设置。

- [ ] **Step 3: 完整测试与独立审查**

Run: `node tools/check-documentation.cjs && npm test && npm run typecheck && npm run check`。请独立审阅者只读检查完整 diff，重点为新手可达性、双平台措辞、归档链接和范围；Critical/Important 按证据修复，Minor 记录延期，不重复无限审查。

- [ ] **Step 4: 记录真实范围并提交**

写明 macOS 干净副本实际构建/交互、Windows 未实测、文档检查和测试数量、延期项。检查 `git diff --check`、版本库文件与工作树，提交：`docs: 验证从零运行教程与文档职责`。
