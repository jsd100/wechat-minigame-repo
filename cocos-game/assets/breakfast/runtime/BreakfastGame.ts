import {
    _decorator, AudioClip, AudioSource, Camera, Canvas, Color, Component, director, DirectionalLight, EffectAsset,
    EventTouch, Game, game, Input, input, Layers, Node, ResolutionPolicy, resources, sys, Texture2D, UITransform, Vec3, view,
} from 'cc';
import { LEVELS } from '../core/levels';
import { applyAction, createGame, getBlockers } from '../core/rules';
import type { GameAction, GameState, Rejection } from '../core/types';
import { layoutFooter } from './footer-layout';
import { OrderHud } from './OrderHud';
import { showHandoff } from './order-presentation';
import { loadProgress, recordWin, saveProgress } from './progress';
import type { Progress } from './progress';
import { FOOD_NAMES } from './StallArt';
import { StallBoard } from './StallBoard';
import { TapSequence } from './TapSequence';

const { ccclass, property } = _decorator;

@ccclass('BreakfastGame')
export class BreakfastGame extends Component {
    @property(EffectAsset)
    surfaceEffect: EffectAsset | null = null;

    @property(EffectAsset)
    unlitEffect: EffectAsset | null = null;

    @property(Texture2D)
    foodTexture: Texture2D | null = null;

    private board: StallBoard;
    private hud: OrderHud;
    private boardCamera: Camera;
    private canvas: Node;
    private state: GameState;
    private handoff: GameState | null = null;
    private progress: Progress;
    private curtain = false;
    private settingsOpen = false;
    private notice = '';
    private audio: AudioSource;
    private clips = new Map<string, AudioClip>();
    private busy = false;
    private background = false;
    private version = 0;
    private readonly taps = new TapSequence();
    private lastTakeFrame = -1;

    start(): void {
        view.setDesignResolutionSize(480, 854, ResolutionPolicy.FIXED_WIDTH);
        const scene = this.node.scene;
        this.boardCamera = scene.getChildByName('Main Camera').getComponent(Camera);
        this.boardCamera.projection = Camera.ProjectionType.ORTHO;
        this.boardCamera.clearColor = Color.fromHEX(new Color(), '#fbebce');
        this.boardCamera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
        this.boardCamera.visibility = Layers.Enum.DEFAULT;
        this.boardCamera.node.setPosition(0, 8.35, 8.65);
        this.boardCamera.node.lookAt(new Vec3(0, .16, -.98));

        const light = scene.getChildByName('Main Light').getComponent(DirectionalLight);
        light.node.setRotationFromEuler(-53, -35, 0);
        light.color = Color.fromHEX(new Color(), '#fff1dc');

        this.canvas = new Node('订单界面');
        this.canvas.layer = Layers.Enum.UI_2D;
        this.canvas.setParent(this.node);
        this.canvas.addComponent(UITransform);
        const uiCamera = new Node('界面相机');
        uiCamera.setParent(this.canvas);
        uiCamera.setPosition(0, 0, 1000);
        const camera = uiCamera.addComponent(Camera);
        camera.projection = Camera.ProjectionType.ORTHO;
        camera.near = 1;
        camera.far = 2000;
        camera.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
        camera.visibility = Layers.Enum.UI_2D;
        camera.priority = 10;
        this.canvas.addComponent(Canvas).cameraComponent = camera;
        const hudRoot = new Node('订单和操作');
        hudRoot.layer = Layers.Enum.UI_2D;
        hudRoot.setParent(this.canvas);

        if (!this.surfaceEffect || !this.unlitEffect || !this.foodTexture) {
            throw new Error('BreakfastGame requires both scene effects and the food atlas.');
        }
        this.board = new StallBoard(this.node, this.boardCamera, this.surfaceEffect, this.unlitEffect, this.foodTexture);
        this.hud = new OrderHud(hudRoot);
        this.hud.setIconAtlas(this.foodTexture);
        resources.load('breakfast-art/morning-stall/texture', Texture2D, (error, texture) => {
            if (!this.isValid) return;
            if (error) console.error('早餐摊背景加载失败', error);
            else this.board.setBackground(texture);
        });
        this.audio = this.addComponent(AudioSource);
        resources.loadDir('breakfast-audio', AudioClip, (error, clips) => {
            if (error || !this.isValid) return;
            for (const clip of clips) this.clips.set(clip.name, clip);
        });
        this.progress = loadProgress(sys.localStorage);
        this.board.reducedMotion = this.progress.reduceMotion;
        this.openLevel(this.progress.unlocked);
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_END, this.onTouch, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        game.on(Game.EVENT_HIDE, this.onHide, this);
        game.on(Game.EVENT_SHOW, this.onShow, this);
        view.on('canvas-resize', this.resize, this);
    }

    onDestroy(): void {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_END, this.onTouch, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        game.off(Game.EVENT_HIDE, this.onHide, this);
        game.off(Game.EVENT_SHOW, this.onShow, this);
        view.off('canvas-resize', this.resize, this);
        this.hud?.destroy();
        this.board?.destroy();
    }

    update(dt: number): void {
        this.board?.updateBackground(dt, !this.background);
    }

    private resize(): void {
        const { width, height } = view.getVisibleSize();
        this.boardCamera.orthoHeight = Math.max(4.22, 2.38 * height / width);
        this.board.resizeBackground(this.boardCamera.orthoHeight * 2 * width / height, this.boardCamera.orthoHeight * 2);
        const { trayLabelY, trayScale } = layoutFooter(width, height, sys.getSafeAreaRect(false).y);
        this.board.resizeTray(height, trayLabelY, trayScale);
        this.renderHud();
    }

    private openLevel(id: number): void {
        this.cancelPresentation();
        this.state = createGame(LEVELS[id - 1]);
        this.notice = '';
        this.curtain = false;
        this.board.load(this.state.level);
        this.board.render(this.state);
        this.resize();
    }

    private onTouchStart(event: EventTouch): void {
        if (!this.background) this.taps.begin(event.getID());
    }

    private onTouchCancel(event: EventTouch): void {
        this.taps.end(event.getID());
    }

    private onTouch(event: EventTouch): void {
        if (this.background || !this.state || !this.taps.end(event.getID())) return;
        const hudPoint = event.getUILocation();
        const action = this.hud.hit(hudPoint.x, hudPoint.y);
        if (action === 'ignore') return;
        if (action) {
            switch (action.type) {
                case 'next':
                    if (this.state.level.id < this.progress.unlocked) this.openLevel(this.state.level.id + 1);
                    return;
                case 'previous':
                    if (this.state.level.id > 1) this.openLevel(this.state.level.id - 1);
                    return;
                case 'sound':
                    this.progress = { ...this.progress, sound: !this.progress.sound };
                    saveProgress(sys.localStorage, this.progress);
                    this.renderHud();
                    return;
                case 'motion':
                    this.progress = { ...this.progress, reduceMotion: !this.progress.reduceMotion };
                    this.board.reducedMotion = this.progress.reduceMotion;
                    saveProgress(sys.localStorage, this.progress);
                    this.renderHud();
                    return;
                case 'settings':
                    this.settingsOpen = !this.settingsOpen;
                    this.renderHud();
                    return;
                default:
                    if (action.type === 'select' || action.type === 'restart' || action.type === 'undo') this.dispatch(action);
                    return;
            }
        }

        const frame = director.getTotalFrames();
        if (this.busy || this.lastTakeFrame === frame) return;
        const screenPoint = event.getLocation();
        const foodId = this.board.hit(screenPoint.x, screenPoint.y);
        if (!foodId) return;
        this.lastTakeFrame = frame;
        this.dispatch({ type: 'take', foodId });
    }

    private dispatch(action: GameAction): void {
        const before = this.state;
        const result = applyAction(before, action);
        if (result.rejection) {
            if (action.type === 'take') this.showRejection(result.rejection, action.foodId);
            return;
        }

        this.notice = '';
        this.state = result.state;
        if (action.type === 'restart' || action.type === 'undo') {
            this.cancelPresentation();
            this.curtain = false;
            this.board.render(this.state);
            this.renderHud();
            return;
        }
        if (action.type === 'select') {
            this.playSound('select');
            this.renderHud();
            return;
        }

        if (this.state.status === 'won') {
            this.progress = recordWin(this.progress, this.state.level.id, this.state.peakStaged, this.state.usedUndo);
            saveProgress(sys.localStorage, this.progress);
        }
        const generation = ++this.version;
        this.busy = true;
        const events = result.events;
        if (events.some(({ type }) => type === 'sealed')) this.playSound('sealed');
        else if (events.some(({ type }) => type === 'revealed')) this.playSound('reveal');
        else this.playSound(events[0]?.type === 'toTray' ? 'tray' : 'packed');
        this.board.play(result, () => {
            if (generation !== this.version) return;
            this.busy = false;
            this.handoff = null;
            this.curtain = this.state.status === 'won';
            this.renderHud();
        }, (orderId) => {
            if (generation !== this.version) return;
            this.handoff = showHandoff(before, result.state, orderId) ?? this.handoff;
            if (this.handoff) this.renderHud();
        });
    }

    private showRejection(reason: Rejection, foodId: string): void {
        if (reason === 'unavailable') return;
        if (reason === 'blocked') {
            const blockers = getBlockers(this.state, foodId);
            const names = this.state.level.foods.filter(({ id }) => blockers.indexOf(id) !== -1).map(({ kind }) => FOOD_NAMES[kind]);
            this.notice = `先拿走${names.join('、')}。`;
            this.board.highlight(blockers);
        } else {
            this.notice = reason === 'full' ? '暂存碟满了，试试直接给当前单配菜。' : '先点上方一张订单。';
        }
        if (reason === 'full') this.playSound('full');
        this.renderHud();
    }

    private playSound(cue: string): void {
        const clip = this.clips.get(cue);
        if (this.progress.sound && clip) this.audio.playOneShot(clip, 0.69);
    }

    private onHide(): void {
        this.background = true;
        this.cancelPresentation();
    }

    private onShow(): void {
        if (!this.state) return;
        this.background = false;
        this.curtain = this.state.status === 'won';
        this.board.render(this.state);
        this.resize();
    }

    private cancelPresentation(): void {
        this.version++;
        this.busy = false;
        this.handoff = null;
        this.taps.reset();
        this.board.cancelAnimations();
    }

    private renderHud(): void {
        this.hud.render(this.handoff ?? this.state, {
            unlocked: this.progress.unlocked, sound: this.progress.sound, reduceMotion: this.progress.reduceMotion,
            notice: this.notice, curtain: this.curtain, settingsOpen: this.settingsOpen,
        });
    }
}
