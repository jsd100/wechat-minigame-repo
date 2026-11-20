import { Camera, EffectAsset, geometry, gfx, Mesh, MeshRenderer, Node, Texture2D, Tween, tween, Vec3 } from 'cc';
import type { ActionResult, Food, GameEvent, GameState, Level } from '../core/types';
import { boardDepthOffset, projectYBounds } from './board-spacing';
import { FOOD_SIZE, StallArt } from './StallArt';

const TRAY_DEPTH = 3.91;
const TRAY_SPACING = 1.03;
const TRAY_FRONT = .87;
const TRAY_LIP_HEIGHT = .05;
const TRAY_LABEL_CLEARANCE = 18;
const TRAY_DEPTH_RATIO = .78;
const PLATE_HEIGHT = .09;
const packedScale = new Vec3(0.08, 0.08, 0.08);
const boardScale = new Vec3(1, 1, 1);

interface FoodDisplay {
    readonly node: Node;
    readonly home: Vec3;
    readonly baseDepth: number;
    readonly projectedBottom: number;
    readonly mesh: Mesh;
    readonly marker: Node;
    readonly shadow: Node;
}

export class StallBoard {
    private readonly art: StallArt;
    private readonly cameraUp: Vec3;
    private readonly foodRoot = new Node('食品');
    private readonly display = new Map<string, FoodDisplay>();
    private readonly foodBottomByMesh = new WeakMap<Mesh, number>();
    private readonly ray = new geometry.Ray();
    private readonly localRay = new geometry.Ray();
    private state?: GameState;
    private readonly counter: Node;
    private readonly trayRack = new Node('暂存盘');
    private trayTop = 0;
    private readonly trayPositions = [new Vec3(-TRAY_SPACING, .204, TRAY_DEPTH), new Vec3(TRAY_SPACING, .204, TRAY_DEPTH)];
    private readonly stagedScale = new Vec3(.70, .70, .70);
    private readonly bags = new Map<string, { node: Node; fold: Node }>();
    reducedMotion = false;

    constructor(private readonly root: Node, private readonly camera: Camera, effect: EffectAsset, unlit: EffectAsset,
        foodTexture: Texture2D) {
        this.art = new StallArt(camera, effect, unlit, foodTexture);
        this.cameraUp = Vec3.transformQuat(new Vec3(), Vec3.UNIT_Y, camera.node.worldRotation);
        this.counter = this.makeCounter();
        this.foodRoot.setParent(root);
        this.bags.set('A', this.makeBag(-0.58));
        this.bags.set('B', this.makeBag(0.58));
    }

    setBackground(texture: Texture2D): void {
        this.art.setBackground(texture);
    }

    resizeBackground(width: number, height: number): void {
        this.art.resizeBackground(width, height);
    }

    resizeTray(height: number, labelY: number, scale: number): void {
        const cameraNode = this.camera.node;
        const up = this.cameraUp;
        const depthScale = scale * TRAY_DEPTH_RATIO;
        // Project the front rim onto the vertical camera axis just above the HUD labels.
        const unitsPerPixel = 2 * this.camera.orthoHeight / height;
        const rimY = (labelY + TRAY_LABEL_CLEARANCE) * unitsPerPixel;
        const depth = (rimY + Vec3.dot(cameraNode.worldPosition, up) - TRAY_LIP_HEIGHT * scale * up.y) / up.z
            - TRAY_FRONT * depthScale;
        this.trayRack.setPosition(0, 0, depth);
        this.trayRack.setScale(scale, scale, depthScale);
        this.stagedScale.set(.70 * scale, .70 * scale, .70 * scale);
        this.trayPositions[0].set(-TRAY_SPACING * scale, .204 * scale, depth);
        this.trayPositions[1].set(TRAY_SPACING * scale, .204 * scale, depth);

        const boardBottom = Math.min(...Array.from(this.display.values(), (entry) => entry.projectedBottom));
        const offset = boardDepthOffset(boardBottom, depth * up.z + this.trayTop * scale, up.z, unitsPerPixel);
        // Keep the whole level together so food-on-food occlusion and tap rays still agree.
        for (const entry of this.display.values()) {
            entry.home.z = entry.baseDepth + offset;
            entry.shadow.setPosition(entry.home.x + .13, .009, entry.home.z + .14);
            if (entry.shadow.active) entry.node.setPosition(entry.home);
        }
        for (const [index, id] of (this.state?.stagedFoodIds ?? []).entries()) {
            const entry = this.display.get(id);
            entry?.node.setPosition(this.trayPositions[index]);
            entry?.node.setScale(this.stagedScale);
        }
    }

    updateBackground(dt: number, visible: boolean): void {
        this.art.updateSteam(dt, visible && !this.reducedMotion);
    }

    load(level: Level): void {
        this.cancelAnimations();
        for (const entry of this.display.values()) {
            entry.node.removeFromParent();
            entry.node.destroy();
            entry.shadow.removeFromParent();
            entry.shadow.destroy();
        }
        this.display.clear();
        for (const food of level.foods) {
            const node = new Node(food.id);
            node.setParent(this.foodRoot);
            const mesh = this.art.food(node, food.kind);
            const home = new Vec3(...food.slot);
            node.setPosition(home);
            const [width, , depth] = FOOD_SIZE[food.kind];
            const marker = this.art.piece(node, 'ring', '#c27b36', [0, 0.025, 0], [width * 1.14, 0.12, depth * 1.17]);
            marker.active = false;
            const shadow = this.art.contactShadow(this.foodRoot, [home.x + .13, .009, home.z + .14],
                [width * 1.78, 1, depth * 1.67]);
            let bottom = this.foodBottomByMesh.get(mesh);
            if (bottom === undefined) {
                bottom = this.projectMeshY(mesh).min;
                this.foodBottomByMesh.set(mesh, bottom);
            }
            this.display.set(food.id, {
                node, home, mesh, marker, shadow, baseDepth: home.z, projectedBottom: bottom + Vec3.dot(home, this.cameraUp),
            });
        }
    }

    hit(screenX: number, screenY: number): string | null {
        if (!this.state) return null;
        this.camera.screenPointToRay(screenX, screenY, this.ray);
        Vec3.copy(this.localRay.d, this.ray.d);
        let nearest = Infinity;
        let hit: string | null = null;
        for (const id of this.state.boardFoodIds) {
            const entry = this.display.get(id);
            if (!entry) continue;
            Vec3.subtract(this.localRay.o, this.ray.o, entry.home);
            const distance = geometry.intersect.rayMesh(this.localRay, entry.mesh, {
                mode: geometry.ERaycastMode.CLOSEST, distance: nearest,
            });
            if (distance > 0 && distance < nearest) {
                hit = id;
                nearest = distance;
            }
        }
        return hit;
    }

    render(state: GameState): void {
        this.state = state;
        for (const [id, entry] of this.display) {
            const tray = state.stagedFoodIds.indexOf(id);
            entry.shadow.active = state.boardFoodIds.indexOf(id) !== -1;
            entry.node.active = tray >= 0 || entry.shadow.active;
            entry.node.setPosition(tray >= 0 ? this.trayPositions[tray] : entry.home);
            entry.node.setScale(tray >= 0 ? this.stagedScale : boardScale);
        }
        for (const [id, bag] of this.bags) {
            const remaining = state.remainingByOrder[id];
            bag.node.active = Boolean(remaining) && !(Object.keys(remaining) as Food['kind'][]).some((kind) => remaining[kind] > 0);
        }
    }

    play(result: ActionResult, onReady: () => void, onSeal: (orderId: string) => void): void {
        const duration = this.reducedMotion ? 0 : 0.19;
        if (!duration || !result.events.length) {
            this.render(result.state);
            onReady();
            return;
        }

        const timeline = tween(this.foodRoot);
        for (const event of result.events) {
            switch (event.type) {
                case 'toOrder':
                case 'toTray':
                    timeline.call(() => this.animateFood(event, result.state, duration)).delay(duration);
                    break;
                case 'revealed':
                    timeline.call(() => this.highlight([event.foodId]));
                    break;
                case 'sealed':
                    timeline.call(() => {
                        this.animateSeal(event.orderId);
                        onSeal(event.orderId);
                    }).delay(0.1);
                    break;
            }
        }
        timeline.call(() => {
            this.render(result.state);
            onReady();
        }).start();
    }

    private animateFood(move: Extract<GameEvent, { type: 'toOrder' | 'toTray' }>, state: GameState, duration: number): void {
        const entry = this.display.get(move.foodId);
        if (!entry) return;
        entry.shadow.active = false;
        const tray = state.stagedFoodIds.indexOf(move.foodId);
        const target = tray >= 0 ? this.trayPositions[tray] : new Vec3(move.type === 'toOrder' && move.orderId === 'B' ? 1.15 : -1.15, 2.53, -1.75);
        const peak = entry.node.position.clone().lerp(target, 0.4);
        peak.y += 0.53;
        tween(entry.node)
            .to(duration * 0.41, { position: peak, scale: new Vec3(1.07, 1.07, 1.07) }, { easing: 'quadOut' })
            .to(duration * 0.59, { position: target, scale: tray >= 0 ? this.stagedScale : packedScale }, { easing: 'quadIn' })
            .call(() => { if (tray < 0) entry.node.active = false; })
            .start();
    }

    private animateSeal(orderId: string): void {
        const bag = this.bags.get(orderId);
        if (!bag) return;
        bag.node.active = true;
        bag.fold.setRotationFromEuler(-64, 0, 0);
        tween(bag.fold).to(0.17, { eulerAngles: new Vec3(13, 0, 0) }, { easing: 'quadOut' })
            .to(0.12, { eulerAngles: new Vec3(0, 0, 0) }, { easing: 'quadInOut' }).start();
    }

    highlight(ids: readonly string[]): void {
        for (const id of ids) {
            const marker = this.display.get(id)?.marker;
            if (!marker) continue;
            Tween.stopAllByTarget(marker);
            marker.active = true;
            tween(marker).delay(0.65).call(() => { marker.active = false; }).start();
        }
    }

    cancelAnimations(): void {
        Tween.stopAllByTarget(this.foodRoot);
        for (const entry of this.display.values()) {
            Tween.stopAllByTarget(entry.node);
            Tween.stopAllByTarget(entry.marker);
            entry.marker.active = false;
        }
        for (const bag of this.bags.values()) {
            Tween.stopAllByTarget(bag.fold);
            bag.fold.setRotationFromEuler(0, 0, 0);
        }
    }

    destroy(): void {
        this.cancelAnimations();
        this.foodRoot.destroy();
        this.counter.destroy();
        this.art.destroy();
    }

    private makeCounter(): Node {
        const counter = new Node('搪瓷早餐摊');
        counter.setParent(this.root);
        this.trayRack.setParent(counter);
        this.trayRack.setPosition(0, 0, TRAY_DEPTH);
        this.art.contactShadow(this.trayRack, [.10, -.003, .13], [4.88, 1, 2.22]);
        const rack = this.art.rack(this.trayRack, [0, 0, 0]).getComponent(MeshRenderer).mesh;
        const plate = this.art.plate(this.trayRack, [-TRAY_SPACING, PLATE_HEIGHT, 0]).getComponent(MeshRenderer).mesh;
        this.art.plate(this.trayRack, [TRAY_SPACING, PLATE_HEIGHT, 0]);
        this.trayTop = Math.max(this.projectMeshY(rack, TRAY_DEPTH_RATIO).max,
            this.projectMeshY(plate, TRAY_DEPTH_RATIO).max + PLATE_HEIGHT * this.cameraUp.y);
        return counter;
    }

    private projectMeshY(mesh: Mesh, depthScale = 1): { min: number; max: number } {
        const positions = mesh.readAttribute(0, gfx.AttributeName.ATTR_POSITION);
        if (!positions) throw new Error('Breakfast meshes require vertex positions for board spacing.');
        return projectYBounds(positions, this.cameraUp.y, this.cameraUp.z * depthScale);
    }

    private makeBag(x: number): { node: Node; fold: Node } {
        const node = new Node('纸袋');
        node.setParent(this.counter);
        node.setPosition(x, .01, 1.28);
        this.art.contactShadow(node, [.075, -.003, .076], [1.3, 1, .82]);
        this.art.bag(node);
        this.art.piece(node, 'box', '#f5d8a0', [0, .30, .257], [.27, .20, .018]);
        this.art.piece(node, 'box', '#a15037', [0, .30, .268], [.135, .065, .010]);
        const fold = this.art.piece(node, 'box', '#f1c897', [0, .638, .04], [.657, .044, .382]);
        node.active = false;
        return { node, fold };
    }

}
