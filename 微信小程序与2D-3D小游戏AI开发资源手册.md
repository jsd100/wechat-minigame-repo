# 微信小程序与 2D／3D 小游戏 AI 开发资源手册

适用于 macOS 本地开发，也可以交给团队成员和其他编码 Agent。核对日期为 2026-11-20。命令按所选路线执行，工作目录默认是相应项目根目录。

## 1. 先选项目路线

| 目标 | 推荐起步组合 | 首次验收 |
| --- | --- | --- |
| 微信小程序，表单、列表、工具 | 原生 TypeScript + 官方微信 Skill，可选 TDesign | 模拟器打开首页，新增一条数据，返回后验证保存 |
| 微信小程序，沿用 React 或 Vue | Taro + React，或 uni-app + Vue；构建后交给官方微信工具 | 用微信目标产物跑表单和页面跳转 |
| 原生轻量 2D 小游戏 | Canvas 2D + TypeScript + 官方微信 Skill，可选小游戏开发者助手 | 开局、触摸输入、计分、结算、重开 |
| 有精灵动画、场景和关卡的 2D | Cocos Creator 或 LayaAir + 对应编辑器 MCP | 导出一个微信小游戏场景，真机测一轮 |
| 新做 3D 小游戏 | Cocos Creator 或 LayaAir + 对应 MCP，先做一个低面数场景 | 真机加载模型，拖动视角，切后台后恢复 |
| 已有 Unity/C# 或 Godot/GDScript 项目 | Unity CLI + 微信适配 SDK，或 Godot 社区导出插件 + MCP | 先把原引擎的最小场景导出到微信真机 |

小程序常见入口是 ``app.json``，小游戏常见入口是 ``game.js`` 和 ``game.json``。跨端框架和游戏引擎应把**源码目录**与**微信构建产物目录**分别交代给 Agent。编译后的产物用于预览，后续修改通常落在源码。 [微信小程序指南](https://developers.weixin.qq.com/miniprogram/dev/framework/) · [微信小游戏指南](https://developers.weixin.qq.com/minigame/dev/guide/)

## 2. 所有 Agent 共用的微信官方工具

### 2.1 终端能运行命令时，先接官方 Skill

1. 从微信官方下载安装支持 Skills 的开发者工具。在已装好的机器上执行 ``command -v wechatide`` 和 ``wechatide``，查看命令位置、Skill 路径和版本。
2. 在微信开发者工具扫码登录。按当前版本提示开启「设置 → 安全」中的服务端口。团队成员各自完成本机授权。
3. 按第 3 节把**完整的 Skill 目录**接到 Agent。你这台 Mac 已发现 ``/usr/local/bin/wechatide`` 和随附 Skill 0.3.11。在项目根目录、目标链接尚不存在时执行以下命令。

```bash
mkdir -p .agents/skills
ln -s /Applications/wechatwebdevtools.app/Contents/Resources/app.asar.unpacked/wechatide-skill .agents/skills/wechatide-skill
```

从 Codex、Cursor、Gemini CLI 等支持该目录的客户端打开项目。Claude Code 和 CodeBuddy Code 还可按第 3 节建立各自的入口。如果只试一次，也可让能读文件的 Agent 打开上述绝对路径下的 ``SKILL.md``，并按其中的路径继续读取引用文件。团队仓库可记录安装步骤，绝对路径软链接由每台机器分别创建。

```bash
wechatide -c codex check_wechatide_status --skill-version 0.3.11
wechatide open_project_window --help
wechatide simulator_screenshot --help
wechatide automation_game_action --help
```

首条命令示例中的 ``codex`` 换成正在使用的客户端名，版本换成该客户端实际加载的 Skill 版本。其它三条是查帮助。小程序按元素点击或导航，小游戏用 Canvas 的 tap、swipe 等操作。不同工具支持的参数以本机帮助为准。 [微信官方 Skills 安装与连接](https://developers.weixin.qq.com/miniprogram/dev/devtools/Skills.html)

### 2.2 客户端需要工具调用时，再接官方 MCP

1. 在微信开发者工具「设置 → 安全」复制官方生成的 MCP 配置。保留工具给出的命令、参数和传输类型。
2. 把配置转换为第 3 节中客户端的格式。若复制的是 stdio，常见形状如下。

```json
{
  "mcpServers": {
    "wechat-devtools": {
      "command": "/usr/local/bin/wechatide",
      "args": ["mcp", "--token=YOUR_WECHAT_MCP_TOKEN"]
    }
  }
}
```

Token 填在个人配置或该客户端支持的凭证存储里。MCP 需要独立的 Token。CLI 的访问令牌仅在开发者工具启用对应校验时需要。修改后刷新 MCP 工具或新开会话，首次连接按微信工具弹窗授权，再实际调用 ``check_wechatide_status``。只看到已登记的服务名，还需再做一次工具调用验证。 [微信官方 Skills 与 MCP](https://developers.weixin.qq.com/miniprogram/dev/devtools/Skills.html)

Codex 用户也可直接将对应配置写进本机 ``~/.codex/config.toml``。

```toml
[mcp_servers.wechat-devtools]
command = "/usr/local/bin/wechatide"
args = ["mcp", "--token=YOUR_WECHAT_MCP_TOKEN"]
```

## 3. 跨 Agent 安装和配置

Skill 是给 Agent 读的工作说明，MCP 是 Agent 实际调用的工具，CLI 可以由有终端权限的 Agent 直接执行。插件通常包含一项或多项。优先把项目规则写入客户端可读的项目说明，再用同一份 Skill 内容和对应的 MCP 接入。

### 3.1 Skills 目录

| 客户端 | 项目级 Skills 位置或入口 |
| --- | --- |
| Codex | ``.agents/skills/<技能名>/SKILL.md``，可在会话中用 ``$wechatide-skill``。 [Codex Skills](https://learn.chatgpt.com/docs/build-skills) |
| Claude Code | ``.claude/skills/<技能名>/SKILL.md``，可用 ``/wechatide-skill``。 [Claude Code Skills](https://code.claude.com/docs/en/skills) |
| Cursor | ``.agents/skills/`` 或 ``.cursor/skills/``，在 Agent 对话中输入 ``/`` 查找已发现的技能。 [Cursor Skills](https://cursor.com/docs/skills) |
| VS Code + GitHub Copilot | ``.github/skills/`` 是 Copilot 的项目入口。按客户端当前发现机制选择，也可查看其 ``.agents/skills/`` 支持。 [VS Code Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills) |
| Gemini CLI | ``.gemini/skills/`` 或 ``.agents/skills/``，用 ``/skills list`` 检查。 [Gemini CLI Skills](https://geminicli.com/docs/cli/using-agent-skills/) |
| OpenCode | ``.opencode/skills/``，也兼容 ``.agents/skills/`` 和 ``.claude/skills/``，新会话中按名字请求加载。 [OpenCode Skills](https://opencode.ai/docs/skills/) |
| CodeBuddy Code | ``.codebuddy/skills/``，用 ``/skills`` 查看。CodeBuddy IDE 可按其扩展和设置面板接入。 [CodeBuddy Code Skills](https://www.codebuddy.cn/docs/cli/skills) |
| Qwen Code | ``.qwen/skills/`` 或 ``.agents/skills/``。 [Qwen Code Skills](https://qwenlm.github.io/qwen-code-docs/en/users/features/skills/) |
| Kimi Code、Trae、Windsurf 等其他 Agent | 先查看其当前版本的 Skills 目录或在 ``npx skills add <仓库>`` 的交互界面选择客户端。有终端权限时，也可以直接读完整 Skill 目录并运行官方 CLI。 [跨客户端 Skills CLI](https://github.com/vercel-labs/skills) |

同一台 Mac 上，如果已经按第 2 节创建了 ``.agents/skills/wechatide-skill``，也要给 Claude Code、VS Code Copilot 和 CodeBuddy Code 提供各自入口，可以使用以下相对链接。只为正在用的客户端创建对应入口。

```bash
mkdir -p .claude/skills .github/skills .codebuddy/skills
ln -s ../../.agents/skills/wechatide-skill .claude/skills/wechatide-skill
ln -s ../../.agents/skills/wechatide-skill .github/skills/wechatide-skill
ln -s ../../.agents/skills/wechatide-skill .codebuddy/skills/wechatide-skill
```

如果客户端或运行环境无法跟随软链接，复制整个目录到目标位置。GitHub 上的公开 Skill 可以使用 ``npx skills add OWNER/REPO --list`` 查看技能，用 ``npx skills add OWNER/REPO`` 交互式选客户端和项目级安装；只装某项时追加 ``--skill SKILL_NAME``。换机器或升级微信开发者工具之后，检查路径和 Skill 版本。 [Skills CLI 源码与用法](https://github.com/vercel-labs/skills)

### 3.2 MCP 配置位置和测试入口

| 客户端 | 配置位置 | 连接检查 |
| --- | --- | --- |
| Codex | 本机 ``~/.codex/config.toml``，使用 ``[mcp_servers.NAME]``。也可用 ``codex mcp add``。 | ``codex mcp list``，新会话实际调用一个工具。 [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) |
| Claude Code | 项目共享用根目录 ``.mcp.json``；个人凭证建议通过 ``claude mcp add --scope local`` 的本机项目作用域保存。 | ``claude mcp get NAME`` 或会话内 ``/mcp``。 [Claude Code MCP](https://code.claude.com/docs/en/mcp) |
| Cursor | 项目 ``.cursor/mcp.json`` 或个人 ``~/.cursor/mcp.json``，顶层 ``mcpServers``。 | 在 MCP 设置中查看工具，再发起一次调用。 [Cursor MCP](https://cursor.com/help/customization/mcp) |
| VS Code + Copilot | 项目 ``.vscode/mcp.json``，顶层 ``servers``，也可从命令面板用 ``MCP: Add Server`` 安装到用户配置。 | ``MCP: List Servers``，启动对应服务器后在 Chat 工具列表检查。 [VS Code MCP](https://code.visualstudio.com/docs/agent-customization/mcp-servers) |
| Gemini CLI | 项目 ``.gemini/settings.json`` 或用户 ``~/.gemini/settings.json``，顶层 ``mcpServers``，Streamable HTTP 配置字段为 ``httpUrl``。 | ``gemini mcp list`` 或 ``/mcp list``。 [Gemini CLI MCP](https://geminicli.com/docs/tools/mcp-server/) |
| OpenCode | 项目 ``opencode.json``，顶层 ``mcp``；本地 ``type: local``，HTTP ``type: remote``。 | ``opencode mcp list``，再调用实际工具。 [OpenCode MCP](https://opencode.ai/docs/mcp-servers/) |
| CodeBuddy | CodeBuddy Code 用 ``codebuddy mcp add``、项目根目录 ``.mcp.json`` 或个人 ``~/.codebuddy/.mcp.json``；IDE 用设置中的 MCP 面板。 | CLI 用 ``codebuddy mcp list``，IDE 检查工具列表和一次真实调用。 [CodeBuddy CLI MCP](https://www.codebuddy.cn/docs/cli/mcp) · [CodeBuddy IDE MCP](https://www.codebuddy.cn/docs/ide/User-guide/MCP) |
| Qwen Code | 项目 ``.qwen/settings.json`` 或用户 ``~/.qwen/settings.json``，顶层 ``mcpServers``，Streamable HTTP 用 ``httpUrl``。 | ``qwen mcp list`` 或会话内 ``/mcp``。 [Qwen Code MCP](https://qwenlm.github.io/qwen-code-docs/en/users/features/mcp/) |

### 3.3 可复制的 stdio 和 HTTP 示例

以下用**小游戏开发者助手**演示 stdio，用 **Cocos Creator 本机 MCP** 演示 Streamable HTTP。换成另一项资源时，只替换该资源的启动命令或 URL。每种客户端只需选自己的配置方式。Cocos 示例地址要与编辑器显示的端口一致。

```bash
# Codex
codex mcp add weixin-minigame-helper -- npx -y @weadmin/weixin-minigame-helper-mcp@0.1.45
codex mcp add cocos-creator --url http://127.0.0.1:3000/mcp

# Claude Code
claude mcp add --scope local --transport stdio weixin-minigame-helper -- npx -y @weadmin/weixin-minigame-helper-mcp@0.1.45
claude mcp add --scope local --transport http cocos-creator http://127.0.0.1:3000/mcp

# Gemini CLI
gemini mcp add weixin-minigame-helper npx -- -y @weadmin/weixin-minigame-helper-mcp@0.1.45
gemini mcp add --transport http cocos-creator http://127.0.0.1:3000/mcp

# CodeBuddy Code
codebuddy mcp add --scope user weixin-minigame-helper -- npx -y @weadmin/weixin-minigame-helper-mcp@0.1.45
codebuddy mcp add --scope user --transport http cocos-creator http://127.0.0.1:3000/mcp
```

**Claude Code 项目 JSON** 可用下面的形式。Cursor 可沿用结构，HTTP 条目保留 ``url`` 即可。Gemini CLI 和 Qwen Code 可复用 stdio 条目，HTTP 条目使用 ``"httpUrl": "http://127.0.0.1:3000/mcp"``。

```json
{
  "mcpServers": {
    "weixin-minigame-helper": {
      "command": "npx",
      "args": ["-y", "@weadmin/weixin-minigame-helper-mcp@0.1.45"]
    },
    "cocos-creator": { "type": "http", "url": "http://127.0.0.1:3000/mcp" }
  }
}
```

**VS Code ``.vscode/mcp.json``**：

```json
{
  "servers": {
    "weixin-minigame-helper": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@weadmin/weixin-minigame-helper-mcp@0.1.45"]
    },
    "cocos-creator": { "type": "http", "url": "http://127.0.0.1:3000/mcp" }
  }
}
```

**OpenCode ``opencode.json``**：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "weixin-minigame-helper": {
      "type": "local",
      "command": ["npx", "-y", "@weadmin/weixin-minigame-helper-mcp@0.1.45"]
    },
    "cocos-creator": { "type": "remote", "url": "http://127.0.0.1:3000/mcp" }
  }
}
```

已有配置文件时，把需要的条目合并到对应对象中。桌面客户端找不到通过 nvm 安装的 Node 时，先让该客户端工作进程获得正确的 Node bin 目录，再检查 ``npx`` 能否启动。云端 Agent 的 ``127.0.0.1`` 指向它自己的执行环境，连接你这台 Mac 的 DevTools 或引擎时，应选本机 Agent 或该客户端支持的工作环境。

## 4. 微信小程序资源

### 原生与跨端框架

| 资源 | 安装或接入 | 第一次让 AI 做什么 |
| --- | --- | --- |
| **微信原生 TypeScript** | 开发者工具新建「小程序」并选 TypeScript 模板。模板缺类型时，在项目安装 ``npm i -D miniprogram-api-typings``。 | 参考官方 Demo，新建列表和详情，模拟器点第一项并检查标题。 [官方 Demo](https://github.com/wechat-miniprogram/miniprogram-demo) · [类型包](https://github.com/wechat-miniprogram/api-typings) |
| **TDesign 小程序组件** | 在小程序 npm 根目录运行 ``npm i tdesign-miniprogram``，开发者工具选「工具 → 构建 npm」，在页面 JSON 的 ``usingComponents`` 注册组件。 | 用 TDesign 做字段、校验、提示和列表空状态。 [TDesign 安装](https://github.com/Tencent/tdesign-miniprogram#安装) |
| **Taro + React** | ``npx @tarojs/cli init my-miniapp``，选 React + TypeScript。进入目录，按模板安装依赖，执行 ``npm run dev:weapp``。 | 修改 React 源码，在开发者工具验证微信目标产物。输出目录以项目配置为准，常见为 ``dist``。 [Taro 快速开始](https://docs.taro.zone/docs/GETTING-STARTED) |
| **uni-app + Vue** | ``npx degit dcloudio/uni-preset-vue#vite my-miniapp``，进入目录执行 ``npm install`` 和 ``npm run dev:mp-weixin``。 | 在源码里做一个 Vue 表单，在微信开发者工具导入 ``dist/dev/mp-weixin`` 验证。发行构建用 ``npm run build:mp-weixin``。 [DCloud CLI](https://uniapp.dcloud.net.cn/quickstart-cli.html) |
| **DCloud uni-agent** | 在支持的 HBuilderX／HBuilder V 中打开 AI 面板，按引导安装 uni-agent 并配置模型。 | 让它编译微信端并读取一次运行日志。适合 uni-app 或 uni-app x 项目。 [DCloud uni-agent](https://uniapp.dcloud.net.cn/ai/uni-agent.html) |
| **微信 Skyline Skills** | 已使用 Skyline 时执行 ``npx skills add wechat-miniprogram/skyline-skills``，在交互界面选择所用 Agent。 | 用 ``skyline-wxss`` 检查样式，用 ``skyline-worklet`` 指导交互动画，在 Skyline 模拟器及真机查看。 [官方 Skill 仓库](https://github.com/wechat-miniprogram/skyline-skills) |

### 设计、后端和低代码

| 资源 | 安装或接入 | 第一次让 AI 做什么 |
| --- | --- | --- |
| **Figma MCP** | 支持的客户端可装官方 Figma 插件；其它支持 OAuth 的客户端使用文档中的远程配置。端点为 ``https://mcp.figma.com/mcp``。在 Agent 内按提示登录。 | 提供具体画板链接，让 AI 获取设计结构和截图，用项目自己的 WXML/WXSS、Taro 或 uni-app 组件实现。先比对单个页面。 [官方安装](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/) · [设计上下文格式](https://developers.figma.com/docs/figma-mcp-server/server-returning-web-code/) |
| **MasterGo AI** | 在 MasterGo 中打开设计稿，通过官方 AI 或 MCP 入口接入，使用它生成的 MCP 地址和凭证。 | 挑一个页面，校验输出的代码形态、组件复用和微信模拟器效果。 [MasterGo AI](https://mastergo.com/ai) |
| **腾讯 CloudBase AI Toolkit** | 支持不同 Agent 的插件及 MCP 安装。参照官方页面选客户端；能运行 stdio 的客户端可用 ``npx -y @cloudbase/cloudbase-mcp@2.37.9`` 启动本地服务。首次按官方引导授权并选测试 EnvId。 | 先读取环境和云函数列表，再从登录、数据库、存储里选所需能力。 [连接 MCP](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/getting-started) · [各 Agent 插件](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/ai-agent-plugins) |
| **CloudBase 小程序 Skill** | 项目里用 ``npx skills add TencentCloudBase/skills --skill miniprogram-development``，选择客户端。依赖兄弟 Skill 的云开发任务可通过完整插件接入。 | 让 AI 结合微信工具跑小程序编译预览，再为测试环境生成最小云函数。 [小程序支持说明](https://docs.cloudbase.net/ai/cloudbase-ai-toolkit/plugins/miniprogram) · [安装页](https://www.skills.sh/tencentcloudbase/skills/miniprogram-development) |
| **CodeBuddy 微信开发者工具扩展** | 在支持扩展的微信开发者工具搜索并安装「腾讯云代码助手 CodeBuddy」。结合其 MCP 市场按需接 CloudBase。 | 在 IDE 内创建一个页面，并切到微信模拟器校验编译和布局。 [微信云开发指引](https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/guide/development-assistant.html) |
| **WorkBuddy 应用生成／扣子编程** | 用产品的「应用／创建小程序」入口输入需求，按平台流程预览。正式部署按微信账号绑定和审核流程办理。 | 用测试项目验收新增、保存和再次打开。如果未来要交给任意 Agent 本地维护，再验收源码、独立构建和后端数据迁移。 [腾讯 WorkBuddy 案例](https://cloudbase.cloud.tencent.com/blog/2026/09/28/workbuddy-miniprogram-cloudbase) · [扣子开发小程序](https://docs.coze.cn/guides_vibe_coding_miniapp) |

小程序**面向用户提供 AI**时，可按 CloudBase 文档使用 ``wx.cloud.extend.AI`` 调模型，或加 Agent UI 组件。微信的 ``ai-mode-skills`` 面向让微信里的 AI 调用你的业务，属于产品能力接入。 [CloudBase 小程序 AI](https://docs.cloudbase.net/ai/quickstart/miniprogram) · [微信 ai-mode-skills](https://github.com/wechat-miniprogram/ai-mode-skills)

## 5. 2D 和 3D 小游戏资源

### 5.1 原生 2D 与小游戏预览

- **原生 Canvas 2D + TypeScript**。在微信开发者工具新建「小游戏」，保留微信入口与配置。TypeScript 项目按自己的构建方式把生成的 JavaScript 写到入口对应目录，按需添加 ``npm i -D minigame-api-typings``。参考官方 Demo 的触摸、音频、存储用法，把计分和结算逻辑写成可独立测试的模块。 [微信小游戏 Demo](https://github.com/wechat-miniprogram/minigame-demo) · [小游戏类型](https://github.com/wechat-miniprogram/minigame-api-typings)
- **小游戏开发者助手**。VS Code 安装扩展 ID ``WeixinMiniGame.weixin-minigame-helper``，打开含 ``game.js`` 的目录，执行「小游戏：打开预览」。其它有 MCP 的 Agent 可使用第 3 节中的 npm 服务。先调用 ``run_game``，传 ``workspacePath`` 为含 ``game.js`` 的绝对目录。再用 ``get_logs``、``capture_screenshot`` 检查画面。做国内真机预览时按扩展提示配置小游戏 AppID、代码上传密钥和 IP 白名单。 [扩展说明及工具列表](https://marketplace.visualstudio.com/items?itemName=WeixinMiniGame.weixin-minigame-helper) · [独立 npm 包](https://www.npmjs.com/package/@weadmin/weixin-minigame-helper-mcp)
- **VaJoy 微信小游戏 Skill**。把仓库里的 ``skills/wx-minigame-helper/`` 整个复制到客户端的 Skill 目录，或用 Skills CLI 从该仓库选择这项技能。让 Agent 在写触摸、分包或音频前先查对应参考。 [社区 Skill 仓库](https://github.com/VaJoy/wx-minigame-helper)
- **Amition/minigame-engine**。面向编码 Agent 的开源 Canvas 2D 工程，可用来试验代码、测试、截图和构建闭环。克隆后按仓库要求准备 Node 和 pnpm 11，从根目录执行以下命令，再把 ``dist/wx`` 交给开发者工具。本轮核对了脚本定义，工程采用 MIT，适合先用小型原创玩法试跑。 [工程和命令](https://github.com/Amition/minigame-engine)

```bash
pnpm install
pnpm check
pnpm shot --scene play --device "iphone-se,iphone-14,ipad" --lint
pnpm build --target wx
```

- **Cinevva**。网页选择实验性的微信模式，先生成可玩的 Canvas 原型。产品专门公告把可导入微信开发者工具的导出器写为开发中，中文指南也说明了与 Cocos 的交接。适合快速评估手感和规则。 [模式公告](https://app.cinevva.com/news/2026-07-19-wechat-mini-game-mode) · [中文工作流](https://app.cinevva.com/zh-CN/china)

### 5.2 Cocos Creator 3.8 系列，兼顾 2D 和 3D

1. 安装 Cocos Dashboard 和 Creator 3.8 系列。创建 2D 或 3D 项目，先成功打开一个场景。
2. 需要 Agent 操作场景时，从 ``harady/cocos-creator-mcp`` 或 ``DaxianLee/cocos-mcp-server`` 选一款社区扩展。下例以 harady 为准，在 Cocos 工程根目录执行。

```bash
git clone https://github.com/harady/cocos-creator-mcp.git extensions/cocos-creator-mcp
cd extensions/cocos-creator-mcp
npm install
npm run build
```

3. 回 Creator，在扩展管理器启用并打开扩展面板，启动 MCP 服务。把面板实际地址录入第 3 节的 HTTP 配置。常见示例为 ``http://127.0.0.1:3000/mcp``。
4. 首次给 Agent 的任务是读取当前场景和节点树、截图，再修改一个测试节点的位置。检查编辑器实际值和文件改动。
5. Creator「项目 → 构建发布」选择「微信小游戏」，用微信开发者工具打开构建产物。3D 项目先测摄像机、纹理、音频和切后台恢复，再逐步增加场景和素材。 [Creator 下载入口](https://www.cocos.com/creator) · [harady 扩展安装](https://github.com/harady/cocos-creator-mcp#quick-start) · [DaxianLee 扩展](https://github.com/DaxianLee/cocos-mcp-server) · [微信构建](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/publish-wechatgame.html) · [微信端性能](https://docs.cocos.com/creator/3.8/manual/zh/editor/publish/ios/optimize.html)

本仓库的《早点凑一单》可从仓库根目录运行 `npm --prefix cocos-game run build:wechatgame`，生成 `cocos-game/build/wechatgame-breakfast-release/`。本机 Creator 路径及调试模式见[环境使用说明的构建章节](环境使用说明.md#构建微信小游戏)。

### 5.3 LayaAir，2D／3D 与官方 AI 工具

1. 安装 LayaAir IDE。按版本对应的官方教程，通过内置 Agent 或资源商店安装并启用项目的 **LayaAir MCP**。
2. 在相应版本 IDE 的 MCP 状态入口或控制台复制完整本地地址，常见形式为 ``http://127.0.0.1:18090/ai/mcp``。按第 3 节加到相应 Agent。
3. 知识库用 ``npx skills add layabox/layaair-skills``，只需要引擎 API 时选 ``layaair-api-knowledge``。首次让 Agent 读项目和场景，启动预览、截屏、读日志。
4. 发布面板选择微信小游戏，以当前 IDE 配置生成微信目标工程，再用微信开发者工具验证。LayaAir 文档里的 **CodingMCP** 另有通信密钥和服务接入流程，按它自己的安装页处理。 [本地编辑器 MCP 教程](https://ask.layaair.com/d/55863-layaair-mcp-shi-yong-jiao-cheng) · [官方 Skills](https://github.com/layabox/layaair-skills) · [CodingMCP 文档](https://github.com/layabox/LayaAir-Doc-ZH/blob/LayaAir3.4/src/content/docs/basics/developmentEnvironment/IDE-MCP/index.md) · [小游戏发布文档](https://layaair.com/3.2/doc/released/miniGame/readme.html)

### 5.4 Unity 6／团结引擎，适合已有 C# 工程

1. 先根据微信 SDK 文档选择支持的 Editor 和 Web/WebGL 构建模块。用一个空场景测试完整微信构建，再迁实际工程。适配 SDK 在 Editor 的「Window → Package Manager → + → Add package from git URL」添加下面地址，按 SDK 文档完成转换和配置。

```text
https://github.com/wechat-miniprogram/minigame-tuanjie-transform-sdk.git
```

2. **Unity Editor 的 AI 操作**走 Unity CLI。用 Homebrew 安装 CLI 后，在项目目录安装 Unity Pipeline，并按官方说明在支持的 Editor 中打开项目。CLI 的编辑器兼容性以 Unity 文档为准。微信 SDK 和团结引擎的兼容性单独确认。

```bash
brew install --cask unity-cli
unity --version
unity pipeline install
unity mcp configure --list
```

3. **Codex、Claude Code、Grok、Google Antigravity** 可选 Unity 官方 Agent 插件，获取 Unity Skills。Codex 示例见下方。**Cursor、VS Code 等其它客户端**可通过 ``unity mcp configure <客户端标识>`` 按官方支持列表配置，例如 ``unity mcp configure cursor``、``unity mcp configure vscode``。也可用 ``unity skill install <agent-name>`` 安装 CLI 对应的技能，Agent 有 shell 时可按技能直接调用 CLI。插件负责工作说明，CLI／Pipeline 负责实际操作 Editor。

```bash
codex plugin marketplace add Unity-Technologies/unity-agent-plugin
codex plugin add unity@unity-agent-plugin
```

4. 首次让 Agent 读取当前场景、添加一个立方体并运行 Play。然后走微信 SDK 的转换流程，用微信开发者工具打开产物，检查安卓与 iOS 真机的加载和输入。 [Unity CLI 安装](https://docs.unity.com/en-us/unity-cli/use-unity-cli) · [Unity MCP 客户端配置](https://docs.unity.com/en-us/unity-cli/replace-mcp-server-unity-cli) · [Unity Agent 插件](https://docs.unity.com/en-us/ai/unity-plugin/about-unity-plugin) · [Claude Code 安装](https://docs.unity.com/en-us/ai/unity-plugin/claude-code) · [微信 SDK](https://github.com/wechat-miniprogram/minigame-tuanjie-transform-sdk)

### 5.5 Godot 4，适合已有 GDScript 或想试社区路线

1. 从 ``AnranS/godot_for_minigame`` 的 Releases 选择和 Godot 版本匹配的插件 ZIP，解压到项目并启用。在 **Mini Game Export** 面板选微信小游戏，填 AppID 和输出目录，先导出项目自带示例。AppID 及版本兼容要求以插件文档为准。
2. 编辑器自动化可试社区 ``OREBRON/godot-mcp``。从 Releases 下载对应 OS/CPU 的 MCP 程序，按 README 把配套 ``addons/godot_mcp/`` 加到项目并启用。运行 ``godot-mcp config --project /path/to/your/project`` 生成配置，再按第 3 节登记为 stdio。若二进制未加入 PATH，直接使用其绝对路径。
3. 首次让 Agent 运行 GDScript 检查、读取场景树和运行日志。微信端先真机跑社区示例，再决定是否迁体积较大或使用特殊渲染效果的项目。 [Godot 微信导出插件](https://github.com/AnranS/godot_for_minigame/blob/main/README_zh.md) · [Godot 社区 MCP](https://github.com/OREBRON/godot-mcp)

## 6. AI 美术、音效和模型

| 资源 | 使用方式 | 第一次验收 |
| --- | --- | --- |
| **PixelLab** | 网页先试四向角色或地块。要接 Agent 时，在 MCP 页选择实际客户端，用生成的配置及个人 API Token 接入；端点为 ``https://api.pixellab.ai/mcp``。导出 PNG 精灵图或逐帧 PNG。 | 定好尺寸和锚点，做一个待机和行走动作，检查动画是否跳动、透明边缘是否干净。 [PixelLab MCP](https://www.pixellab.ai/mcp) · [客户端与导出](https://www.pixellab.ai/docs/ways-to-use-pixellab) |
| **ElevenLabs 音效** | 先用网页生成，批量时用其 API 或官方 quickstart 提供的 Skill。 | 导入两三个短音效，检查触发、音量和切后台后恢复。商用按所用套餐核对授权。 [音效文档和 Skill](https://elevenlabs.io/docs/eleven-api/guides/cookbooks/sound-effects) · [使用条款](https://elevenlabs.io/creative-terms) |
| **Meshy 3D** | 网页或 API 从文字／参考图生成道具，按所选引擎导出兼容格式。可以从 Meshy 的 GLB 输出开始，并按导入器需要转换。 | 只试一个模型，查材质、比例、面数、贴图体积和低端机帧率。 [Meshy API](https://docs.meshy.ai/en/api/text-to-3d) · [定价和授权](https://docs.meshy.ai/en/webapp/pricing) |

## 7. 测试、出包和团队交接

| 工具 | 安装 | 用法 |
| --- | --- | --- |
| **miniprogram-automator** | 小程序项目中 ``npm i -D miniprogram-automator`` | 把微信模拟器中的列表、表单和跳转做成 Node 可重复运行的断言脚本。 [微信官方自动化](https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/) |
| **miniprogram-simulate** | ``npm i -D miniprogram-simulate`` | 配合项目的测试框架验证原生小程序组件的属性、状态和事件。 [组件测试仓库](https://github.com/wechat-miniprogram/miniprogram-simulate) |
| **miniprogram-ci** | 在本地或 CI 工具项目安装 ``npm i -D miniprogram-ci`` | 用 ``ci.Project`` 指定项目产物目录、AppID、密钥文件和类型。小程序为 ``miniProgram``，小游戏为 ``miniGame``。先生成预览码，需要时再上传开发版本。上传密钥存入个人受控目录或 CI 密钥存储，并按工具要求设置 IP 白名单。 [微信 CI 文档](https://github.com/wechat-miniprogram/miniprogram-ci-dist#readme) |
| **WaterTian 微信开发者工具 MCP** | 社区备选。安装 uv；以 ``uvx wechat-devtools-mcp`` 作为 stdio 服务器，按 README 设置 ``WECHAT_DEVTOOLS_CLI`` 和 ``WECHAT_PROJECT_PATH``，再复制配套 Skill。 | 旧 CLI 工作流需要补小程序编译、截图和自动化时试用。先读服务器状态和工具版本。 [安装与环境变量](https://github.com/WaterTian/wechat-devtools-mcp) |

有多个 Agent 时，项目说明至少写清：项目类型、引擎或框架版本、源码和产物目录、构建命令、用哪套工具验收，以及预览和发布各自的权限。AppID 可以按项目分配，MCP Token、云环境凭证和代码上传私钥放在各自的本地配置或凭证存储。

### 可以直接交给任何 Agent 的首条任务

> 用本项目已安装的微信开发者工具 Skill 或 MCP，读项目配置，说明这是小程序还是小游戏，指出源码目录和微信构建目录。在本机完成一次构建，打开正确的产物并给我截图和本次运行的日志。
>
> 如果是小程序，走一次「列表 → 详情 → 返回」并确认数据。如果是 2D 小游戏，走一次「开局 → 计分 → 结算 → 重开」。如果是 3D 小游戏，导出一个可以旋转视角的最小场景，检查模型、触控和画面，准备真机预览。任务到本地验证为止。

### 装完后如何看结果

- **Skill**：客户端能列出技能，Agent 能准确说出引用的微信工具和项目目录。
- **MCP**：工具列表出现后，再真正调用一次状态查询或读取节点树，确认连接、权限和正确的项目窗口。
- **小程序**：微信模拟器完成路由与核心操作。有登录、录音、授权或业务数据时，再扫真机码验证真实链路。
- **2D 小游戏**：微信真机检查触控坐标、屏幕尺寸适配、声音、暂停和恢复。
- **3D 小游戏**：先在 iOS、Android 真机各跑最小场景，记录首屏启动、帧率、内存和包体，再决定素材和场景预算。

本机已核对微信开发者工具、官方 Skill 0.3.11、支持的 CLI 工具和配置格式所依赖的公开文档。手册内各客户端的示例用于配置和验收，涉及外部账户、安装、MCP 握手、微信真机或发布的操作留给实际项目执行。
