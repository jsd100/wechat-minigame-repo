# 从零安装并运行《早点凑一单》

本教程面向第一次接触本仓库、电脑上还没有开发工具的开发者。目标是在 **macOS 或常规 Windows 10/11** 上，用 Cocos Creator 构建游戏，再在微信开发者工具的模拟器中运行。

**先读这里：**

- 主路径全部使用桌面界面，**不要求先安装 Node.js、npm、MCP、Skills 或配置 Token**。
- 微信登录账号需要拥有本项目小游戏 AppID 的开发权限；没有权限时请先联系项目管理员，不要换成其他 AppID。
- Windows 步骤依据官方资料和项目配置编写，当前未进行 Windows 本机实测；macOS 有实际构建与模拟器验证。
- 本教程只覆盖本地模拟器，不包含真机、上传、提审、发布或 CloudBase。

## 1. 准备三个工具与账号

| 工具 | 用途 | 官方来源与安装 |
| --- | --- | --- |
| Git | 克隆项目 | macOS 可在终端运行 `git --version`，按提示安装 Xcode Command Line Tools，或从 [Git 官方下载页](https://git-scm.com/downloads) 安装。Windows 下载 **Git for Windows x64**，保留默认选项，安装后打开 Git Bash 或 PowerShell。 |
| Cocos Creator **3.8.8 LTS** | 打开源码、构建微信小游戏 | 从 [Cocos Creator 官方下载页](https://www.cocos.com/creator-download) 获取。可使用 Cocos Dashboard 管理版本，也可下载编辑器；选择 **3.8.8**，不要默认改成其他大版本。macOS 区分 Apple Silicon 与 Intel，Windows 选择常规 x64 包。 |
| 微信开发者工具 | 导入构建产物、运行模拟器 | 从 [微信官方下载页](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 获取对应系统的安装包，macOS 按芯片选择，Windows 选 x64。安装后打开并用有项目权限的微信扫码登录。 |

**macOS 补充：** 如果使用 Cocos Dashboard，先安装 Dashboard，再在编辑器版本列表安装 3.8.8；直接安装编辑器时，将应用放到「应用程序」。如果 macOS 拦截首次启动，按系统安全提示确认你下载的是官方应用。

**Windows 补充：** 按安装向导完成安装并启动，不要求 WSL、Git Bash、Visual Studio 或额外编译插件。

## 2. 获取项目

在希望存放项目的目录打开终端：macOS 使用「终端」，Windows 可使用 Git Bash 或 PowerShell。

```bash
git clone https://github.com/jsd100/wechat-minigame-repo.git
cd wechat-minigame-repo
```

下面把 `wechat-minigame-repo/` 称为**仓库根目录**。GitHub 页面也提供下载 ZIP 的方式；使用 ZIP 时不需要 Git，但要先解压，再在解压后的目录中继续。

如果已配置 SSH，也可以用自己的 SSH 地址克隆。若代理中断 SSH 22 端口，不要随意改 GitHub IP 或关闭主机校验，按 [GitHub 官方 SSH 443 指南](https://docs.github.com/en/authentication/troubleshooting-ssh/using-ssh-over-the-https-port) 使用 `ssh.github.com:443`，或改用上述 HTTPS 地址。

## 3. 用 Cocos Creator 打开源码工程

1. 打开 Cocos Creator 3.8.8。如果通过 Dashboard 管理工程，先启动对应版本的编辑器。
2. 选择「打开」或「打开项目」，选中仓库内的：

   ```text
   games/breakfast-stall/
   ```

   **不是仓库根目录，也不是 `build/` 目录。**
3. 等待首次资源导入完成。再在资源管理器中打开 `assets/main.scene`。
4. 打开「扩展 → 扩展管理器」，确认「早餐摊微信启动页」（`breakfast-startup`）已启用。

### 新克隆可能提示 Cocos MCP 扩展无法加载

工程包含一个**可选的 AI/MCP 扩展** `cocos-creator-mcp`。它的 `dist/` 与依赖不随 Git 提交，新克隆可能因此报告扩展无法加载或无法启动。

**普通运行不需要修复这个可选扩展。** 在扩展管理器中禁用 `cocos-creator-mcp`，或忽略这条可选功能错误，继续确认 `breakfast-startup` 启用即可。不要为了让普通构建通过而先配置 AI 工具。

只有以后需要使用 MCP/AI 调试时，才按 [可选 AI 环境说明](../环境使用说明.md) 安装 Node/npm、构建扩展依赖并配置客户端。

## 4. 在 Creator 中构建微信小游戏

1. 打开「项目 → 构建发布」。
2. 发布平台选择「微信小游戏」。首次导入没有旧构建任务时，在界面中按下列项目事实核对或填写一次：

   | 项目 | 应保持的值 |
   | --- | --- |
   | 发布平台 | 微信小游戏 |
   | AppID | 使用构建界面从项目读取的现有小游戏 AppID，不替换 |
   | 屏幕方向 | 竖屏（Portrait） |
   | 输出名称 | `wechatgame-breakfast-release` |
   | 构建输出目录 | 工程内的 `build` |
   | 初始场景 | `main` |
   | 启动页扩展 | `breakfast-startup` 已启用 |

3. 点击「构建」，等待完成。不要手动重建 `build.wechatgame.*.json`；这些 JSON 主要供命令行构建，GUI 构建任务由 Creator 保存在本机配置中。
4. 构建成功后，工程目录下应生成：

   ```text
   games/breakfast-stall/build/wechatgame-breakfast-release/
   ```

   其中至少应有 `game.js`、`game.json`、`project.config.json`、`first-screen.js` 和 `breakfast-start.jpg`。

如果没有生成该目录，先回到上一步核对输出名称与目录，并查看 Creator 构建日志；不要把源码目录当作构建结果。

## 5. 用微信开发者工具运行

1. 打开微信开发者工具并登录有项目权限的账号。
2. 选择「导入项目」，项目类型选择 **小游戏**，目录选择上一步生成的**完整产物目录**：

   ```text
   games/breakfast-stall/build/wechatgame-breakfast-release/
   ```

   **不要导入仓库根目录，也不要导入 `games/breakfast-stall/` 源码目录。**
3. 核对自动读取的 AppID 与项目一致。若提示无权限，使用有该小游戏开发权限的微信账号，或请管理员在微信公众平台添加权限。
4. 点击「编译」，等待游戏画面出现。

### 成功标准：完成一次帮助流程

1. 点招牌左侧的「?」，打开「小摊开工单」。
2. 在试玩中点米糕，确认它进入暂存碟，茶叶蛋解除遮挡。
3. 再点茶叶蛋，确认 A 单打包，暂存的米糕自动补入 B 单。
4. 返回正式关卡，订单和暂存状态不应被帮助试玩改变。

看到以上画面变化，就说明 Creator 构建、微信导入和基本交互均已跑通。**无需重开本关、清空存档或修改声音/动效设置来凑前置条件。**

## 6. 可选：安装 Node.js 做自动验证

只有需要命令行验证、扩展开发或 AI/MCP 调试时，才安装 **Node 24**（自带 npm）。从 [Node.js 官方下载页](https://nodejs.org/en/download) 选择 macOS 或 Windows 安装包，安装后重开终端并确认：

```bash
node --version
npm --version
```

在仓库根目录执行：

```bash
npm ci
npm test
npm run check
```

- `npm test` 是纯规则测试，不需要 Creator、MCP 或历史本机文件。
- `npm run check` 检查公共目录和早餐工程关联。
- `npm run typecheck` 需在 Creator 完成导入、生成 `temp/declarations/cc.d.ts` 后再运行。
- `npm run check:mcp` 仅适用于已经配置 AI/MCP 的开发者，不是首次运行前置。

## 7. 可选：使用命令行打开或构建

GUI 已能完成运行，不要求使用这些命令。需要时再阅读 [早餐开发说明](../games/breakfast-stall/README.md)。

- macOS 默认从 `.tooling/apps/CocosCreator.app` 定位；安装在其他位置时，将 `COCOS_CREATOR_BIN` 设为 `.app/Contents/MacOS/CocosCreator` 的实际路径。
- Windows 必须将 `COCOS_CREATOR_BIN` 设为实际的 Creator Windows 可执行文件，不能套用 macOS 的 `.app` 路径或 `open` 命令。
- 微信 CLI 仅在进阶调试中使用，路径可按实际安装位置用 `WECHAT_IDE_BIN` 覆盖。

## 8. 下一步与常见阻塞

| 现象 | 先检查 |
| --- | --- |
| Dashboard 找不到 3.8.8 | 回到 Cocos 官方下载页安装对应 LTS，不用其他版本替代。 |
| Cocos MCP 加载失败 | 这是可选 AI 扩展未构建，不是普通运行失败；禁用它，保留早餐启动页。 |
| 微信提示 AppID 无权限 | 检查登录账号的小游戏开发权限，不要改项目 AppID。 |
| 微信一直加载或显示旧画面 | 核对导入的是本次 `wechatgame-breakfast-release` 产物目录，重新构建后再编译。 |
| 命令行找不到 Creator | 普通 GUI 不受影响；CLI 才需要设置 `COCOS_CREATOR_BIN`。 |

- 项目结构与新增游戏： [目录与开发工具契约](repository-layout.md)
- 早餐专属构建与验收： [早餐开发说明](../games/breakfast-stall/README.md)
- 进阶排障： [开发排障与测试手册](开发排障与测试手册.md)
- 可选 AI/MCP/Skills 配置： [环境使用说明](../环境使用说明.md)
