# 文档职责统一与从零运行验收记录

## 范围与证据

- 日期：2026-11-25；本机 macOS、Node 24。
- 范围：统一日常文档入口，增加 macOS / Windows 10/11 的 GUI 从零安装与运行指南；迁移两份历史说明至 `docs/archive/`；收窄 AI、排障与游戏专属文档职责。
- 本次仅修改文档与文档链接检查，没有修改玩法、素材、场景、AppID、Creator UUID、构建配置或启动脚本。
- 设计与计划分别见 [文档整理设计](../specs/2026-11-24-documentation-onboarding-design.md) 和 [实施计划](../plans/2026-11-24-documentation-onboarding.md)。

## 静态与工程验证

2026-11-25 在仓库根执行：

```bash
node tools/check-documentation.cjs && npm test && npm run typecheck && npm run check
```

| 验证 | 结果 |
| --- | --- |
| 文档导航与归档链接 | 通过；日常文档无旧归档入口，所覆盖本地链接有效。 |
| `npm test` | 35 通过，0 失败。 |
| `npm run typecheck` | 退出 0；使用本工作区 Creator 已生成的真实声明。 |
| `npm run check` | 公共布局与早餐工程检查通过；场景元数据回归用例 3 通过，0 失败。 |

AppID 来源与 Windows 恢复路由的定向文档检查在修改前因缺少来源/路由失败，修改后通过；随后上述完整命令也通过。该检查用于复核文档内容，不是 GUI 运行证据。

## 独立审查与处理

独立审查核对完整改动与收尾修正，重点覆盖首次 GUI 可达性、Windows 命令、文档职责与历史链接。

已核实并处理的问题：

1. 首次构建界面没有旧任务时，不能假设已有 AppID。`docs/getting-started.md` 现明确项目现有 AppID 的值及 `packages.wechatgame.appid` 配置来源；没有修改该值。
2. 早餐 README 的 MCP 恢复片段使用 Bash 变量，现明确其 shell 范围，并将 Windows PowerShell 用户导向 `环境使用说明.md` 的对应步骤。
3. 最终独立审查发现一项 Important：历史设计的执行状态入口误写为 `../archive/monorepo-execution.md`，实际少了一层目录。现已修正为 `../../archive/monorepo-execution.md`，没有修改该设计的其余历史正文。另一份历史验收的 `../../archive/monorepo-migration.md` 原本有效，保持不动。
4. 文档检查器原先跳过全部 `docs/superpowers/`，因此漏报上述问题。现只定向检查这两个获准修改的归档目标；不扫描或改写旧源码路径等其他历史事实。修正前检查器准确报告该设计链接不符，修正后通过。

最终独立审查另有一项 Minor，即本记录此前把两个历史链接合并描述为均有效；现已分别写明实际路径与结果。除此之外无 Critical/Important 遗留项，也没有其他延期项。按既定约定不再重复发起审查，修复以回归检查和完整验证为准。

## 未覆盖与验收边界

- **本次干净副本 GUI 验收未完成。** 已从不含 `node_modules/`、MCP `dist/`、旧 `profiles/` 和旧构建产物的副本启动 Creator，并尝试操作构建面板；面板自动化多次未可靠生效，没有完成该副本的实际构建。因此也没有从该副本的新产物复验微信帮助流程。用户明确允许多次失败后停止，本次不再重试。
- 历史验收中已有的已配置工程构建与模拟器帮助流程记录仍保留，但不作为本次干净副本验证通过的证据。
- **Windows 未进行本机实测。** 安装与命令步骤依据官方资料和仓库配置编写，不能解读为 Windows 验收通过。
- 本次没有执行真机、CloudBase 业务、上传、提审或发布；没有清存档或修改用户设置。

因此，本次结论是文档整理、内容复核和上述自动验证完成，**不是从零 GUI 全流程验收通过**。后续若恢复 GUI 验证，应使用干净副本重新构建并保存新产物的微信交互截图与错误日志。
