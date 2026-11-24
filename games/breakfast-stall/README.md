# 《早点凑一单》开发说明

游戏 ID：`breakfast-stall`。本目录拥有完整 Cocos Creator 3.8.8 LTS 工程、源码、素材、存档、AppID、构建配置和产物；不是共享玩法包。

## 工程与所有权

- `assets/`：场景、玩法、素材及对应 `.meta`，脚本 UUID 与场景引用必须整体保留。
- `settings/`：Creator 工程设置。
- `extensions/breakfast-startup/`：早餐专属启动页扩展及图片，不能通用化到其他游戏。
- `extensions/cocos-creator-mcp/`：当前保留在本工程的编辑器 MCP 扩展，使用独立锁文件。
- `tools/`：早餐构建、类型检查、身份/场景检查和素材维护脚本。
- `tests/`：早餐纯逻辑测试及最小几何测试声明。
- `build.wechatgame.json` / `build.wechatgame.release.json`：早餐微信构建配置和 AppID。
- `build/wechatgame/`：调试产物；`build/wechatgame-breakfast-release/`：发布产物。

共享 MCP、Skills、微信类型和自动化依赖属于仓库根 `.tooling/`。本目录不依赖其物理安装目录。

## 稳定入口

从仓库根运行：

```bash
npm run test --workspace=breakfast-stall
npm run typecheck --workspace=breakfast-stall
npm run check --workspace=breakfast-stall
npm run build:wechatgame --workspace=breakfast-stall
npm run dev:cocos --workspace=breakfast-stall
```

根也提供 `npm test`、`npm run typecheck`、`npm run check`、`npm run build:breakfast`、`npm run dev:cocos:breakfast` 等编排命令。

### 纯规则测试

`npm run test --workspace=breakfast-stall` 只依赖提交源码、npm 依赖和 `tests/types/cc.d.ts`。不需要 Creator、`temp/` 或 `.tooling/local/`。

`tests/types/cc.d.ts` 只声明被测纯逻辑模块使用的 `primitives.IGeometry` 形状，不是 Cocos 运行时替身。临时编译输出由脚本创建并清理，不能变成手工恢复步骤。

### 完整 Cocos 类型检查

先运行 `npm run dev:cocos:breakfast`，等待 Creator 完成工程导入并生成 `temp/declarations/cc.d.ts`，再运行 `npm run typecheck --workspace=breakfast-stall`。缺声明时脚本会明确提示前置条件。

### 工程与 MCP 检查

`npm run check --workspace=breakfast-stall` 检查 Creator UUID、版本、AppID、启动页五文件和 `Breakfast Game` 组件的真实场景/元数据关联。公共布局检查不会代替这些早餐检查。

`npm run check:mcp` 在根验证三个 stdio MCP 握手及只读调用。Creator MCP 另经 `http://127.0.0.1:3000/mcp` 访问，读取前核对 `cocos://project/info` 是本工程，不能仅凭端口连通判断正确工程。

## 恢复与构建

1. 在仓库根 `npm ci` 恢复工作区依赖。
2. 安装并构建本工程扩展：

   ```bash
   cocos_ext="$PWD/games/breakfast-stall/extensions/cocos-creator-mcp"
   npm ci --prefix "$cocos_ext" --no-audit --no-fund
   npm run --prefix "$cocos_ext" build
   ```

3. 运行 `npm run dev:cocos:breakfast`，等待资源导入和类型声明生成。
4. 运行 `npm run typecheck`、`npm run check` 与 `npm run build:breakfast`。

纯规则测试可在第 1 步后独立运行，不需等待 Creator。Creator 默认从仓库 `.tooling/apps/CocosCreator.app` 定位；安装在其他位置时用 `COCOS_CREATOR_BIN` 指定 `.app/Contents/MacOS/CocosCreator` 的实际路径。微信 CLI 默认 `/usr/local/bin/wechatide`，可用 `WECHAT_IDE_BIN` 覆盖。

发布构建只生成本地包，保持现有 AppID、竖屏、输出名和启动页，不上传、提审或发布。真机帧率、切后台恢复与上传发布需要另行验收或授权。

## 验收与历史证据

可重复排障方法见 [开发排障与测试手册](../../docs/开发排障与测试手册.md)，其中早餐案例只属于本游戏，不是第二游戏的强制教程。

微信验收只使用 `build/wechatgame-breakfast-release/` 的绝对路径。先构建，再检查实际画面、帮助或设置和一条核心操作，保存本轮截图与错误日志；不以触控指令的 `success` 替代画面状态。

历史验收见 [2026-11-23 迁移验收](../../docs/superpowers/verification/2026-11-23-minigame-monorepo.md)。随机 `.tooling/local/monorepo-migration/` 等目录只保留历史证据，不是日常恢复或复现依赖。
