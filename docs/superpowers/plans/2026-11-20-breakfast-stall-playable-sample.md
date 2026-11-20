# 《摊位凑一单》首个可玩小样 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 Cocos 工程交付一个可在微信中试玩的六关小样，用搪瓷早餐摊验证「先做哪单」是否好懂、有趣。

**Architecture:** TypeScript 规则模块独立处理选单、取物、暂存、换单和撤回。Cocos 主场景把关卡数据映射为一个固定镜头的 3D 摊位和一套竖屏界面。先用占位物跑通关键盘面与微信打包，再替换为正式模型并采集试玩数据。

**Tech Stack:** Cocos Creator 3.8.8 LTS、TypeScript、微信开发者工具、Node 24 的 `node:test` 和工作区已有的 TypeScript 5.9.3。

**Spec:** [《摊位凑一单》玩法与美术设计稿](../specs/2026-11-20-breakfast-stall-design.md) · [项目环境使用说明](../../../环境使用说明.md)

## 接手与恢复

**初始恢复点** 开工后从 **T1.1** 开始，开工后的状态以验收记录为准。本页提供实现步骤，设计稿的交付边界及第二、三、四节定义玩法、盘面和画面。用户的最新明确决定优先。文档有差异时先查原文并修正引用，继续其他不受影响的步骤。涉及改规则、改关卡或扩范围的差异，记录后交由用户决定。

1. **先核对现场。** 接手、上下文压缩或中断后，重读 [项目约定](../../../AGENTS.md)、本节、当前任务及其引用的设计稿段落。读取验收记录并核对实际文件、场景和 `git status --short`，包括 Git 未追踪的文件。已存在的文件继续补齐，已确认且证据仍有效的步骤继续向后。
2. **从第一个未验证步骤继续。** 以稳定编号 `T1.1` 至 `T6.4` 定位。已有代码但无当前验收时，先复跑该步的验证，再判断是否需要改代码。旧截图、同一场景的空壳运行、命令退出成功和口述结果各自只能证明实际观察到的内容。
3. **留下可续跑的记录。** 从实施开始在 `docs/superpowers/verification/2026-11-20-breakfast-stall-sample.md` 追加简短记录。每个验证节点和交接前更新一次。勾选表示该步的验收已完成。缺设备、扫码权限、玩家或账号条件时写「待验证」及所需条件，完成依赖之外的可执行工作。

每条记录使用同一格式，运行证据目录用实际路径。交接时读最后一条有效记录即可找到下一步。

```text
步骤与状态：Tn.n · 通过 / 进行中 / 待验证
已改文件：实际路径，场景修改写到节点或资源
验证结果：命令或操作、实际观测、当次日志或截图路径
待办与下一步：未验证项及原因；下一个步骤编号
```

## Global Constraints

- 使用 `cocos-game/`、既有小游戏 AppID 和竖屏配置。主场景沿用 `cocos-game/assets/main.scene`。通过 Cocos 编辑器或 MCP 保存场景、预制体和对应的 `.meta`。
- 小样为 1 个完整摊位、6 种食物、6 关。常规关无倒计时，每局两个暂存碟、一次免费撤回。首轮免费、单机，无充值。
- 按已确认的 B 版奶油色搪瓷台面、青釉边，搭配 A 版暖晨光、竹蒸笼。交互区内的轮廓和点按反馈优先于装饰细节。
- 第 2–5 关先用占位物验证。正式模型制作前，六种食品各用一个不同轮廓的占位预制体做发布模式包体检查。所有运行证据来自该阶段的新构建。
- 公开测试版的其余 6 种食品、12 关、两套陈设及每日题/收藏由试玩结果决定，另拟实施计划。小样的验证使用本地构建及扫码预览，开发版本上传、提审、发布按当次授权办理。
- 所有命令从工作区根目录执行。撰写计划时 `.git` 为只读，仓库尚无初始提交。按执行时的权限及授权处理提交，范围限于该任务的明确文件和相应 `.meta`。

## 里程碑验收

| 完成步骤 | 验收证据与后续入口 |
| --- | --- |
| T1–T2 | 正式规则和六关枚举通过，结果与设计稿第三节一致。用同一实现接入场景。 |
| T3 | 本次微信调试构建的第 4 关可重现 A 卡住、重开选 B 通关；记录关卡和订单的实际变化。 |
| T4 | 带六种占位食物的发布模式包经过主包测量和微信模拟器复验，之后进入批量美术。早期真机能做就做，缺设备时记录待验证。 |
| T5–T6 | 正式美术的六关小样可构建与试玩，保留可复验的本地证据。两款真机、试玩人数和视频均分别记录实测或待验证状态。公开测试版另行决策。 |

## Review Focus

- 两碟满了仍能取当前订单需要的食物，走不下去才进入卡住状态（任务 1）。
- 撤回导致换单的那一步时，同时恢复上一单、碟内顺序、阻挡和暂存峰值；撤回第一步可重新选单（任务 1）。
- 两个相同包子仍按各自的位置判断遮挡，先取外露包子会改变第 6 关的最少暂存（任务 2）。
- 多点、重复输入和切后台时，一次触摸只提交一笔取物。重开后旧动画不能改变新盘面（任务 3）。
- 第 4 关点前景与点茶叶蛋露出的一角有不同反馈，换正式模型后仍能分别命中三件挡物（任务 3、5）。

## 文件安排

| 文件或目录 | 职责 |
| --- | --- |
| `cocos-game/assets/breakfast/core/types.ts`、`rules.ts` | 关卡契约、规则动作和快照。纯 TypeScript，使用相对导入。 |
| `cocos-game/assets/breakfast/core/levels.ts` | 六关配置、订单、格位和遮挡。 |
| `cocos-game/assets/breakfast/runtime/BreakfastGame.ts` | Cocos 入口、触摸与游戏生命周期、动作与演出的衔接。 |
| `cocos-game/assets/breakfast/runtime/StallBoard.ts`、`OrderHud.ts` | 3D 命中与动效、2D 界面和按钮。 |
| `cocos-game/assets/breakfast/runtime/progress.ts` | 小样的本地关卡进度、最好成绩和设置。 |
| `cocos-game/assets/main.scene`、`cocos-game/assets/breakfast/art/` | 3D 摊位、订单界面、食品和场景预制体、材质、图标、声音。 |
| `cocos-game/tests/breakfast.test.cjs`、`cocos-game/tests/levels.test.cjs`、`cocos-game/tests/progress.test.cjs` | Node 规则、关卡枚举及存档测试，位于 Cocos `assets/` 之外。 |
| `cocos-game/build.wechatgame.release.json` | 小样的本地发布模式配置，产出 `cocos-game/build/wechatgame-breakfast-release/`。 |
| `docs/superpowers/verification/2026-11-20-breakfast-stall-sample.md` | 执行时填写构建记录、设备、交互和试玩观察。运行截图和日志存入 `.tooling/local/breakfast-stall/`。 |

## 任务 1 完成可独立测试的订单与暂存规则

**文件** `core/types.ts`、`core/rules.ts`、`cocos-game/tests/breakfast.test.cjs`。

**接口** `FoodKind` 用 `soyMilk | bun | teaEgg | riceCake | corn | flowerRoll`。`Level` 含 `id`、`mode: 'fixed' | 'choose'`、`orders`、`foods`。每件 `Food` 有 `id`、`kind`、`slot`（三维坐标元组）、`blockedBy`（食品 ID 列表）。每张 `Order` 有唯一 `id` 与按种类计数的 `needs`。在 `rules.ts` 导出以下纯函数。

```ts
createGame(level: Level): GameState
applyAction(state: GameState, action: GameAction): ActionResult
getBlockers(state: GameState, foodId: string): readonly string[]
```

`GameAction` 为 `{ type: 'select', orderId }`、`{ type: 'take', foodId }`、`{ type: 'undo' }`、`{ type: 'restart' }`。`GameState` 暴露 `level`、`activeOrderId: string | null`、`remainingByOrder`、`boardFoodIds`、`stagedFoodIds`、`peakStaged`、`canUndo`、`usedUndo`、`canSelectOrder` 和 `status: 'awaitingChoice' | 'playing' | 'stuck' | 'won'`。自由关未选单时状态为 `awaitingChoice`，选单后为 `playing`，首步成功后才锁定。`won` 无当前单，`canUndo` 与 `canSelectOrder` 均为 `false`。`ActionResult` 含 `state`、事件及可选拒绝原因。事件由规则生成，动画依次消费。

```ts
type GameEvent =
  | { type: 'toOrder'; foodId: string; orderId: string }
  | { type: 'toTray'; foodId: string }
  | { type: 'revealed'; foodId: string }
  | { type: 'sealed'; orderId: string };
```

`getBlockers` 只返回仍在台面的挡物 ID。对台面取物，已取、未知 ID 或非取物状态用 `unavailable`；自由关未选单用 `chooseOrder`；受阻用 `blocked`；确需入碟且两碟满用 `full`。被拒动作保留已有状态、撤回快照和选择权限，事件为空。`toOrder` 同时用于从台面直接入单与换单后的自动归位。

- [x] **T1.1 写规则断言。** `full trays still allow direct fulfillment` 断言容量满时需求项仍可进单；`switch drains trays in insertion order and wins` 断言自动归位顺序与直接通关；`undo switch restores both orders, trays and blockers` 断言恢复两单、碟、遮挡和峰值并标记已用撤回。再覆盖未选单时点食物、非法点击不锁单、首个成功取物锁单、撤回首步重新开放、重复取物无变化、死局、重开和通关结算后撤回不改变成绩。
- [x] **T1.2 确认红灯。** 定义接口后执行下方命令，检查在缺失规则时核心断言失败。
- [x] **T1.3 实现规则。** 按设计稿第二节的顺序原子变更，自动换单和暂存归位在同一次动作内完成。卡住复用取物合法性。只对成功取物维护前一步快照，只有进行中或卡住可撤回。通关结算、重开和撤回均按设计稿的边界处理。
- [x] **T1.4 跑绿灯并记录。** 执行下方命令，预期 `fail 0`。记录运行命令及通过的断言数。

```bash
breakfast_test_dir=$(mktemp -d)
.tooling/node_modules/.bin/tsc --strict --module commonjs --target ES2022 \
  --rootDir cocos-game/assets/breakfast --outDir "$breakfast_test_dir" \
  cocos-game/assets/breakfast/core/*.ts &&
BREAKFAST_TEST_DIR="$breakfast_test_dir" node --test cocos-game/tests/breakfast.test.cjs
```

测试用 `require(require('node:path').join(process.env.BREAKFAST_TEST_DIR, 'core/rules.js'))` 加载编译产物。任务 2 完成后，在同一命令末尾加入 `cocos-game/tests/levels.test.cjs`。

## 任务 2 录入首六关并验证每条路线

**文件** `core/levels.ts`、`cocos-game/tests/levels.test.cjs`。**接口** 导出 `LEVELS: readonly Level[]`，每关按顺序使用数字 ID `1` 至 `6`。任务 3、5 使用 `Food.slot`（`[x, y, z]`）定位。每件普通食品的 ID 用其 `FoodKind` 值，同关重复的两个包子用表明位置的 ID。订单 `id` 固定 `A` 和 `B`，单订单仅有 `A`。

- [x] **T2.1 写关卡枚举断言并观察失败。** 以 `applyAction` 枚举每张允许开局选择的订单和每条合法的取物顺序。最少暂存峰值依次为 `[0]`、`[1]`、`[1]`、`[null, 0]`、`[1, 2]`、`[1, 0]`，`null` 表示没有通关路径。第 6 关先 A、先点外露包子时最优值为 2。按设计稿第三节逐条复跑示例路线，撤回仅用于指定的第 3 关复验。
- [x] **T2.2 录入盘面。** 逐行照设计稿第三节录入订单与挡物。第 6 关使用 `bun-under-rice` 和 `bun-visible`。每件食物指定独立格位，第 4 关在三侧摆挡物，留出蛋的一小块可点区域。需要改变构图时调整坐标和碰撞代理，保留订单、食品及挡物数据。
- [x] **T2.3 验证数据与解法。** 断言食品 ID 唯一、挡物引用有效且无环、食品与订单数量一致。运行任务 1 的测试命令并加入 `levels.test.cjs`，预期 `fail 0`。保存枚举摘要及第 3 关卡住和撤回复验结果。

## 任务 3 接入 Cocos 场景，形成可玩的占位版

**文件** `runtime/BreakfastGame.ts`、`StallBoard.ts`、`OrderHud.ts`、`cocos-game/assets/main.scene`、`art/food/` 中六个占位预制体及 `.meta`。

**接口** `StallBoard.load(level: Level): void`、`StallBoard.hit(screenX: number, screenY: number): string | null`、`StallBoard.render(state: GameState): void`、`StallBoard.play(result: ActionResult, onReady: () => void, onSeal: (orderId: string) => void): void`、`StallBoard.cancelAnimations(): void`。`OrderHud.render(state: GameState, options: HudOptions): void`，订单、撤回、重开按钮由 `BreakfastGame` 派发规则动作。`onSeal` 用于在暂存归位前呈现换单，`onReady` 在移物、揭露和订单显示一致后触发。

- [x] **T3.1 挂载一套可复用场景。** 用 Cocos MCP 核对工程和 `main.scene`，配置约 40–45° 固定正交镜头、6 种可区分占位物和碰撞代理。Canvas 安全区内上方放订单、下方放两个暂存碟。布置「当前」「待做」、剩余需求、撤回、重开、下一关。
- [x] **T3.2 实现命中和动作衔接。** `BreakfastGame` 是规则的唯一派发方。HUD 和 `StallBoard` 只读取返回的状态和事件。按相机近到远选可见食品代理；被挡食物露出的一角触发挡物提示。一次触摸上抬进入规则，上笔移物与揭露完毕才受理下笔。换关、撤回、重开和切后台取消旧回调；回到前台按当前状态重绘，已成功的操作只应用一次。封袋可以并行。
- [ ] **T3.3 在 Creator 预览复验异常路径。** 复跑第三节第 3、4、5 关路线。连点同一食物和两指同帧点不同食物，都只接受一次有效动作。刚自动换单时重开，等待旧动画时长后盘面仍为新局。切后台与恢复时核对订单和台面从最新状态同步。
- [x] **T3.4 构建并验收微信交互。** 按环境说明用 `cocos-game/build.wechatgame.json` 生成 `cocos-game/build/wechatgame/`。用当前截图取坐标，调用 `wechatide -c codex automation_game_action`，从游戏正常入口到第 4 关。用设计稿顺序复现先 A 卡住及重开选 B 通关。一并保存选单前、卡住、通关截图和本次日志。自动化返回点击成功后仍以订单、暂存和通关画面的实际变化为验收。

## 任务 4 提早检查发布包与设备入口

**文件** `cocos-game/build.wechatgame.release.json`；确有优化需要时经 Creator 修改 `cocos-game/settings/v2/packages/engine.json`。**接口** 本地发布目录为 `cocos-game/build/wechatgame-breakfast-release/`，微信开发者工具打开这个目录。

- [x] **T4.1 创建发布配置。** 复制现有构建配置，保留目标平台、AppID 和 portrait，把 `debug` 设为 `false`，把 `outputName` 设为 `wechatgame-breakfast-release`。仍用六种占位食品在同一场景出包。
- [x] **T4.2 构建并测本次产物。** 先记录实际构建日志和退出码。Creator 命令在本机曾以 `36` 成功退出，仍须核对完成日志及新产物 `game.js`、`game.json`、`project.config.json`。微信 IDE 打开已核对的发布目录，记录 IDE 显示的主包大小、分包和第 4 关交互。按设计稿的 4 MB 主包限制检查，超过时先核查引擎功能，再查资源布局。物理模块变动后复验第 4 关四个可点落点。
- [ ] **T4.3 跑一次设备入口。** 有可扫码的微信设备时验证启动、触控及后台恢复。其他情况记「真机待验证」，保留本轮模拟器交互和主包测量，可继续后续美术。

```bash
mkdir -p "$PWD/.tooling/local/breakfast-stall" &&
breakfast_run_dir=$(mktemp -d "$PWD/.tooling/local/breakfast-stall/release.XXXXXX") &&
npm --prefix cocos-game run build:wechatgame >"$breakfast_run_dir/build.log" 2>&1
```

打包脚本将 Creator 的成功退出码 `36` 转为 `0`，并检查三个微信入口文件。核对本次日志和新产物后，再打开发布目录。[构建用法](../../../环境使用说明.md#构建微信小游戏)

```bash
wechatide -c codex open_project_window \
  --project "$PWD/cocos-game/build/wechatgame-breakfast-release" --window-mode fullMode
```

## 任务 5 把搪瓷晨市与反馈接入六关

**文件** `art/food/`、`art/stall/`、`art/ui/`、`art/audio/`、`runtime/StallBoard.ts`、`runtime/OrderHud.ts`、`main.scene` 及 `.meta`。**接口** 维持任务 3 的预制体映射、格位和规则，按模型新轮廓调碰撞代理及相机。

- [x] **T5.1 先验证三个食品和摊位底稿。** 以 B 的台面与青釉边、A 的晨光和竹蒸笼为依据，先导入米糕、茶叶蛋、包子，并从同一角度渲染订单图标。约 360 逻辑像素宽下要能辨别三种轮廓、订单和暂存，能从露出的一角看出蛋被遮挡。建模使用可编辑 3D 源及 glTF/FBX，按执行机器选择工具。
- [x] **T5.2 补齐食品、场景和图标。** 加豆浆、玉米、花卷，共交付 6 个主预制体、6 个统一角度图标、3 件背景摆设（蒸笼、纸袋架、布巾）。贴图从共享 1024 级图集起步。正式第 4 关复验三件挡物都能取、点露出的蛋只提示挡物。记录模型出处和使用许可。
- [x] **T5.3 加可观察的反馈。** 取物、落碟、露出、满格、封袋各有可见状态，加约 6 个短音效。移物从 140–240 ms、封袋从 400–550 ms 试起。纸袋折口后盖「齐」印。减少动效保留结果。正式设置在 T6.2 接入后一起复验。
- [x] **T5.4 在微信重验全套模型。** 重新运行 T4.2。约 360 逻辑像素宽截图能看清两张订单、两只碟和主要食物。按设计稿第 6 关走一条取到两只包子的路线。核对主包、截图及正式模型上的玩法结果。

## 任务 6 保存小样进度并组织首轮试玩

**文件** `runtime/progress.ts`、`runtime/BreakfastGame.ts`、`runtime/OrderHud.ts`、`cocos-game/tests/progress.test.cjs` 和运行验收记录。**接口** `loadProgress(storage: StoragePort): Progress`、`saveProgress(storage: StoragePort, progress: Progress): void`、`recordWin(progress: Progress, levelId: number, peakStaged: number, usedUndo: boolean): Progress`。`StoragePort` 只含 `getItem`、`setItem`。Cocos 接入时传 `sys.localStorage`，存档键为 `breakfast-stall.progress.v1`。

- [x] **T6.1 写存档测试并跑红灯。** `missing or malformed save starts at level 1`、`winning unlocks next level and keeps best score`、`settings survive restart`、`a storage error allows play to continue`。断言同关保留更低暂存峰值，曾无撤回通关的标记保持。编译时在 T1.4 的输入中添加 `cocos-game/assets/breakfast/runtime/progress.ts`，测试加载 `runtime/progress.js`，三个测试文件共用临时产物目录。
- [x] **T6.2 实现存档并跑绿灯。** 初次启动开放第 1 关，通关开放下一关，最多 6 关，可重玩已开放关。声音和动效独立切换。损坏或写入失败时允许继续本局，默认设置可正常显示。命令输出 `fail 0` 后，在 Creator 或微信重启后复验已开关卡、免撤回记录及声音/动效设置。开着静音与减少动效各过第 2、4 关。
- [ ] **T6.3 复验交付构建与真机。** 同一发布模式构建在模拟器过六关，复验重开和已存进度。真机使用一台较低配置 Android、一台日常 iPhone，各记录三次冷启动到首次可操作、帧率区间、触控、切后台恢复及系统、网络条件。目标是稳住 30 FPS、常见设备约 5 秒可操作，目标与实测分别记录。设备或扫码条件不足时写明待验证项。
- [ ] **T6.4 录实机片并做首轮观察。** 录约 15 秒竖屏第 4 关实机视频，按「你会先做哪张？」、先 A 卡住、重开先 B 通关剪辑。设备或玩家未到位时先准备走查表并记录待验证。约 10 位大陆微信用户试玩首关和第 3–5 关，记录 10 秒内首次有效操作、独立过首关、自愿再开的实际人数和分母。参考目标为 7 人首关独立通过、5 人自愿再开；根据观察决定后续调整。视频按授权范围保存在本地。

## 交付检查

- [x] 占位版能在微信模拟器展示第 4 关的选择差异。正式版第一关至第六关均可通，保留一套可以重新核对的日志与截图。
- [x] 美术验收体现搪瓷台面、晨光、竹蒸笼和清楚的食物轮廓。物料达到 1 个摊位、6 种食品和 6 关。
- [ ] 发布模式主包、真机设备、试玩人数和未验证项全部以运行记录为准。小游戏使用本地试玩入口，公开测试版是否扩量依据这轮观察。
