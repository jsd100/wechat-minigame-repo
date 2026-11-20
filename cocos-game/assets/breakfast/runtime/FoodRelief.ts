import type { FoodKind } from '../core/types';
import { FOOD_ATLAS_SIZE, FOOD_CONTOURS } from './food-contours';

const footprint: Record<FoodKind, { width: number; depth: number }> = {
    soyMilk: { width: .87, depth: .62 },
    bun: { width: 1.13, depth: .80 },
    teaEgg: { width: .69, depth: .59 },
    riceCake: { width: 1.08, depth: .70 },
    corn: { width: .86, depth: .70 },
    flowerRoll: { width: 1.10, depth: .77 },
    oilStick: { width: 1.32, depth: .55 },
    sweetPotato: { width: .95, depth: .65 },
};

const RINGS = 8;
type Pixel = readonly [number, number];

export function buildFoodRelief(kind: FoodKind, pitch: number): {
    positions: number[];
    uvs: number[];
    indices: number[];
} {
    const { edge, center, cell } = FOOD_CONTOURS[kind];
    const { width, depth } = footprint[kind];
    const minX = Math.min(...edge.map(([x]) => x));
    const maxX = Math.max(...edge.map(([x]) => x));
    const scale = width / (maxX - minX);
    const cos = Math.cos(pitch);
    const sin = Math.sin(pitch);
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    let bottom = Infinity;
    let bottomDepth = 0;

    // Each pixel projects through both faces. The two faces bulge in opposite
    // directions and share the same contour vertices, forming a closed mesh.
    const vertex = (point: Pixel, radius: number, side: number): number => {
        const px = center[0] + (point[0] - center[0]) * radius;
        const py = center[1] + (point[1] - center[1]) * radius;
        const x = (px - (minX + maxX) / 2) * scale;
        const vertical = (center[1] - py) * scale;
        const bulge = side * depth * .5 * Math.sqrt(1 - radius * radius);
        const y = vertical * cos + bulge * sin;
        const z = -vertical * sin + bulge * cos;
        if (y < bottom) {
            bottom = y;
            bottomDepth = z;
        }
        const index = positions.length / 3;
        positions.push(x, y, z);
        uvs.push((cell[0] + px + .5) / FOOD_ATLAS_SIZE[0], (cell[1] + py + .5) / FOOD_ATLAS_SIZE[1]);
        return index;
    };

    const seam = edge.map((point) => vertex(point, 1, 0));
    for (const side of [1, -1]) {
        const triangle = (a: number, b: number, c: number) => {
            if (side === 1) indices.push(a, b, c);
            else indices.push(a, c, b);
        };
        const hub = vertex(center, 0, side);
        let inside = edge.map((point) => vertex(point, 1 / RINGS, side));
        for (let i = 0; i < edge.length; i++) triangle(hub, inside[i], inside[(i + 1) % edge.length]);

        for (let ring = 2; ring <= RINGS; ring++) {
            const outside = ring === RINGS ? seam : edge.map((point) => vertex(point, ring / RINGS, side));
            for (let i = 0; i < edge.length; i++) {
                const next = (i + 1) % edge.length;
                triangle(inside[i], outside[i], outside[next]);
                triangle(inside[i], outside[next], inside[next]);
            }
            inside = outside;
        }
    }
    for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= bottom;
        positions[i + 2] -= bottomDepth;
    }
    return { positions, uvs, indices };
}
