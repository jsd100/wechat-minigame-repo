# 《摊位凑一单》小样验收记录

> 历史记录：本文的 `cocos-game/` 和命令均对应当时目录。当前工程入口以 [README](../../../README.md) 和 [多游戏目录迁移说明](../../monorepo-migration.md) 为准，不以旧命令验收新工程。

## T1.1 · 进行中

- 源码根目录为 `cocos-game/`。现有 `main.scene` 是空场景，工作区安装了 Node 24 和 TypeScript 5.9.3。
- Git 尚无初始提交，且本次会话的 `.git` 只读。直接在当前工作区实现。执行技能的 `task-start` 只识别英文任务标题，以下记录按现有计划的 `Tn.n` 编号维护。
- 接口核对通过。任务 2 和 3 共用任务 1 的规则，任务 5 沿用任务 3 的格位、命中和事件，任务 4 的发布目录由任务 5、6 复用。
- 下一步为 T1.2，先观察规则断言失败。

## T1.1–T1.4 · 通过

- 改动 `assets/breakfast/core/types.ts`、`rules.ts` 和 `tests/breakfast.test.cjs`（均相对于 `cocos-game/`）。
- 用计划中的严格 TypeScript 编译和 `node --test` 观察到占位规则的 7 个预期失败。实现后为 7 通过、0 失败。
- 下一步 T2.1，验证首六关与最低暂存峰值。

## T2.1–T2.3 · 通过

- 新增 `cocos-game/assets/breakfast/core/levels.ts` 和 `cocos-game/tests/levels.test.cjs`。四个关卡测试先红后绿，全套 11 通过、0 失败。
- 枚举最低暂存峰值为 `[0]`、`[1]`、`[1]`、`[null, 0]`、`[1, 2]`、`[1, 0]`。第 3 关已复验满格撤回，第 4 关已复验重开换单，第 6 关外露包子先取最低占两个碟。
- 下一步 T3.1。Cocos MCP 的 `cocos://project/info`、`cocos://scene/hierarchy` 已读取，微信 IDE 0.3.11 状态检查成功，登录有效。

## T3.1–T3.4 · 模拟器路径通过

- 通过 Cocos MCP 在 `cocos-game/assets/main.scene` 创建并保存 `Breakfast Game` 节点。`surfaceEffect` 引用 Cocos 内置标准材质效果。首次构建的控制台报告材质 Pass 缺失，原因是动态按名查找的特效没有成为构建依赖。绑定效果后重新构建、取物成功。
- 调试构建日志为 `.tooling/local/breakfast-stall/debug-build.log`。微信模拟器复验第一关取物、第二关自动换单和第三关满格后撤回。第 4 关由正常入口到达，A 卡住、重开、B 零暂存通关分别记录在 `gray-level4-a-stuck.png`、`gray-level4-open.png`、`gray-level4-b-won.png`。
- 使用 Cocos MCP 的 `debug_preview` 启动 Creator 编辑器预览。异常规则的主要交互证据采用微信模拟器截图及程序测试。

## T4.1–T4.3 · 本地发布包通过，真机待测

- 新增 `cocos-game/build.wechatgame.release.json`，沿用目标 AppID 及 portrait，关闭 debug。空置场景的首次小样发布包按文件加总为 6,053,242 字节，超出计划预算。去掉未用的两种物理、Spine、骨骼动画、序列编辑器动画等模块和默认天空盒贴图，保留 Canvas、3D、几何射线、图形、缓动和声音后，六种占位食品的发布目录为 2,596,013 字节。
- 发布产物含 `game.js`、`game.json`、`project.config.json`，`game.json` 无分包。以上以发布目录原始文件大小之和测量，未记录 IDE 计费口径。构建日志见 `gray-release-build.log`、`gray-release-trimmed.log`，发布版模拟器的首屏及取物见 `trimmed-preview.png`、`trimmed-interaction.png`。记录均在 `.tooling/local/breakfast-stall/`。
- 未接入可由本会话操作的 Android 或 iPhone，真机冷启动、触控、音效和后台恢复待验证。

## T5.1–T5.3、T6.1–T6.2 · 实现已接入

- 搪瓷台面、茶叶蛋、包子、米糕、豆浆、玉米、花卷均由 Cocos 网格生成。对应模型可在 `StallArt.ts` 修改并共享网格、材质，无额外的外部 FBX、贴图或字体依赖。蒸笼、纸袋架、布巾在 `StallBoard.ts` 组装。这是替换原方案导入独立模型的实现决定，后续可替换造型层并继续复用关卡和命中数据。音频为本项目生成的六个单声道短 WAV，放在 `cocos-game/assets/resources/breakfast-audio/`。
- 第 4 关按正式模型调整玉米、花卷坐标，让三件挡物从不同位置压住茶叶蛋的轮廓。规则数据与关卡解法保持一致。
- 存档测试 4 项先红后绿。接入关卡解锁、最低暂存、免撤回记录和两个独立设置。复验 `sys.localStorage` 时以模拟器刷新前后为证据。
- 独立评审发现两项交互问题。多指错峰抬起会重复提交，已增加主触点跟踪与重开/后台失效处理，3 项回归先红后绿。自动换单时此前并行飞入所有食物，已按规则事件依次播放并在移入暂存品前切换订单卡，相关回归先红后绿。
- 下一步 T5.4、T6.3，重建最后一版并跑正式模型交互，再记录真实的设备与玩家可用性。

## T5.4、T6.3 · 交付构建及六关模拟器通过

- 最终 Cocos 微信发布模式构建于 2026-11-20 16:12 完成。产物位于 `cocos-game/build/wechatgame-breakfast-release/`，为竖屏且包含六条音频。无分包，目录内 38 个文件合计 2,651,601 字节。命令退出 `36` 与本机 Creator 的成功约定一致，实查完成日志和产物时间。
- 微信开发者工具刷新后保留已解锁第六关和静音设置。通过正常界面回到第一关，六关全部完成并取得结算截图。第二关验证双碟已满但仍可取茶叶蛋，随后自动归位两件并结算。第三关验证满格、撤回和续关。第四关验证先 A 卡住、重开、茶叶蛋提示三件挡物、先 B 通关。第五关两序列分别达到暂存峰值 1 和 2。第六关分别取到外露与挡蛋包子后通关，峰值 0。
- 同次验收的证据位于 `.tooling/local/breakfast-stall/`。可从 `verified-level4.png` 看正式画面，`verified-level4-a-stuck.png` 与 `verified-level4-b-won.png` 比较择单结果，`verified-level6-won.png` 查看最终结算。最终构建日志 `final-release-build.log`，模拟器回归日志 `final-smoke.log`，控制台 `final-console.log`，当前捕获没有 Error 级日志。
- 严格 TypeScript 编译后运行 `node --test cocos-game/tests/*.test.cjs`，19 通过、0 失败。纯模块编译入口使用计划中的命令，另外把 `runtime/progress.ts`、`runtime/TapSequence.ts`、`runtime/order-presentation.ts` 加入编译输入。Cocos 运行脚本也使用 Creator 3.8.8 的声明类型完成 ES2015 语法和类型核对。
- 真实 Android/iPhone 上的冷启动、帧率、触控、音频和切后台，以及实机录屏和约 10 人试玩等待设备及玩家。模拟器证据仅覆盖这台 Mac 上的微信工具。整体变更处于原工作区，未提交 Git 或上传微信版本。

## T6.4 · 首轮试玩记录项

到场后使用同一发布模式构建。先记录设备、微信版本和网络，再记录每位玩家是否在 10 秒内首次有效操作、独立通过第 1 关、能否解释第 4 关卡住的原因、自愿再开，以及卡在何处。用实际参与人数作为分母。实机录屏用第 4 关的「先 A 卡住 → 重开 → 先 B 通关」路线，给镜头保留关卡标题和两张订单。

## 美术重做 · 2026-11-20

- 以用户确认的 [enamel-v1.png](../specs/assets/breakfast-stall/enamel-v1.png) 和旧版第 2 关实际截图为对照。新版使用固定镜头环境背景、逐件可动的 3D 食物、接触阴影、搪瓷凹碟和边框、牛皮纸袋、挂匾式关卡页和独立食品图标。蒸汽层随时间轻微变化，开启减少动效时停用。
- 原创网格位于 [BreakfastMesh.ts](../../../cocos-game/assets/breakfast/runtime/BreakfastMesh.ts)。包子为连续褶面，蛋壳裂线有不规则分布，米糕和玉米将逐粒造型合并到各自的网格。实装模型约 9,200–26,100 三角面每种，高于早期占位预算。真机帧率和内存仍待验证，后续可根据实测减面。
- 用内置 ImageGen 生成两份位图资产。背景提示为 9:16 原创中国早餐摊，重点保留红白棚布、玻璃柜、竹蒸笼、晨光与无食物、无文字、无凹孔的宽奶油色工作台，成品为 [morning-stall.jpg](../../../cocos-game/assets/resources/breakfast-art/morning-stall.jpg)。订单图标提示为 3×2 透明底实物图，按顺序画豆浆、包子、茶叶蛋、米糕、玉米和花卷，使用一致的四十五度镜头与晨光，成品为 [food-icons.png](../../../cocos-game/assets/resources/breakfast-art/food-icons.png)。
- 16:40 的本地微信发布模式构建完成。目录合计约 3.38 MB，无分包。项目仍沿用已配置的小游戏 AppID。严格规则测试 19 项通过，Cocos 脚本类型检查通过。模拟器截图和控制台放在 `.tooling/local/breakfast-stall/`。
- 最终构建实走第 2 关，点露出的茶叶蛋收到遮挡提示，米糕进入左碟后蛋露出，A 封袋后米糕自动进入 B，两单完成时显示两只新纸袋。最终版本第 4 关先 A 卡住，重开后点蛋显示三件挡物，先 B 通关。对照主图为 `art-latest-level2.png`，暂存为 `art-latest-level2-tray.png`，两单完成为 `art-latest-level2-won.png`，第 4 关结算为 `art-latest-level4-won.png`。最终日志为 `art-release-build.log` 和 `art-latest-console.log`。

## 设置弹窗与食品图集还原 · 2026-11-20

- 右上角齿轮打开设置弹窗，底部两项设置入口已移除。声音与动效各有独立开关，沿用原有本地存档字段。点关闭按钮或遮罩可返回台面，遮罩上的点击由弹窗处理。
- 六种台面食品与订单图标共用 `food-icons.png`。`cocos-game/tools/bake-food-contours.py` 提取图集轮廓，`FoodRelief.ts` 构造闭合、有厚度的网格，点击采用实际网格的最近射线命中。材质保留图集的颜色和光照细节，造型按游戏的固定俯视镜头制作。替换图集后，从仓库根目录运行 `python3 cocos-game/tools/bake-food-contours.py` 更新轮廓，脚本依赖 ImageMagick。
- Creator 3.8.8 在 17:14 完成本地微信发布模式构建，产物位于 `cocos-game/build/wechatgame-breakfast-release/`。目录含 43 个文件，共 3,395,028 字节，竖屏且无分包。Cocos 脚本类型检查通过，自动测试 22 项通过。
- 微信开发者工具验证了第 6 关食品外观、齿轮开窗和点遮罩关闭而不取走食品。对应截图为 `atlas-food-pass-1.png`、`atlas-settings-open.png` 和 `atlas-settings-outside.png`。设置开关的微信端复测因自动审批额度用尽而中断。
- Cocos 本地浏览器预览实点通过声音和动效独立切换、刷新后保留、点关闭按钮及遮罩退出。第 6 关先做 B，分别点取两只包子后以暂存峰值 0 通关。对应截图为 `atlas-preview-settings.png` 和 `atlas-preview-level6-won.png`。上述截图位于 `.tooling/local/breakfast-stall/`。

## 底部操作区适配 · 2026-11-20

- 撤回、重开和上一关统一为 56 设计单位高，绘制与点击共用布局。上一关居中，底边加上系统安全区和额外留白。3D 暂存碟和标签随屏幕比例调整，较短的屏幕会缩小暂存盘。
- 执行 `npm --prefix cocos-game run build:wechatgame` 生成微信发布包。本轮 Cocos 脚本类型检查通过，24 项自动测试通过。对照 420×933（模拟 34 像素底部安全区）和 360×640 的本地预览核查布局。
- 微信模拟器从第 6 关点上一关按钮边缘回到第 5 和第 4 关。第 4 关选 A、取米糕、点撤回和重开的边缘，验收食品落碟、复位和订单重新可选。证据位于 `.tooling/local/breakfast-stall/` 的 `footer-wx-level4.png`、`footer-wx-staged.png`、`footer-wx-undone.png` 和 `footer-wx-restarted.png`。本轮未实测手机。
- 后续微调将「上一关」收为 148×36 的可见按钮，保留 44 高的触控区。撤回和重开保持 56 高，底部面板下移 24 设计单位。已重新构建并通过 24 项测试，微信模拟器点「上一关」右下边缘从第 6 关返回第 5 关。新版对照见 `footer-compact-wx-level6.png` 和 `footer-compact-wx-level5.png`。

## 台面食品与暂存碟间距 · 2026-11-20

- 在 589×1280 的微信模拟器复现第 3 关包子与空碟边缘重叠。修复用实际网格在固定镜头下的投影计算间距，必要时统一后移台面食物及阴影，使食物之间的遮挡与命中保持一致。回归覆盖首六关、四种视口和底部安全区组合，25 项自动测试与 Cocos 脚本类型检查通过。
- 新版微信包实测第 3 关。点空碟后订单与食品状态没有变化。点包子直接补 A 单，点米糕才进入左碟，撤回后米糕回到台面并再次挡住蛋。证据为 `tray-overlap-level3-original.png`、`tray-clearance-level3-initial.png`、`tray-clearance-level3-staged.png` 和 `tray-clearance-level3-undo.png`，位于 `.tooling/local/breakfast-stall/`。本轮待真机复测。

## 第 7–12 关与两件新品 · 2026-11-20

- 第 7–9 关沿用六种食物。第 10 关接入短油条，第 11 关接入半截蒸红薯，第 12 关同时使用两种新品。每关 5–7 件，图集为 768×768，原有六格 RGBA 像素逐字节一致。新品源图由 ImageGen 制作，两种食物沿用现有固定视角与暖光。修改图集后从仓库根目录执行 `python3 cocos-game/tools/bake-food-contours.py`。
- 33 项自动测试和 Cocos 类型检查通过。发布包由 `npm --prefix cocos-game run build:wechatgame` 生成，43 个文件合计 3,500,205 字节。微信模拟器从已有通关存档接到第 7 关，实点到第 12 关并零暂存结算。第 8 关先错拿花卷，验证满碟提示会说出还在台面上的挡物，并可撤回。第 10、11 关分别验证油条和红薯入碟后还能顺利换单。
- 证据位于 `.tooling/local/breakfast-stall/`。`expansion-wx-start.png` 是旧存档进入第 7 关，`expansion-wx-level8-stuck-fixed.png` 是卡关提示，`expansion-wx-oil-staged.png` 与 `expansion-wx-potato-staged.png` 是新品入碟，`expansion-wx-level12.png` 与 `expansion-wx-level12-won.png` 是末关开局和结算。
- 在 360×640 和接近微信模拟器比例的 Cocos 本地预览中实点完成新增关卡，第 9 关两种择单分别得到暂存峰值 0 和 2。带大上下安全区的极短竖屏仍需检查订单卡是否遮住食物。未进行手机及玩家试玩。

## 排障手册实跑 · 2026-11-20

- 按[开发排障与测试手册](../../开发排障与测试手册.md)直接执行 Cocos MCP 只读查询、发布构建、TypeScript 检查和 33 项自动测试。Playwright 的示例在 Creator 本地浏览器环境中点开齿轮并截图，确认预览工具栏需要在脚本里隐藏，避免它截走短视口的触控。
- 本轮微信工具最初报告触控成功，但截图连续返回旧结算帧。看完控制台后重新触发一次刷新，用 612×1330 原始 PNG 确认已开新局。同一格式下实点第 12 关 A 单、将油条放进左碟，再撤回至原位。记录位于本机 `.tooling/local/breakfast-qa.VRmYd4/`，关键文件为 `05-recovery.png`、`06-staged.png`、`07-undo.png`、`creator-settings.png`、`build.log` 和 `console-final.json`。

## 小摊开工单与设置 · 2026-11-20

- Cocos Creator 3.8.8 完成微信发布包构建，TypeScript 检查和 35 项自动测试通过。CLI 日志记录第二个 Cocos MCP 实例的 3000 端口冲突，已打开的 Creator MCP 可读本工程与主场景，CLI 构建成功结束。
- 微信模拟器逐步验证点问号、点被挡茶叶蛋、米糕入碟、茶叶蛋露出、盖「齐」章、自动补 B 单和重玩。设置可点整行切换，关闭动效后可以直接做完同一试玩。两项开关刷新后保留，随后已恢复原偏好。
- 第 7 关把米糕放入左碟后，打开帮助并操作试玩，再点遮罩退出。退出后 A 单进度和左碟米糕仍在。正式关的 A 单封袋后，米糕自动补入 B 单，两单最终领到「热乎出摊」结算。
- 证据位于本机 `.tooling/local/breakfast-interactions.DmTB5X/`。`02-help.jpg` 至 `06-replay.jpg` 是完整帮助流程，`14-persisted-settings.jpg` 是设置刷新后状态，`18-level7-tray.jpg`、`20-level7-resumed.jpg`、`21-level7-handoff.jpg` 和 `22-level7-won.jpg` 是第 7 关验收。微信控制台的错误关键词过滤没有命中。本轮未实测手机。
