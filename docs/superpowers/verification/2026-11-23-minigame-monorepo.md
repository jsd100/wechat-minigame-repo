# 多游戏 Monorepo 迁移验收记录

## 范围与证据

- 日期：2026-11-23，本机 macOS、Node 24.21.0、Cocos Creator 3.8.8、微信开发者工具与 Skill 0.3.11。
- Creator 源码：`games/breakfast-stall/`；微信验收仅使用 `games/breakfast-stall/build/wechatgame-breakfast-release/`，没有从仓库根或旧目录打开游戏。
- 本轮原始截图、构建与测试日志、MCP 返回、触控驱动和系统信息保存在本机忽略目录 `.tooling/local/monorepo-migration/acceptance.Cn5A8y/`；该目录不是提交内容。
- 逐字节对照迁移前 `cocos-game/` 与当前 `games/breakfast-stall/` 的 `assets/`、`settings/`、`extensions/breakfast-startup/`，73 个受控文件内容全部相同，结果见 `resource-hashes.json`。这里的“65 项资源与启动页文件”是任务 1 的核对范围，73 是本次扩大后的核对范围。

## 静态检查与构建

| 检查 | 本轮结果 |
| --- | --- |
| `node tools/check-monorepo-layout.cjs` | 通过；新工程、根工作区、MCP 解析、无效根入口删除及现行文档检查成功 |
| `npm test` | 35 通过，0 失败；详见 `test.log` |
| `npm run typecheck` | 退出 0；详见 `typecheck.log` |
| `npm run build:breakfast` | 退出 0，生成新发布目录；详见 `build.log` |
| 早餐启动页 | 构建日志有 `[breakfast-startup] 已应用微信启动页`；产物 `first-screen.js` 指定 `breakfast-start.jpg` 并关闭默认 Logo |
| 原 AppID 与启动文件 | 产物 `compileType: game`，AppID 保持 `wx136b6cd4db8ee9c0`；五个 `breakfast-startup` 文件与 `7e2237c` 基线逐字节一致 |

## Creator 核验

通过 `http://127.0.0.1:3000/mcp` 只读读取：

- `cocos://project/info` 的路径为 `/Users/aaa/acode/mini-program-temp/games/breakfast-stall`，不是旧工程。
- 当前场景为 `main`，UUID `d8661efa-1803-41de-9857-91faa43bf5e1`；存在 `Main Camera`、`Main Light` 和启用的 `Breakfast Game` 节点，组件为 `BreakfastGame`。
- 场景中的 `7ab9fJX3ypFuK7Xmel041GX` 对应 `BreakfastGame.ts.meta` 的 `7ab9f257-df2a-45b8-aed7-99e974e35197`；贴图 UUID 为 `2ab61426-7de7-4019-a417-c5dea25f2b8b@6c48a`，两项效果引用保持。原始返回见 `cocos-mcp.json`。
- 本轮进程核对只发现带 `--project …/games/breakfast-stall` 的 Creator 主进程，没有旧 `cocos-game` 的 Creator 进程，因此没有关闭无关进程或切换 MCP 端口。

## 微信模拟器实际交互

微信门禁返回 `versionRelation: equal`、`loginExpired: false`、`cliTokenRequired: false`。以 `DeepSeekHarness` 打开新发布目录，设备模板为 iPhone 14/15 Pro Max，窗口 430×932，原始截图 612×1324；所有触摸使用相同截图的图像坐标空间。

| 顺序 | 本轮证据与结果 |
| --- | --- |
| 当前关卡 | `01-current.png`：《早点凑一单》第 1 关，A 单豆浆、包子，两个暂存碟为空。 |
| 帮助打开 | `02-help-open.png`：问号打开「小摊开工单」，不是仅触控返回成功。 |
| 米糕入碟 | `03-help-rice-staged.png`：米糕进入暂存碟，茶叶蛋解除遮挡。 |
| 完成帮助 | `04-help-complete.png`：茶叶蛋完成 A 单，暂存米糕自动补入 B 单。 |
| 设置开关 | `05-settings-open.png`、`06-settings-closed.png`：设置弹窗真实打开并关闭，未改声音/动效偏好。 |
| 正式关取餐 | `07-soy-staged.png`：点豆浆直接补入当前 A 单，豆浆显示勾选；这是第 1 关正确行为，不是误记为暂存。 |
| 撤回 | `08-undo-restored.png`：A 单恢复豆浆 1，台面豆浆恢复，暂存碟仍为空，撤回按钮显示已用。 |

本轮正式关停在第 1 关，因此采用直接取餐与撤回路线，未执行仅适用于第 12 关的油条路线。没有重开、切关、清存档或改玩法代码。

`console-all.json` 保存同一轮驱动和运行日志；`console-errors.json` 对 `error|exception|failed` 的过滤结果为空。`system-info.json` 记录设备与画布上下文。原请求命名为 `.png` 的文件由工具实际编码为 JPEG，截图像素和本轮时间以本地文件为准。

## 旧缓存清理

新 Creator 与微信核心交互通过后，旧 `cocos-game/` 的 `realpath` 精确等于 `/Users/aaa/acode/mini-program-temp/cocos-game`，其直接子项仅有 `library/`、`profiles/`、`temp/`。逐项验证真实路径后删除这三项生成缓存与空目录，没有删除新工程、`.tooling/local/`、凭证或源码。当前旧目录已不存在。

## 独立审查与干净安装复验

独立审查比较了 145 个迁移路径：除游戏 manifest、构建包装器和扩展锁文件这三个预期变更外，其余 142 个路径内容一致；未发现玩法、UUID、素材、启动页、AppID 或存档键回归。审查发现原根锁文件有 1,217 个共享依赖条目缺少 `resolved` 或 `integrity`，本次为此增加回归断言并先确认其在旧锁上失败。

随后用 npm 从空工作区生成完整锁，保留 `.tooling` 与 Cocos 扩展的独立锁文件不变，采用设计允许的 npm 默认物理提升，不强制嵌套。最终根清单仍只直接声明 TypeScript，共享工具由 `.tooling` 工作区声明；根锁 1,261 个注册表条目均有来源与完整性字段。可浮动的少量 Babel/caniuse 传递依赖使用重新生成锁时固定的新版本，直接依赖版本未提高。

最终 Git 快照 `9f1df509b88cffa7dec8e28dfd933ae534611eec` 在 `/tmp/minigame-monorepo-clean.X1fHks` 进行验证：从该快照根目录运行 `npm ci --ignore-scripts --no-audit --no-fund` 成功，布局检查、35/35 测试、类型检查和三条 MCP 握手全部通过。快照测试只额外复制当前新工程已生成的 `temp/declarations/cc.d.ts`，不复制依赖或构建产物。详见 `clean-install-verification.json`、`clean-npm-ci.log`、`clean-mcp-handshakes.log`。

审查另提出 Creator 脚本对 `$PWD` 的依赖、扩大资源回归覆盖、临时目录与 spawn 错误诊断三个轻微建议；本次不扩大范围，保留为后续改进项。

## 未覆盖与结论

本轮迁移后的 Creator 工程、发布构建、微信帮助、设置、取餐和撤回均通过。未做真机帧率、切后台恢复、CloudBase 业务、上传、提审或发布；这些不构成本轮通过结论。历史第 12 关通关记录保留为历史，不冒充本轮结果。
