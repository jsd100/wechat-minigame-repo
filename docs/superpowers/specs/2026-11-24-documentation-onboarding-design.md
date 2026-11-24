# 文档职责统一与从零运行教程设计

## 背景与目标

现有文档并非完全缺少安装说明，而是把项目入口、环境恢复、Cocos 构建、微信运行、AI/MCP 配置和历史迁移资料分散在不同文件里。新开发者无法从 README 找到一条无需猜测的完整路径，Windows 也缺少对应安装步骤。

目标读者是从未接触本仓库、电脑上未安装开发工具的开发者。以 macOS 为主，同时覆盖常规 Windows 10/11（不包含 WSL 分支）。读者应能从零完成工具安装、获取项目、Cocos Creator 导入与构建、微信开发者工具导入与模拟器运行。

本次只整理文档与验证文档，不改游戏源码、资源、构建配置、启动脚本、AppID 或工具职责。

## 已确认的决策

- 首次运行以 **Cocos Creator 和微信开发者工具 GUI 为主路径**；npm 命令是可选验证或进阶开发入口，不要求新手先配置命令行构建。
- macOS 与 Windows 分开写下载、安装和界面操作，避免把 macOS `.app` 路径套用到 Windows。
- AI、MCP、Skills、Token、自动化测试和命令行启动/构建是进阶可选项，不能成为首次 GUI 运行的前置条件。
- 保留《微信小程序与2D-3D小游戏AI开发资源手册》，定位为泛微信生态进阶资料，不承担本项目运行教程。
- `docs/superpowers/` 整目录不移动、不整理、不改写历史正文，继续作为既有任务资料区，不作为日常文档入口；仅允许修复归档移动直接造成的相对链接。
- 历史迁移资料不删除，移入 `docs/archive/` 并修正移动造成的相对链接；保留当时事实，不批量改写历史路径。
- Cocos 扩展自带的 README、迁移与设计文档属于扩展资料，不纳入本次清理。

## 日常文档地图

| 文档 | 唯一职责 | 内容边界 |
| --- | --- | --- |
| `README.md` | 项目入口 | 简介、当前游戏、从零教程链接、文档导航、公共命令摘要；链接 AI 与历史资料的职责，不复制教程。 |
| `docs/getting-started.md` | 从零安装与运行 | macOS/Windows 安装、克隆、Creator 导入/构建、微信导入/运行、首轮成功标准与常见阻塞。 |
| `games/breakfast-stall/README.md` | 早餐专属开发说明 | 工程与扩展所有权、构建配置、产物、测试、启动脚本和验收；链接从零教程，不重复通用安装步骤。 |
| `docs/repository-layout.md` | 长期目录与职责契约 | 公共工具、游戏、本机、历史的依赖方向与新增游戏步骤，包括 `docs/superpowers/` 与 `docs/archive/` 的定位。 |
| `docs/开发排障与测试手册.md` | 进阶排障与测试 | 保留真实案例、截图/日志采集、MCP/自动化和分层验证；移除重复安装教程，链接从零教程。 |
| `环境使用说明.md` | 可选 AI 与本机开发环境 | MCP、Skills、客户端模板、Token、扩展构建与恢复；不再承担通用项目安装教程。 |
| `微信小程序与2D-3D小游戏AI开发资源手册.md` | 泛生态进阶参考 | 保留现有资源；本项目安装/运行只链接从零教程，不复制另一条路径。 |
| `AGENTS.md` | Agent 操作约束 | 更新导航与维护规则，使普通任务不再依赖历史迁移资料。 |
| `docs/archive/README.md` | 历史导航 | 解释迁移说明、执行台账与 `docs/superpowers/` 的归档关系，不把它们当现行教程。 |

`docs/monorepo-execution.md` 与 `docs/monorepo-migration.md` 移到 `docs/archive/` 同名文件。文件内容以历史事实为主，只调整归档导航与有效链接。

## 从零 GUI 教程

### 1. 准备账号与工具

说明 Git、Cocos Creator 3.8.8 LTS、微信开发者工具的官方来源与安装步骤。macOS 区分 Apple Silicon 与 Intel，Windows 使用常规 x64 安装；Cocos Dashboard 与直接安装方式二选一，不引入额外包管理器作为必要条件。

说明微信登录账号需具备项目现有小游戏 AppID 的开发权限。不能把“下载 ZIP 可直接打开”误写成仍需 Git。GitHub 获取项目优先给出 HTTPS 克隆，SSH 作为可选；SSH 22 被代理中断时链接 GitHub 官方 443 方案，不改写 DNS 或关闭主机校验。

Node 24 与 npm 只列为可选验证和进阶开发依赖，安装放在 GUI 主路径之后，不阻塞首次运行。

### 2. 用 Cocos Creator 打开项目

从 Dashboard 或编辑器打开 `games/breakfast-stall/`，不是仓库根目录。等待首次资源导入完成，再打开 `assets/main.scene`。

说明工程已带 `breakfast-startup` 启动页扩展和 `cocos-creator-mcp` 扩展。普通构建不要求安装 MCP 客户端或配置 Token。新克隆未包含被忽略的 MCP `dist/` 与 `node_modules/`，而 MCP 配置为自动启动；若 Creator 报该可选扩展无法加载，教程需指导读者在扩展管理器中禁用 `cocos-creator-mcp` 或忽略此可选功能错误，并确认 `breakfast-startup` 启用，不能把它当作普通构建失败的修复。Cocos MCP 可选服务在启用前需要 Node/npm 安装并构建其扩展依赖；只有准备使用 MCP/AI 调试时才执行这一步及客户端设置。

### 3. 在 Creator 中构建微信小游戏

使用 Creator 的「项目 → 构建发布」，发布平台选择「微信小游戏」。核对已有 AppID、竖屏、输出名 `wechatgame-breakfast-release` 和输出目录 `build`，不改游戏身份。`build.wechatgame.*.json` 主要供命令行构建；GUI 构建任务保存在本机忽略的 Creator 配置中，不要求新手手工重建 JSON。首次在 GUI 按上述仓库事实核对或填写一次即可，不引导用户另造 AppID 或输出名。

构建成功必须产出 `games/breakfast-stall/build/wechatgame-breakfast-release/`，其中包含 `game.js`、`game.json`、`project.config.json`、`first-screen.js` 与早餐启动图。

### 4. 用微信开发者工具运行

安装并登录微信开发者工具，选择「小游戏」类型，导入上述**构建产物目录**，不能导入仓库根或 Creator 源码目录。核对项目自动读取的 AppID 与权限；编译并等待游戏画面出现。

首轮交互采用当前帮助流程：点问号、在开工单中依次操作米糕与茶叶蛋，确认暂存、A 单打包和自动补入 B 单。正式关卡不得被教程要求重开、清存档或改设置。

教程目标仅为本地模拟器成功运行，不包含真机、上传、提审、发布或 CloudBase 业务。

### 5. 可选验证与下一步

安装 Node 24 与 npm 后，在仓库根执行 `npm ci`、`npm test` 和 `npm run check`。纯规则测试不依赖 Creator；`npm run typecheck` 需在 Creator 完成导入生成声明后执行。

命令行 Creator 启动与构建另列为进阶。macOS 默认 `.tooling/apps/CocosCreator.app`；其他安装位置与 Windows 需设置 `COCOS_CREATOR_BIN` 为 Creator 可执行文件，不能套用 macOS 路径。GUI 主路径不依赖这些变量。

提供「找不到 Creator」「构建没有产物」「AppID 无权限」「误导入仓库根」「MCP 不可用」到排障手册或可选 AI 环境说明的短链接，不在教程里展开所有案例。

## 文档维护规则

- 公共安装/运行流程变化：更新 README 的导航、从零教程和 AGENTS；目录契约变化同时更新 `docs/repository-layout.md`。
- 单个游戏玩法、构建、资源或验收变化：更新该游戏 README 与游戏记录，不复制到所有公共文档。
- AI/MCP 或凭证变化：只更新 `环境使用说明.md` 及对应模板说明。
- 新出现的迁移、设计和过程验收不进入日常导航；`docs/superpowers/` 保持原约定，已完成的两份迁移文档只通过归档入口访问。
- 历史文档只修正迁移产生的链接与归档标识，不重写当时路径、命令、提交或验证结论。

## 验证与范围

- 在 macOS 按 GUI 主路径重新核对工程、场景、Creator 构建和微信模拟器帮助交互，保存本轮证据；使用不含 `node_modules/`、MCP `dist/`、`profiles/`、旧构建产物的独立干净源码副本验证首次导入，不能只沿用已配置工作区的成功结果。不重新安装或覆盖现有工具，不改主工作区。
- 运行 `npm test`、`npm run typecheck`、`npm run check`，验证整理没有影响现有工程。
- 用本地 Markdown 链接检查器验证现行文档及移动后的归档相对链接；现行文档不得指向已移动的旧位置。对 `docs/superpowers/` 中受移动直接影响的两个链接只改目标到 `docs/archive/`，不改其余历史正文。
- 搜索重复/旧路径/错误入口，确保“仓库根不是微信导入目录”“GUI 不需要 MCP/Node”“Windows 不使用 `.app` 默认路径”等关键前提一致。
- 由独立审阅者复核教程是否真正从零可达、文档职责是否清晰、是否误删历史或扩大实现范围。
- Windows 步骤依据官方资料与项目配置编写，当前没有 Windows 实机，明确标为 **未进行 Windows 本机实测**；macOS 有实际验证，不能把文档核对表述为 Windows 验收通过。

## 非目标

- 不改启动脚本或新增跨平台脚本，不引入安装器、容器、WSL、CI、自动部署或新的游戏。
- 不删除仍有用途的资料，不缩减 Cocos 扩展自身文档。
- 不要求 Windows/macOS 使用相同终端或相同路径。
- 不把上传、真机、CloudBase 或 AI 工具配置纳入首次运行成功标准。
