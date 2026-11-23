import { Color, Graphics, Label, Layers, Node, Rect, Sprite, SpriteFrame, sys, Texture2D, Tween, tween, UITransform, Vec3, view } from 'cc';
import { LEVELS } from '../core/levels';
import type { FoodKind, GameEvent, GameState, Needs } from '../core/types';
import { FOOD_ATLAS_CELL_SIZE, FOOD_CONTOURS } from './food-contours';
import { layoutFooter } from './footer-layout';
import { resolveHudHit } from './hud-hit';
import type { HitArea, HudAction, HudModal } from './hud-hit';
import { describeStuck } from './order-presentation';
import { FOOD_NAMES } from './StallArt';

interface HudOptions {
    unlocked: number;
    notice: string;
    curtain: boolean;
}

export type DialogView =
    | { type: 'settings'; sound: boolean; reduceMotion: boolean }
    | { type: 'help'; state: GameState; notice: string; reduceMotion: boolean };

const ink = '#38291f';
const jade = '#09665d';
const quiet = '#6d5946';
const outline = '#d5ac74';
const line = '#ab7954';
const seal = '#8e3825';
const paper = '#ffefcf';
const darkJade = '#08453f';
const cream = '#fff2d5';
const demoPositions = {
    egg: new Vec3(-145, 57, 0),
    rice: new Vec3(-108, 26, 0),
    tray: new Vec3(4, 28, 0),
    bag: new Vec3(128, 36, 0),
    orderB: new Vec3(151, 132, 0),
};

const tips: Record<number, string> = {
    1: '点台面上的豆浆和包子，凑齐这一单。',
    2: '点米糕放进暂存碟，看看后面藏着什么。',
    3: '两个小碟都有位置限制，先留意挡着蛋的米糕。',
    4: '看看挡住茶叶蛋的食物，再选先做哪一单。',
    5: '两张订单都能先做，试试少占一个暂存碟。',
    6: '两只包子长得一样，但摆的位置不同。',
    7: '先挪开米糕，看看第一单出餐后它会去哪儿。',
    8: '看看哪两件挡着茶叶蛋。',
    9: '两单都能先做，试试哪一单更省碟。',
    10: '左右各有一组挡着的食物，先看当前单要哪件。',
    11: '这一单要两只包子，哪两只能露出茶叶蛋？',
    12: '先看哪只包子挡着东西，再决定先出哪一单。',
};

export class OrderHud {
    private readonly areas: HitArea[] = [];
    private modal?: HudModal;
    private readonly icons = new Map<FoodKind, SpriteFrame>();
    private readonly boardRoot: Node;
    private readonly overlayRoot: Node;
    private drawRoot: Node;
    private dialogCard?: Node;
    private helpStamp?: Node;
    private helpBadge?: Sprite;
    private badgeFrame?: SpriteFrame;
    private readonly helpFoods = new Map<string, Node>();

    constructor(root: Node) {
        this.boardRoot = this.makeLayer(root, '关卡界面');
        this.overlayRoot = this.makeLayer(root, '弹窗');
        this.drawRoot = this.boardRoot;
    }

    setIconAtlas(texture: Texture2D): void {
        this.icons.forEach((icon) => icon.destroy());
        this.icons.clear();
        const size = FOOD_ATLAS_CELL_SIZE;
        for (const kind of Object.keys(FOOD_CONTOURS) as FoodKind[]) {
            const [x, y] = FOOD_CONTOURS[kind].cell;
            const frame = new SpriteFrame();
            frame.reset({ texture, rect: new Rect(x, y, size, size) });
            this.icons.set(kind, frame);
        }
    }

    destroy(): void {
        this.clearDialog();
        this.icons.forEach((icon) => icon.destroy());
        this.icons.clear();
        this.badgeFrame?.destroy();
    }

    setHelpBadge(texture: Texture2D): void {
        this.badgeFrame?.destroy();
        this.badgeFrame = new SpriteFrame();
        this.badgeFrame.reset({ texture });
        if (this.helpBadge) this.helpBadge.spriteFrame = this.badgeFrame;
    }

    hit(x: number, y: number): HudAction | 'ignore' | null {
        const size = view.getVisibleSize();
        return resolveHudHit(x - size.width / 2, y - size.height / 2, this.areas, this.modal);
    }

    render(state: GameState, options: HudOptions): void {
        this.clearChildren(this.boardRoot);
        this.areas.length = 0;
        const { width, height } = view.getVisibleSize();
        const safe = sys.getSafeAreaRect(false);
        const top = this.safeTop(height, safe.yMax);
        const cardY = top - 145;
        const footer = layoutFooter(width, height, safe.y);
        const { panel, left, right, previous, trayLabelY, trayLabelX } = footer;
        const inner = panel.w;
        this.hangingSign(top - 35, state);
        this.gear(inner / 2 - 22, top - 35);
        const helpX = -inner / 2 + 22;
        this.iconButton(helpX, top - 35);
        this.label('?', helpX, top - 34, 27, cream, 44, true);
        this.areas.push({ x: helpX, y: top - 35, w: 49, h: 49, action: { type: 'help' } });

        const cards = state.level.orders.length;
        const cardWidth = cards === 1 ? inner : (inner - 12) / 2;
        for (const [index, order] of state.level.orders.entries()) {
            const x = cards === 1 ? 0 : (index === 0 ? -1 : 1) * (cardWidth + 12) / 2;
            this.orderCard(x, cardY, cardWidth, order.id, order.needs, state);
        }

        for (const [index, x] of [-trayLabelX, trayLabelX].entries()) {
            const kind = state.level.foods.find(({ id }) => id === state.stagedFoodIds[index])?.kind;
            this.panel(x, trayLabelY, 76, 22, paper, '#a36d43', 6);
            this.label(kind ? FOOD_NAMES[kind] : `暂存 ${index + 1}`, x, trayLabelY, 12, seal, 76, true);
        }

        this.panel(0, panel.y - 3, inner, panel.h, darkJade, '#073832', 17, 2);
        this.panel(0, panel.y, inner, panel.h, '#103e35', '#578579', 16);
        const isStuck = state.status === 'stuck';
        const done = state.status === 'won';
        const message = options.notice || (isStuck ? describeStuck(state, FOOD_NAMES) : done ?
            `已出餐 · 暂存峰值 ${state.peakStaged} · ${state.usedUndo ? '已撤回' : '零撤回'}` : tips[state.level.id]);
        this.label(message, 0, footer.tipY, 16, isStuck ? '#ffc090' : cream, inner - 28, isStuck || done);

        if (done && state.level.id < LEVELS.length) {
            this.button({ ...left, action: { type: 'restart' } }, '再来一次');
            this.button({ ...right, action: { type: 'next' } }, '下一关', 'primary');
        } else {
            this.button({ ...left, action: state.canUndo ? { type: 'undo' } : undefined },
                state.usedUndo ? '撤回已用' : '撤回一步');
            this.button({ ...right, action: { type: 'restart' } }, '重开本关', isStuck ? 'primary' : 'main');
        }
        this.areas.push(panel);
        this.button({ ...previous, action: state.level.id > 1 ? { type: 'previous' } : undefined }, '‹  上一关', 'secondary');
        if (state.canSelectOrder) {
            this.panel(0, cardY - 69, 184, 24, darkJade, '#6aa28b', 11);
            this.label('点一张订单先做', 0, cardY - 69, 14, cream, 174, true);
        }
        if (state.level.id < options.unlocked && !done) {
            this.button({ x: inner * .39, y: cardY - 69, w: 103, h: 34, action: { type: 'next' } }, '下一关 ›', 'compact');
        }

        if (done && options.curtain) {
            this.panel(0, 9, 149, 121, darkJade, jade, 19);
            this.panel(0, 12, 139, 113, paper, '#d19f71', 14);
            this.panel(0, 25, 61, 58, '#fbe5c0', seal, 12, 2);
            this.label('齐', 0, 25, 39, seal, 85, true, true);
            this.label('热乎出摊', 0, -24, 16, seal, 100, true);
        }
    }

    private iconButton(x: number, y: number): void {
        this.panel(x, y - 2, 41, 41, darkJade, '#163e32', 15);
        this.panel(x, y, 41, 41, jade, '#d4e1bd', 15, 1.2);
    }

    private gear(x: number, y: number): void {
        this.iconButton(x, y);
        const drawing = this.node(x, y).addComponent(Graphics);
        drawing.fillColor = Color.fromHEX(new Color(), cream);
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            const radius = i % 4 === 1 || i % 4 === 2 ? 11 : 8.6;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) drawing.moveTo(px, py);
            else drawing.lineTo(px, py);
        }
        drawing.close();
        drawing.fill();
        drawing.fillColor = Color.fromHEX(new Color(), jade);
        drawing.circle(0, 0, 3.8);
        drawing.fill();
        this.areas.push({ x, y, w: 49, h: 49, action: { type: 'settings' } });
    }

    renderDialog(dialog?: DialogView, entering = false): void {
        this.clearDialog();
        if (!dialog) return;
        const { width, height } = view.getVisibleSize();
        const safe = sys.getSafeAreaRect(false);
        const top = this.safeTop(height, safe.yMax);
        const bottom = -height / 2 + Math.max(0, safe.y);
        const isHelp = dialog.type === 'help';
        const w = isHelp ? 426 : 308;
        const h = isHelp ? 510 : 222;
        const scale = Math.min(1, (width - 34) / w, (top - bottom - 64) / h);
        const x = isHelp ? 0 : Math.min(width - 43, 438) / 2 - w * scale / 2;
        const y = isHelp ? (top + bottom) / 2 : top - 66 - h * scale / 2;

        this.drawRoot = this.overlayRoot;
        const shade = this.node(0, 0).addComponent(Graphics);
        shade.fillColor = new Color(10, 34, 28, 173);
        shade.rect(-width / 2, -height / 2, width, height);
        shade.fill();
        const card = this.dialogCard = this.node(x, y);
        this.drawRoot = card;
        card.setScale(scale, scale, 1);
        this.panel(0, -6, w, h, darkJade, '#183c31', 24, 2);
        this.panel(0, 0, w, h, '#156156', '#abc3a0', 24, 2);
        this.panel(0, 0, w - 8, h - 8, paper, '#bd8155', 20, 1.5);
        const closeX = w / 2 - 31;
        const closeY = h / 2 - 30;
        this.label('×', closeX, closeY, 30, darkJade, 43);
        const controls: HitArea[] = [{ x: closeX, y: closeY, w: 47, h: 47, action: { type: 'close-dialog' } }];
        if (dialog.type === 'help') this.helpDialog(dialog, controls);
        else this.settingsDialog(dialog, controls);

        this.modal = {
            panel: { x, y: y - 2 * scale, w: w * scale, h: (h + 6) * scale },
            controls: controls.map((area) => ({
                ...area, x: x + area.x * scale, y: y + area.y * scale, w: area.w * scale, h: area.h * scale,
            })),
        };
        this.drawRoot = this.boardRoot;
        if (entering && !dialog.reduceMotion) {
            const start = scale * .95;
            card.setScale(start, start, 1);
            card.setPosition(x, y - 9, 0);
            tween(card).to(.22, { position: new Vec3(x, y, 0), scale: new Vec3(scale, scale, 1) }, { easing: 'backOut' }).start();
        }
    }

    private settingsDialog(options: Extract<DialogView, { type: 'settings' }>, controls: HitArea[]): void {
        const left = Label.HorizontalAlign.LEFT;
        this.label('小摊设置', -7, 68, 30, seal, 247, true, true, left);
        for (const row of [
            { title: '声音', y: 7, enabled: options.sound, detail: options.sound ? '开启 · 点食物、打包时有声音' : '关闭 · 安静开摊', action: { type: 'sound' } as const },
            { title: '动效', y: -60, enabled: !options.reduceMotion, detail: options.reduceMotion ? '精简 · 直接显示交互结果' : '完整 · 食物飞入、落碟、盖印', action: { type: 'motion' } as const },
        ]) {
            this.panel(0, row.y, 269, 59, '#fff7df', '#cda979', 12);
            this.label(row.title, -20, row.y + 10, 18, darkJade, 207, true, false, left);
            this.label(row.detail, -23, row.y - 12, 13, quiet, 201, false, false, left);
            this.panel(101, row.y, 43, 24, row.enabled ? jade : '#90785f', '#f5e2bf', 12);
            this.panel(101 + (row.enabled ? 9 : -9), row.y, 17, 17, cream, '#ffebc4', 9);
            controls.push({ x: 0, y: row.y, w: 269, h: 59, action: row.action });
        }
    }

    private helpDialog(dialog: Extract<DialogView, { type: 'help' }>, controls: HitArea[]): void {
        const { state } = dialog;
        const staged = state.stagedFoodIds.length > 0;
        const done = state.status === 'won';
        const left = Label.HorizontalAlign.LEFT;
        this.panel(-157, 197, 61, 61, '#f0d4a5', '#cba16f', 12);
        this.foodIcon('bun', -157, 197, true, 54);
        const badge = this.node(-157, 197);
        this.helpBadge = badge.addComponent(Sprite);
        this.helpBadge.sizeMode = Sprite.SizeMode.CUSTOM;
        this.helpBadge.spriteFrame = this.badgeFrame ?? null;
        badge.getComponent(UITransform).setContentSize(60, 60);
        this.label('小摊开工单', 5, 210, 33, seal, 241, true, true, left);
        this.label('动动手，帮小摊凑一单。', 5, 180, 16, darkJade, 241, false, false, left);

        this.demoOrder(-99, 'A 单', done ? '打包完成' : '茶叶蛋 1', 'teaEgg', !done);
        this.demoOrder(99, 'B 单', done ? '米糕已补上' : '米糕 1', 'riceCake', done);
        this.panel(0, 38, 382, 134, '#f1e4c8', '#bda47a', 13);
        this.panel(0, 41, 374, 124, '#fff2d8', '#ffedcb', 10);
        this.demoStations(done);

        if (!done) {
            const { egg, rice, tray } = demoPositions;
            if (staged) this.ellipse(egg.x, egg.y, 29, 35, '#f9e1ad', '#c19055');
            this.helpFoods.set('teaEgg', this.foodIcon('teaEgg', egg.x, egg.y, true, 79)!);
            const site = staged ? tray : rice;
            this.helpFoods.set('riceCake', this.foodIcon('riceCake', site.x, site.y, true, staged ? 57 : 86)!);
            if (!staged) controls.push({ x: rice.x + 5, y: rice.y, w: 69, h: 55, action: { type: 'help-take', foodId: 'riceCake' } });
            controls.push({ x: egg.x - 5, y: egg.y + 7, w: 58, h: 66, action: { type: 'help-take', foodId: 'teaEgg' } });
        }
        const message = dialog.notice || (done ? 'A 单打包！碟里的米糕也自动补进了 B 单。'
            : staged ? '茶叶蛋露出来了，点一下就能凑齐 A 单。' : '米糕挡住了茶叶蛋，先把米糕放到暂存碟。');
        this.label(message, 0, -57, 17, seal, 377, true);

        const action: HudAction = done ? { type: 'close-dialog' } : { type: 'help-take', foodId: staged ? 'teaEgg' : 'riceCake' };
        const button = { x: done ? -59 : 0, y: -108, w: done ? 254 : 372, h: 49 };
        this.panel(button.x, button.y - 3, button.w, button.h, darkJade, darkJade, 13);
        this.panel(button.x, button.y, button.w, button.h, '#145549', '#67a391', 13);
        this.label(done ? '回到摊位' : staged ? '拿茶叶蛋' : '试拿米糕', button.x, button.y, 20, cream, button.w, true);
        controls.push({ ...button, action });
        if (done) {
            this.panel(132, -108, 108, 49, '#fff5db', '#b78660', 12);
            this.label('再试一次', 132, -108, 16, darkJade, 96, true);
            controls.push({ x: 132, y: -108, w: 108, h: 49, action: { type: 'help-replay' } });
        }

        const tearLine = this.node(0, -148).addComponent(Graphics);
        tearLine.fillColor = Color.fromHEX(new Color(), '#b38964');
        for (let x = -181; x < 186; x += 9) tearLine.rect(x, 0, 5, 1.2);
        tearLine.fill();
        this.label('•  可以选单时，先点你想做的那张。', 0, -171, 15, ink, 365, false, false, left);
        this.label('•  当前单要的直接打包，其余先放进空碟。', 0, -194, 15, ink, 365, false, false, left);
        this.label('    有两个暂存碟，碟满也能拿当前单要的食物。', 0, -215, 15, ink, 365, false, false, left);
        this.label('•  每局可以撤回一步。', 0, -236, 15, ink, 365, false, false, left);
    }

    private demoOrder(x: number, title: string, text: string, kind: FoodKind, active: boolean): void {
        this.panel(x, 132, 182, 43, active ? '#145549' : '#f3dfb7', active ? '#6aa18f' : '#bd905e', 9);
        this.label(title, x - 58, 132, 16, active ? cream : darkJade, 48, true);
        this.label(text, x + 4, 132, 15, active ? cream : ink, 93);
        this.foodIcon(kind, x + 68, 132, true, 35);
    }

    private demoStations(done: boolean): void {
        this.ellipse(4, 9, 48, 17, '#a28a60', '#a28a60');
        this.ellipse(4, 13, 47, 17, '#137061', '#124b41');
        this.ellipse(4, 16, 42, 13, '#efe1bb', '#fff1d0');
        this.label('暂存碟', 4, -13, 14, darkJade, 76);
        const bag = this.panel(128, 36, 68, 57, '#eac38a', '#ad7e53', 5);
        bag.angle = 5;
        this.panel(128, 57, 56, 2, '#ad7e53', '#ad7e53', 0).angle = 5;
        this.label('打包袋', 128, -13, 14, darkJade, 76);

        const stamp = this.helpStamp = this.node(128, 35);
        stamp.angle = 12;
        const parent = this.drawRoot;
        this.drawRoot = stamp;
        this.ellipse(0, 0, 19, 19, '#efcb97', seal);
        this.label('齐', 0, 0, 22, seal, 36, true, true);
        this.drawRoot = parent;
        stamp.active = done;
    }

    private ellipse(x: number, y: number, rx: number, ry: number, fill: string, stroke: string): void {
        const g = this.node(x, y).addComponent(Graphics);
        g.fillColor = Color.fromHEX(new Color(), fill);
        g.strokeColor = Color.fromHEX(new Color(), stroke);
        g.lineWidth = 1.6;
        g.ellipse(0, 0, rx, ry);
        g.fill();
        g.ellipse(0, 0, rx, ry);
        g.stroke();
    }

    playHelp(events: readonly GameEvent[], cue: (name: string) => void, onReady: () => void): void {
        const card = this.dialogCard;
        if (!card) return;
        const sequence = tween(card);
        for (const event of events) {
            if (event.type === 'toTray') {
                sequence.call(() => this.moveHelpFood(event.foodId, demoPositions.tray, .36, .68))
                    .delay(.36).call(() => cue('tray'));
            } else if (event.type === 'revealed') {
                sequence.call(() => cue('reveal'));
            } else if (event.type === 'toOrder') {
                const intoBag = event.orderId === 'A';
                const target = intoBag ? demoPositions.bag : demoPositions.orderB;
                sequence.call(() => this.moveHelpFood(event.foodId, target, .35, .26)).delay(.35);
            } else if (event.type === 'sealed' && event.orderId === 'A') {
                sequence.call(() => {
                    const stamp = this.helpStamp!;
                    stamp.active = true;
                    stamp.setScale(1.4, 1.4, 1);
                    tween(stamp).to(.19, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
                    cue('sealed');
                }).delay(.20);
            }
        }
        sequence.call(onReady).start();
    }

    nudgeHelpRice(): void {
        const rice = this.helpFoods.get('riceCake');
        if (!rice) return;
        tween(rice).to(.08, { angle: -9 }).to(.08, { angle: 7 }).to(.09, { angle: 0 }).start();
    }

    settleHelpRice(): void {
        const rice = this.helpFoods.get('riceCake');
        if (!rice) return;
        rice.setScale(1.08, .91, 1);
        tween(rice).to(.18, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' }).start();
    }

    private moveHelpFood(foodId: string, target: Vec3, duration: number, size: number): void {
        const food = this.helpFoods.get(foodId);
        if (!food) return;
        Tween.stopAllByTarget(food);
        const peak = food.position.clone().lerp(target, .45);
        peak.y += 25;
        tween(food)
            .to(duration * .42, { position: peak, angle: -10 }, { easing: 'quadOut' })
            .to(duration * .58, { position: target, scale: new Vec3(size, size, 1), angle: 0 }, { easing: 'quadIn' })
            .start();
    }

    private clearDialog(): void {
        if (this.dialogCard) {
            Tween.stopAllByTarget(this.dialogCard);
            this.dialogCard.children.forEach((child) => Tween.stopAllByTarget(child));
        }
        this.clearChildren(this.overlayRoot);
        this.dialogCard = undefined;
        this.modal = undefined;
        this.helpStamp = undefined;
        this.helpBadge = undefined;
        this.helpFoods.clear();
    }

    private hangingSign(y: number, state: GameState): void {
        for (const x of [-83, 83]) this.panel(x, y + 47, 6, 41, '#954027', '#f2c185', 3);
        this.panel(0, y - 4, 282, 74, '#063f37', '#164b3c', 24, 2);
        this.panel(0, y, 282, 74, '#0b7667', '#6ead9d', 22, 2);
        this.panel(0, y + 1, 263, 60, '#fee8bd', '#c98147', 17, 2);
        this.panel(0, y + 1, 249, 50, '#ffeecc', '#b96b42', 13);
        this.label('早点凑一单', 0, y + 9, 30, seal, 246, true, true);
        this.label(`第 ${state.level.id} 关　${state.level.title}`, 0, y - 17, 13, quiet, 235, true);
        for (const x of [-83, 83]) this.panel(x, y + 30, 8, 8, '#c88946', '#8a482b', 4);
    }

    private orderCard(x: number, y: number, width: number, id: string, needs: Needs, state: GameState): void {
        const active = state.activeOrderId === id;
        const remains = state.remainingByOrder[id];
        const done = !(Object.keys(remains) as FoodKind[]).some((kind) => remains[kind] > 0);
        const tab = done ? '已封袋' : active ? '当前' : state.canSelectOrder ? '先做这单' : '待做';
        this.panel(x, y - 4, width, 108, darkJade, darkJade, 13);
        this.panel(x, y, width, 108, active ? '#14796c' : '#ffdfb3', active ? '#8fd0b6' : '#fff0d2', 13, 2);
        this.panel(x, y, width - 11, 97, paper, '#b97049', 9, 1.4);
        this.label(`${id} 单`, x - width * .32, y + 35, 12, seal, 48, true);
        this.label(tab, x + width * .24, y + 35, 12, done ? seal : quiet, width * .43, active || done);

        const foods = Object.keys(needs) as FoodKind[];
        const spacing = Math.min(93, (width - 12) / foods.length);
        for (const [i, kind] of foods.entries()) {
            const at = x + (i - (foods.length - 1) / 2) * spacing;
            this.foodIcon(kind, at, y - 1, Boolean(remains[kind]));
            this.label(remains[kind] ? `${FOOD_NAMES[kind]} ${remains[kind]}` : `${FOOD_NAMES[kind]} ✓`, at, y - 37,
                foods.length === 3 ? 12 : 13, remains[kind] ? ink : quiet, spacing + 4);
        }
        this.areas.push({ x, y, w: width, h: 108, action: state.canSelectOrder ? { type: 'select', orderId: id } : undefined });
    }

    private foodIcon(kind: FoodKind, x: number, y: number, remaining: boolean, size = 61): Node | undefined {
        const frame = this.icons.get(kind);
        if (!frame) return;
        const icon = this.node(x, y);
        const sprite = icon.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = frame;
        sprite.color = new Color(255, 255, 255, remaining ? 255 : 112);
        icon.getComponent(UITransform).setContentSize(size, size);
        return icon;
    }

    private button(area: HitArea, title: string, style: 'main' | 'primary' | 'secondary' | 'compact' = 'main'): void {
        const { x, y, w, h, action } = area;
        if (style === 'compact') {
            this.panel(x, y, w * .81, 25, darkJade, '#578579', 11);
            this.label(title, x, y, 13, cream, w);
        } else if (style === 'secondary') {
            this.panel(x, y, w, h - 8, darkJade, '#578579', 12);
            this.label(title, x, y, 15, action ? cream : '#a0b0a2', w);
        } else {
            const primary = style === 'primary';
            this.panel(x, y, w, h, primary ? '#a64d32' : '#ffeece', primary ? '#e9a67b' : line, 13);
            this.label(title, x, y, 18, primary ? cream : action ? ink : '#8b7763', w, Boolean(action));
        }
        this.areas.push(area);
    }

    private panel(x: number, y: number, w: number, h: number, fill: string, stroke: string, radius: number, lineWidth = 1): Node {
        const node = this.node(x, y);
        const g = node.addComponent(Graphics);
        g.fillColor = Color.fromHEX(new Color(), fill);
        g.strokeColor = Color.fromHEX(new Color(), stroke);
        g.lineWidth = lineWidth;
        g.roundRect(-w / 2, -h / 2, w, h, radius);
        g.fill();
        g.roundRect(-w / 2, -h / 2, w, h, radius);
        g.stroke();
        return node;
    }

    private label(text: string, x: number, y: number, size: number, tone: string, width: number, bold = false, serif = false,
        align = Label.HorizontalAlign.CENTER): void {
        const node = this.node(x, y);
        node.getComponent(UITransform).setContentSize(width, size * 1.42);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size * 1.22;
        label.color = Color.fromHEX(new Color(), tone);
        if (serif) label.fontFamily = 'Songti SC, STSong, serif';
        label.isBold = bold;
        label.horizontalAlign = align;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
    }

    private node(x: number, y: number): Node {
        const node = this.makeLayer(this.drawRoot);
        node.setPosition(x, y, 0);
        node.addComponent(UITransform);
        return node;
    }

    private makeLayer(parent: Node, name?: string): Node {
        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        node.setParent(parent);
        return node;
    }

    private clearChildren(parent: Node): void {
        for (const child of [...parent.children]) {
            child.removeFromParent();
            child.destroy();
        }
    }

    private safeTop(height: number, safeYMax: number): number {
        return height / 2 - Math.max(21, Math.min(75, height - safeYMax + 13));
    }
}
