# Monorepo 工具职责与可复现性验收记录

## 范围与证据

- 日期：2026-11-24，本机 macOS、Node 24、Cocos Creator 3.8.8、微信开发者工具与 Skill 0.3.11。
- 独立审查范围为 `d8df14c..520ae4e`，另含其 Important 修复；对应 [设计](../specs/2026-11-24-monorepo-tooling-boundaries-design.md) 与 [实施计划](../plans/2026-11-24-monorepo-tooling-boundaries.md) 的任务 1–5。
- 本轮原始截图、命令输出、MCP 返回与微信日志保存在本机忽略目录 `.tooling/local/checks/final-acceptance.MXlH1p/`。该目录是证据，不是日常运行依赖，也不进入提交。
- 本轮只整理公共/游戏工具边界、可复现测试、启动入口和文档，不修改玩法、AppID、存档键、Creator UUID、构建输出名或启动页文案。

## 干净源码副本恢复

干净 worktree 位于 `/private/tmp/monorepo-tooling-clean.xTYgQy`（逻辑路径 `/tmp/monorepo-tooling-clean.xTYgQy`），内容与提交 `520ae4e` 一致。恢复依赖使用真实 `npm ci --ignore-scripts --no-audit --no-fund`，没有从当前工作区复制 `node_modules/`、`.tooling/local/`、Creator 声明或构建产物。

| 阶段 | 实际结果 |
| --- | --- |
| 无 Creator 声明的纯规则阶段 | 明确确认 `games/breakfast-stall/temp/declarations/cc.d.ts` 不存在；`npm test` 35 通过、0 失败；`npm run check:layout` 与 `npm run check --workspace=breakfast-stall` 均通过。 |
| 完整类型阶段 | 仅额外从已核对的新 Creator 工程复制真实 `temp/declarations/cc.d.ts`，然后 `npm run typecheck` 与 `npm run check` 退出 0。该步骤验证声明前置与完整源码类型检查，不宣称无 Creator 的完整自举。 |

原始证据为 `clean-npm-ci.log`、`clean-pure-test.log`、`clean-typecheck.log` 和 `clean-check.log`。审查 Important 修复后的最终全量输出另存为 `final-post-fix-{test,typecheck,check,mcp,build}.log`，其中规则测试 35/35、身份关联回归 3/3，类型、公共/游戏检查、MCP 与发布构建均退出 0。安装输出含现有传递依赖的弃用警告，安装本身成功；本轮没有为此升级依赖。

## 当前工作区验证

| 命令 | 结果与证据 |
| --- | --- |
| `npm test` | 35 通过，0 失败；`final-test.log`。审查修复后再次通过，见 `post-review-test.log`。 |
| `npm run typecheck` | 退出 0；`final-typecheck.log`。 |
| `npm run check` | 通用布局检查与早餐工程检查均通过；`final-check.log`。审查修复后再次通过，早餐身份回归用例 3/3，见 `post-review-check.log`。 |
| `npm run check:mcp` | minigame（19 个工具）、CloudBase（42 个工具）、wechatide（49 个工具）initialize/tools-list 成功，CloudBase `auth(status)` 和微信 `project_list` 只读调用成功；`final-mcp.log`。CloudBase 返回未登录，没有代为登录或写环境。 |
| `npm run build:breakfast` | 退出 0，生成 `games/breakfast-stall/build/wechatgame-breakfast-release/`，日志包含 `[breakfast-startup] 已应用微信启动页`；`final-build.log`。 |

Creator MCP 的原始返回 `cocos-mcp.json` 核对：工程路径为 `/Users/aaa/acode/mini-program-temp/games/breakfast-stall`，场景为 `main`，启用的 `Breakfast Game` 节点关联 `BreakfastGame` 组件。没有把端口健康检查当作工程身份。

## 微信模拟器实际交互

微信门禁返回版本匹配、登录有效且不需要 CLI Token。打开的是上述新发布目录，设备模板为 iPhone 14/15 Pro Max，原始截图 612×1324；所有触摸使用相同截图的图像坐标空间。

| 顺序 | 本轮证据与结果 |
| --- | --- |
| 初始关卡 | `01-current.png`：第 1 关，A 单豆浆、包子，两个暂存碟为空。 |
| 打开帮助 | `02-help-open.png`：问号打开「小摊开工单」。 |
| 米糕入碟 | `03-help-rice-staged.png`：米糕进入暂存碟，茶叶蛋解除遮挡。 |
| 完成帮助 | `04-help-egg-ready.png`：茶叶蛋完成 A 单，暂存米糕自动补入 B 单。 |
| 返回正式关 | `05-level-unchanged.png`：第 1 关订单、豆浆、包子和两个空暂存碟与初始状态一致，帮助操作没有污染正式关。 |

`console-full.json` 保存同一轮 11 行运行与触控日志；`console-errors.json` 对 `error|exception|failed` 的过滤结果为空。触控返回值仅用于记录动作，通过结论来自上述实际画面。原请求名为 `.png` 的文件由工具实际编码为 JPEG。

## 独立整体审查

独立 reviewer 对 `d8df14c..520ae4e` 的代码审查未发现 Critical，发现一项 Important：早餐检查把组件压缩 UUID 硬编码为 `7ab9fJX3ypFuK7Xmel041GX`，元数据 UUID 改动后仍能误通过。审查者用隔离工程复现了该问题。

修复后，`check-project.cjs` 先验证脚本元数据 UUID，再按 Creator 脚本编码规则派生组件类型，与 `Breakfast Game` 节点实际引用的组件比较。`tools/tests/check-project.test.cjs` 包含三个真实检查器用例：元数据 UUID 与场景不一致、UUID 缺失均拒绝，当前正确关联接受。这组用例已接入早餐 `check` 脚本。

红绿证据：修复前的真实隔离复现返回 `Breakfast project checks passed`；新增测试在旧硬编码检查器上两项负向用例失败。修正检查器后，又发现测试误调主工程检查器而非 fixture 中的副本，修正测试路径后 3/3 通过，输出见 `uuid-regression-green.log`。早餐 35/35 规则测试与根 `npm run check` 随后通过，见 `post-review-test.log` 和 `post-review-check.log`。

审查者未独立重跑 Creator/微信 GUI、发布构建、真实第三方 MCP 或物理设备；这些由主执行者的本轮直接证据覆盖对应模拟器范围，不扩大为真机或发布结论。历史迁移台账仅按归档资料审查；额外 MCP 进程硬化没有已证实产品失败，不纳入本轮修复。

## 执行决策

- 按既定授权继续在 `main` 原地执行，不另建实现工作树；干净恢复验证使用可写的隔离源码副本，不改当前工作区。
- 公共 MCP 握手从目录检查中拆出为 `check:mcp`，避免公共布局验证读取或依赖游戏身份。
- 保留版本化测试、类型检查和构建包装器；临时目录只存放可清理的编译输出，不作为手工恢复入口。
- 对完整类型阶段只提供 Creator 已生成的真实 `cc.d.ts`，不伪造 Creator 导入，也不把它算作纯测试依赖。
- 验收命令曾将 macOS `/tmp` 与 `/private/tmp` 的路径别名误判为失败；改为核对 `pwd -P` 后继续。这是取证脚本问题，未改项目实现。

## 延期项与未覆盖

- 轻微建议延期：缺失 `BreakfastGame.ts.meta` 时仍由文件系统抛出 `ENOENT`，而不是明确的早餐资源诊断。检查会非零失败，不影响本次 UUID 关联正确性；后续可将其纳入必需文件清单并改善报错。
- 独立审查没有其他 Critical/Important 遗留项；按本轮约定不再发起重复 re-review，修复以回归测试和全量检查验证。

本轮没有执行真机帧率、切后台恢复、CloudBase 业务、上传、提审或发布；这些不构成本轮通过结论。没有清存档、切关或修改用户设置。
