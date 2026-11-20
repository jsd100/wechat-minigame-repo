import { Camera, Color, EffectAsset, Material, Mesh, MeshRenderer, Node, primitives, Texture2D, utils } from 'cc';
import type { FoodKind } from '../core/types';
import { enamelRack, enamelWells, kraftBag } from './BreakfastMesh';
import { buildFoodRelief } from './FoodRelief';

type Shape = 'box' | 'ring';
type Triple = readonly [number, number, number];

export const FOOD_NAMES: Record<FoodKind, string> = {
    soyMilk: '豆浆', bun: '包子', teaEgg: '茶叶蛋', riceCake: '米糕', corn: '玉米', flowerRoll: '花卷',
    oilStick: '油条', sweetPotato: '红薯',
};

export const FOOD_SIZE: Record<FoodKind, Triple> = {
    soyMilk: [.84, 1.09, .84], bun: [1.10, .81, .99], teaEgg: [.69, .92, .66],
    riceCake: [1.10, .75, .87], corn: [.84, .94, .84], flowerRoll: [1.12, .73, .88],
    oilStick: [1.32, .47, .65], sweetPotato: [.95, .62, .70],
};

export class StallArt {
    private readonly meshes = new Map<string, Mesh>();
    private readonly materials = new Map<string, Material>();
    private readonly backdrop: Node;
    private readonly photo: Material;
    private readonly foodSurface: Material;
    private readonly pitch: number;
    private readonly wisps: Node[] = [];
    private frameWidth = 0;
    private frameHeight = 0;
    private steamTime = 0;

    constructor(camera: Camera, private readonly surfaceEffect: EffectAsset, private readonly unlitEffect: EffectAsset,
        foodTexture: Texture2D) {
        this.pitch = Math.asin(-camera.node.forward.y);
        this.foodSurface = new Material();
        this.foodSurface.initialize({ effectAsset: unlitEffect, defines: { USE_TEXTURE: true, USE_ALPHA_TEST: true } });
        this.foodSurface.setProperty('mainTexture', foodTexture);
        this.foodSurface.setProperty('alphaThreshold', .42);
        this.photo = new Material();
        this.photo.initialize({ effectAsset: unlitEffect, defines: { USE_TEXTURE: true } });
        this.backdrop = this.place(camera.node, '晨市背景', this.mesh('backdrop', backdropPlane), this.photo);
        this.backdrop.setPosition(0, 0, -30);
        this.backdrop.active = false;
        const mist = new Material();
        mist.initialize({ effectAsset: unlitEffect, technique: 1, defines: { USE_VERTEX_COLOR: true } });
        this.materials.set('steam', mist);
        const steamMesh = this.mesh('steam', () => softDisc([.99, .94, .82], .26, false));
        for (let i = 0; i < 3; i++) {
            const wisp = this.place(camera.node, '晨雾', steamMesh, mist);
            wisp.active = false;
            this.wisps.push(wisp);
        }
    }

    setBackground(texture: Texture2D): void {
        this.photo.setProperty('mainTexture', texture);
        this.backdrop.active = true;
    }

    resizeBackground(width: number, height: number): void {
        this.frameWidth = width;
        this.frameHeight = height;
        this.backdrop.setScale(width * 1.004, height * 1.004, 1);
    }

    updateSteam(dt: number, enabled: boolean): void {
        if (enabled) this.steamTime += dt;
        for (const [i, wisp] of this.wisps.entries()) {
            wisp.active = enabled && this.backdrop.active;
            if (!wisp.active) continue;
            const phase = (this.steamTime / 4.3 + i / this.wisps.length) % 1;
            const drift = Math.sin(phase * 5 + i) * .019;
            const fade = Math.sin(phase * Math.PI);
            wisp.setPosition(this.frameWidth * (.401 + drift), this.frameHeight * (.322 + phase * .105), -29.8);
            wisp.setRotationFromEuler(0, 0, -23 + 30 * drift);
            wisp.setScale(this.frameWidth * (.043 + phase * .044) * fade, this.frameHeight * .072 * fade, 1);
        }
    }

    piece(parent: Node, shape: Shape, tone: string, position: Triple, size: Triple): Node {
        const mesh = this.mesh(shape, () => shape === 'box' ? primitives.box() :
            primitives.torus(.46, .04, { radialSegments: 12, tubularSegments: 40 }));
        const node = this.place(parent, shape, mesh, this.material(tone, .46));
        node.setPosition(...position);
        node.setScale(...size);
        return node;
    }

    food(parent: Node, kind: FoodKind): Mesh {
        const mesh = this.mesh(kind, () => buildFoodRelief(kind, this.pitch));
        this.place(parent, FOOD_NAMES[kind], mesh, this.foodSurface);
        return mesh;
    }

    plate(parent: Node, position: Triple): Node {
        const plate = this.place(parent, '搪瓷暂存碟', this.mesh('enamel-plate', enamelWells), this.material('enamel-plate', .26, true));
        plate.setPosition(...position);
        return plate;
    }

    rack(parent: Node, position: Triple): Node {
        const rack = this.place(parent, '搪瓷暂存盘', this.mesh('enamel-rack', enamelRack), this.material('enamel-rack', .3, true));
        rack.setPosition(...position);
        return rack;
    }

    bag(parent: Node): void {
        this.place(parent, '牛皮纸袋', this.mesh('kraft-bag', kraftBag), this.material('kraft-bag', .82, true));
    }

    contactShadow(parent: Node, position: Triple, size: Triple): Node {
        const key = 'contact-shadow';
        let material = this.materials.get(key);
        if (!material) {
            material = new Material();
            material.initialize({ effectAsset: this.unlitEffect, technique: 1, defines: { USE_VERTEX_COLOR: true } });
            this.materials.set(key, material);
        }
        const node = this.place(parent, key, this.mesh(key, () => softDisc([.24, .12, .046], .37, true)), material);
        node.setPosition(...position);
        node.setScale(...size);
        return node;
    }

    destroy(): void {
        this.backdrop.destroy();
        this.wisps.forEach((wisp) => wisp.destroy());
        this.photo.destroy();
        this.foodSurface.destroy();
        this.meshes.forEach((mesh) => mesh.destroy());
        this.materials.forEach((material) => material.destroy());
    }

    private place(parent: Node, name: string, mesh: Mesh, material: Material): Node {
        const node = new Node(name);
        node.setParent(parent);
        const renderer = node.addComponent(MeshRenderer);
        renderer.mesh = mesh;
        renderer.setSharedMaterial(material, 0);
        return node;
    }

    private mesh(key: string, createGeometry: () => primitives.IGeometry): Mesh {
        let mesh = this.meshes.get(key);
        if (mesh) return mesh;
        mesh = utils.createMesh(createGeometry());
        this.meshes.set(key, mesh);
        return mesh;
    }

    private material(key: string, roughness: number, vertexColor = false): Material {
        let material = this.materials.get(key);
        if (material) return material;
        material = new Material();
        material.initialize({ effectAsset: this.surfaceEffect, defines: { USE_VERTEX_COLOR: vertexColor } });
        material.setProperty('mainColor', vertexColor ? new Color(255, 255, 255, 255) : Color.fromHEX(new Color(), key));
        material.setProperty('roughness', roughness);
        this.materials.set(key, material);
        return material;
    }
}

function backdropPlane(): primitives.IGeometry {
    const quad = primitives.quad();
    // The camera-facing quad's default V direction is opposite the imported portrait texture.
    for (let i = 1; i < quad.uvs.length; i += 2) quad.uvs[i] = 1 - quad.uvs[i];
    return quad;
}

function softDisc(color: Triple, opacity: number, horizontal: boolean): primitives.IGeometry {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const segments = 48;
    const rings = 8;
    for (let ring = 0; ring <= rings; ring++) {
        const radius = Math.max(.0001, .5 * ring / rings);
        const alpha = opacity * Math.pow(1 - ring / rings, 1.45);
        for (let index = 0; index < segments; index++) {
            const a = index * Math.PI * 2 / segments;
            const y = radius * Math.sin(a);
            positions.push(radius * Math.cos(a), horizontal ? 0 : -y, horizontal ? y : 0);
            colors.push(...color, alpha);
            if (ring === 0) continue;
            const inner = (ring - 1) * segments + index;
            const outer = inner + segments;
            const nextInner = (ring - 1) * segments + (index + 1) % segments;
            const nextOuter = nextInner + segments;
            indices.push(inner, nextOuter, outer, inner, nextInner, nextOuter);
        }
    }
    return { positions, colors, indices };
}
