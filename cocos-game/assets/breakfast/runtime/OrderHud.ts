import { Color, Graphics, Label, Layers, Node, Rect, Sprite, SpriteFrame, sys, Texture2D, UITransform, view } from 'cc';
import { LEVELS } from '../core/levels';
import type { FoodKind, GameState, Needs } from '../core/types';
import { FOOD_ATLAS_CELL_SIZE, FOOD_CONTOURS } from './food-contours';
import { layoutFooter } from './footer-layout';
import { resolveHudHit } from './hud-hit';
import type { HitArea, HudAction, HudModal } from './hud-hit';
import { describeStuck } from './order-presentation';
import { FOOD_NAMES } from './StallArt';

interface HudOptions {
    unlocked: number;
    sound: boolean;
    reduceMotion: boolean;
    notice: string;
    curtain: boolean;
    settingsOpen: boolean;
}

const ink = '#38291f';
const jade = '#09665d';
const quiet = '#6d5946';
const outline = '#d5ac74';
const line = '#ab7954';
const seal = '#8e3825';
const paper = '#ffefcf';
const darkJade = '#08453f';
const cream = '#fff2d5';

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

    constructor(private readonly root: Node) {}

    setIconAtlas(texture: Texture2D): void {
        this.destroy();
        const size = FOOD_ATLAS_CELL_SIZE;
        for (const kind of Object.keys(FOOD_CONTOURS) as FoodKind[]) {
            const [x, y] = FOOD_CONTOURS[kind].cell;
            const frame = new SpriteFrame();
            frame.reset({ texture, rect: new Rect(x, y, size, size) });
            this.icons.set(kind, frame);
        }
    }

    destroy(): void {
        this.icons.forEach((icon) => icon.destroy());
        this.icons.clear();
    }

    hit(x: number, y: number): HudAction | 'ignore' | null {
        const size = view.getVisibleSize();
        return resolveHudHit(x - size.width / 2, y - size.height / 2, this.areas, this.modal);
    }

    render(state: GameState, options: HudOptions): void {
        for (const child of [...this.root.children]) {
            child.removeFromParent();
            child.destroy();
        }
        this.areas.length = 0;
        this.modal = undefined;
        const { width, height } = view.getVisibleSize();
        const safe = sys.getSafeAreaRect(false);
        const top = height / 2 - Math.max(21, Math.min(75, height - safe.yMax + 13));
        const cardY = top - 145;
        const footer = layoutFooter(width, height, safe.y);
        const { panel, left, right, previous, trayLabelY, trayLabelX } = footer;
        const inner = panel.w;
        this.hangingSign(top - 35, state);
        this.gear(inner / 2 - 22, top - 35);

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
        if (options.settingsOpen) this.settings(inner / 2 - 118, top - 140, width, height, options);
    }

    private gear(x: number, y: number): void {
        this.panel(x, y - 2, 41, 41, darkJade, '#163e32', 15);
        this.panel(x, y, 41, 41, jade, '#d4e1bd', 15, 1.2);
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

    private settings(x: number, y: number, viewWidth: number, viewHeight: number, options: HudOptions): void {
        const shade = this.node(0, 0).addComponent(Graphics);
        shade.fillColor = new Color(12, 26, 19, 106);
        shade.rect(-viewWidth / 2, -viewHeight / 2, viewWidth, viewHeight);
        shade.fill();

        const w = 236;
        const h = 154;
        this.panel(x, y - 4, w, h, darkJade, darkJade, 17);
        this.panel(x, y, w, h, jade, '#aac4a1', 17, 1.7);
        this.panel(x, y, w - 12, h - 12, paper, '#bf885e', 13);
        this.label('设置', x - 73, y + 45, 20, seal, 55, true, true);
        this.panel(x + 88, y + 47, 24, 24, '#f1d8ae', '#d6a476', 10);
        this.label('×', x + 88, y + 47, 22, seal, 24, true);
        this.panel(x, y + 25, 188, 1, '#d4ac81', '#d4ac81', 0);

        const controls: HitArea[] = [{ x: x + 88, y: y + 47, w: 40, h: 39, action: { type: 'settings' } }];
        for (const row of [
            { label: '声音', at: y + 1, enabled: options.sound, off: '关闭', action: { type: 'sound' } as HudAction },
            { label: '动效', at: y - 41, enabled: !options.reduceMotion, off: '精简', action: { type: 'motion' } as HudAction },
        ]) {
            this.label(row.label, x - 72, row.at, 16, ink, 53, true);
            this.label(row.enabled ? '开启' : row.off, x + 21, row.at, 13, quiet, 48);
            this.panel(x + 71, row.at, 45, 24, row.enabled ? jade : '#b78c6b', '#f3dbac', 12);
            this.panel(x + 71 + (row.enabled ? 10 : -10), row.at, 16, 16, cream, '#f4ce99', 8);
            controls.push({ x, y: row.at, w: 188, h: 36, action: row.action });
        }
        this.modal = { panel: { x, y, w, h }, controls };
    }

    private hangingSign(y: number, state: GameState): void {
        for (const x of [-83, 83]) this.panel(x, y + 47, 6, 41, '#954027', '#f2c185', 3);
        this.panel(0, y - 4, 282, 74, '#063f37', '#164b3c', 24, 2);
        this.panel(0, y, 282, 74, '#0b7667', '#6ead9d', 22, 2);
        this.panel(0, y + 1, 263, 60, '#fee8bd', '#c98147', 17, 2);
        this.panel(0, y + 1, 249, 50, '#ffeecc', '#b96b42', 13);
        this.label('摊位凑一单', 0, y + 9, 30, seal, 246, true, true);
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

    private foodIcon(kind: FoodKind, x: number, y: number, remaining: boolean): void {
        const frame = this.icons.get(kind);
        if (!frame) return;
        const icon = this.node(x, y);
        const sprite = icon.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = frame;
        sprite.color = new Color(255, 255, 255, remaining ? 255 : 112);
        icon.getComponent(UITransform).setContentSize(61, 61);
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

    private panel(x: number, y: number, w: number, h: number, fill: string, stroke: string, radius: number, lineWidth = 1): void {
        const g = this.node(x, y).addComponent(Graphics);
        g.fillColor = Color.fromHEX(new Color(), fill);
        g.strokeColor = Color.fromHEX(new Color(), stroke);
        g.lineWidth = lineWidth;
        g.roundRect(-w / 2, -h / 2, w, h, radius);
        g.fill();
        g.roundRect(-w / 2, -h / 2, w, h, radius);
        g.stroke();
    }

    private label(text: string, x: number, y: number, size: number, tone: string, width: number, bold = false, serif = false): void {
        const node = this.node(x, y);
        node.getComponent(UITransform).setContentSize(width, size * 1.42);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size * 1.22;
        label.color = Color.fromHEX(new Color(), tone);
        if (serif) label.fontFamily = 'Songti SC, STSong, serif';
        label.isBold = bold;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
    }

    private node(x: number, y: number): Node {
        const node = new Node();
        node.layer = Layers.Enum.UI_2D;
        node.setParent(this.root);
        node.setPosition(x, y, 0);
        node.addComponent(UITransform);
        return node;
    }
}
