# Monorepo 工具职责与可复现性改进设计

## 背景与目标

现有目录迁移已完成，游戏源码、素材、AppID、存档键和 Creator UUID 保持独立。本次解决审查发现的工具链问题：公共布局检查混入早餐身份、根测试只覆盖一个工作区、纯规则测试依赖被忽略的 Creator 声明、文档恢复顺序和职责不清。

目标不是重新组织游戏代码，而是让公共开发工具、每个游戏的开发工具、可重复测试和本机历史证据各有清晰边界。

## 已确认的边界

- 纯规则测试无需 Creator；完整 Cocos 类型检查显式依赖 Creator 导入。
- 不引入 Nx、Turborepo、pnpm、公共玩法框架或新的空 `packages/`。
- 继续使用 npm workspaces 和 npm 默认物理提升，不强制嵌套依赖。
- 不改变玩法、素材、场景、AppID、存档键、Creator UUID、构建输出名或启动页文案。
- 继续使用当前 `main` 工作区顺序实现；不并行启动 Creator、微信构建或修改同一文件。
- 不上传、提审、发布、写 CloudBase、清存档或改真实账号配置。

## 公共与游戏职责

### 仓库根

- `package.json` / `package-lock.json`：workspaces、Node 版本、公共命令和统一依赖锁。
- `tools/check-monorepo-layout.cjs`：检查通用工作区结构、根不是微信游戏入口、每个游戏拥有独立构建配置和产物命名、公共生成目录忽略规则，以及每个游戏是否有自己的 `check` 脚本。不得读取游戏 AppID、玩法文件、素材或场景。
- `tools/check-mcp.cjs`：验证三个共享 stdio MCP 服务的 `initialize`、`tools/list` 和规定的只读调用。它是工具集成检查，不是目录布局检查。
- `.tooling/`：共享 MCP、Skills、微信类型和自动化依赖。`bin/` 内保留稳定启动器与模块解析器，游戏不能反向依赖其私有安装位置。
- `README.md`：仓库总入口、游戏注册表、公共命令、依赖方向与游戏说明导航。
- `AGENTS.md`：跨项目安全规则、项目发现方法、共享边界与通用验收原则。
- `环境使用说明.md`：共享工具链、MCP、Skills、凭证和本机恢复；早餐教程只保留导航。
- `docs/repository-layout.md`：稳定的目录契约、依赖方向、脚本归属、测试前置条件和新增游戏步骤。
- `docs/开发排障与测试手册.md`：可重复的排障方法；早餐案例明确归属早餐，不能成为第二游戏的强制教程。

### 每个游戏 `games/<game-id>/`

- `assets/`、`settings/`、`extensions/`：游戏 Creator 工程及其资源、扩展和 `.meta`。
- `tools/`：游戏自己的构建、类型检查、资源维护和身份/场景检查。
- `tests/`：游戏自己的纯逻辑测试及所需最小测试声明。
- `package.json`：Creator UUID、版本、游戏脚本及 `check` 契约。
- 微信构建 JSON、AppID、存档键和独立 `build/` 产物。
- `README.md`：游戏自己的运行前置条件、构建/测试入口、扩展所有权、发布产物及验收路径。

早餐项目保持 `extensions/breakfast-startup/` 和 `extensions/cocos-creator-mcp/` 在原工程内；本次不把它们全局化。

### 本机与历史资料

- `.tooling/local/`：本机凭证、缓存、日志和历史截图，不得成为运行依赖。
- `docs/superpowers/`：历史设计、计划和验收证据。
- `docs/monorepo-execution.md`：当次迁移台账，完成后归档，不再作为日常开发的恢复入口。
- 临时缓存清理、快照生成、当次哈希对照和触控驱动只保留历史记录，不产品化为长期依赖。

## 稳定命令与检查契约

根命令：

- `npm test` → `npm run test --workspaces --if-present`，自动运行所有实现 `test` 的工作区。
- `npm run typecheck` → `npm run typecheck --workspaces --if-present`，自动运行所有实现 `typecheck` 的工作区。
- `npm run check:layout` → 通用目录与公共契约检查。
- `npm run check` → 布局检查，加各工作区 `check`；`.tooling` 不实现游戏 `check`，共享 MCP 另有 `check:mcp`。
- `npm run check:mcp` → 三个共享 stdio MCP 握手及只读调用。
- `npm run build:breakfast`、`npm run dev:cocos:breakfast` → 明确的早餐便捷别名，不能自动遍历启动多个 Creator。

早餐命令：

- `npm run test --workspace=breakfast-stall`：只依赖提交源码、npm 依赖和早餐最小测试声明；不要求 Creator、`temp/` 或本机复制步骤。
- `npm run typecheck --workspace=breakfast-stall`：覆盖早餐全部真实 Cocos 源码，先检查 Creator 已生成 `temp/declarations/cc.d.ts`，缺失时输出明确前置条件。
- `npm run check --workspace=breakfast-stall`：检查早餐 UUID、Creator 版本、AppID、启动页五文件和 `Breakfast Game` 组件的真实场景/元数据关联；不依赖完整资源哈希常驻检查。
- `npm run build:wechatgame --workspace=breakfast-stall`：保留本地发布构建和早餐启动页校验。
- `npm run dev:cocos --workspace=breakfast-stall`：从脚本自身位置定位工程与 Creator，不依赖调用者 cwd；根别名只转发该入口。

## 纯规则测试与完整类型检查

`test-rules.cjs` 保留为早餐的稳定 npm 工具，负责将纯规则源码编译到独立临时目录，再运行 `tests/*.test.cjs`。编译输入不包含完整 `cc.d.ts`，也不要求 GUI 或 `.tooling/local/`。

早餐 `tests/types/cc.d.ts` 是受版本控制的最小测试声明，只声明当前被测纯逻辑模块使用的 `primitives.IGeometry` 形状。它必须与实际被测几何输出一致，不得伪造 Cocos 运行时。完整 `typecheck` 继续使用 Creator 生成的真实声明，验证该测试边界没有隐藏实际引擎类型错误。

`test-rules.cjs` 在 `mkdtempSync` 后以 `try/finally` 清理精确临时目录。三个 Node 包装器分别处理 `spawnSync().error`、`signal` 和退出码，避免把启动失败或信号终止写成普通测试失败。

## 文档与历史记录

新增长期 `docs/repository-layout.md` 和早餐 `README.md`，按上述职责写清所有权、依赖方向和运行前置条件。

README 只提供公共边界摘要、游戏注册表和公共命令。AGENTS 不再要求每次游戏改动同步全部公共文档；游戏文档由其所有者维护，公共契约改变才更新公共文档。

新机器恢复顺序统一为：恢复根依赖 → 恢复目标游戏的扩展依赖并构建扩展 → 打开目标 Creator 完成导入 → 完整类型检查与构建。纯规则测试可在此之前独立运行。

`monorepo-execution.md` 补充完成事实后归档。旧设计、计划和验收记录保持当时事实，只增加导航，不批量改写历史路径或伪造历史验证。

素材生成器的来源注释改为当前路径；仅同步注释，不重算素材轮廓或改变图片、模型。

## 验证与验收

每项实现先写可观察行为的失败测试，确认失败原因，再最小实现。

1. 在没有 `temp/declarations/cc.d.ts` 的隔离源码副本中，以根目录 `npm ci` 恢复后，纯规则测试无需 Creator 即通过；使用真实安装，不把当前根 `node_modules` 复制进副本。
2. 根测试/类型检查遍历所有实现对应脚本的工作区；公共检查不得依赖早餐业务常量。
3. 早餐检查验证真实组件 UUID 关联、AppID 和启动页文件；修改场景节点关联或早餐配置应使该游戏检查失败。
4. 公共目录检查在无早餐路径的临时布局中仍验证通用契约，不读取早餐 AppID 或素材。
5. 三个 MCP 握手和规定只读调用通过；微信 CLI 可用 `WECHAT_IDE_BIN` 覆盖，缺 Token/Node 时有明确错误。
6. 当前 `main` 的全部测试、完整类型检查、布局/工作区检查、早餐检查和发布构建通过。
7. 对新工程路径打开 Creator，核对 `cocos://project/info`；新发布目录实际打开微信，复验帮助或设置一次核心交互，保存本轮截图和错误日志。
8. 干净恢复与 Creator 前置条件分开记录，不把复制声明称为完整自举。历史随机目录不作为复现前提。

## 非目标

- 不实现第二游戏、空共享包或通用游戏运行时。
- 不把早餐检查脚本抽象成跨游戏规则引擎。
- 不承诺无 Creator 的完整类型检查或微信发布构建。
- 不重写历史文档、不批量替换历史路径，不将本机历史证据提交到仓库。
