import type { primitives } from 'cc';

type Point = readonly [number, number, number];
type RGB = readonly [number, number, number];
type Sample = readonly [Point, RGB];
type Profile = readonly (readonly [height: number, radius: number])[];

const TAU = Math.PI * 2;
const teal: RGB = [0.065, 0.37, 0.32];

function random(a: number, b = 0): number {
    const value = Math.sin(a * 127.1 + b * 311.7 + 7.13) * 43758.5453123;
    return value - Math.floor(value);
}

function shade(color: RGB, amount: number): RGB {
    return color.map((channel) => Math.max(0, Math.min(1, channel * amount))) as unknown as RGB;
}

function profile(points: Profile, t: number): readonly [number, number] {
    const index = Math.min(points.length - 2, Math.floor(t * (points.length - 1)));
    const progress = t * (points.length - 1) - index;
    const [y0, r0] = points[index];
    const [y1, r1] = points[index + 1];
    return [y0 + (y1 - y0) * progress, r0 + (r1 - r0) * progress];
}

class MeshDraft {
    private readonly positions: number[] = [];
    private readonly normals: number[] = [];
    private readonly colors: number[] = [];
    private readonly indices: number[] = [];

    surface(rows: number, cols: number, point: (u: number, v: number) => Sample): void {
        const start = this.positions.length / 3;
        for (let row = 0; row <= rows; row++) {
            for (let col = 0; col <= cols; col++) {
                const u = (col % cols) / cols;
                const v = row / rows;
                const [p, color] = point(u, v);
                this.positions.push(...p);
                this.colors.push(...color, 1);
                this.normals.push(0, 0, 0);
            }
        }
        const stride = cols + 1;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const i = start + row * stride + col;
                this.triangle(i, i + stride, i + 1);
                this.triangle(i + 1, i + stride, i + stride + 1);
            }
        }
        for (let row = 0; row <= rows; row++) {
            const first = (start + row * stride) * 3;
            const last = first + cols * 3;
            for (let axis = 0; axis < 3; axis++) {
                const value = this.normals[first + axis] + this.normals[last + axis];
                this.normals[first + axis] = this.normals[last + axis] = value;
            }
        }
    }

    lathe(points: Profile, width: number, depth: number, color: (u: number, v: number, y: number) => RGB,
        power = 1, steps = 4, sides = 64, height = 1): void {
        this.surface((points.length - 1) * steps, sides, (u, v) => {
            const [y, r] = profile(points, v);
            const angle = u * TAU;
            const x = Math.cos(angle);
            const z = Math.sin(angle);
            return [[Math.sign(x) * Math.pow(Math.abs(x), power) * r * width, y * height,
                Math.sign(z) * Math.pow(Math.abs(z), power) * r * depth], color(u, v, y)];
        });
    }

    build(): primitives.IGeometry {
        for (let i = 0; i < this.normals.length; i += 3) {
            const magnitude = Math.hypot(this.normals[i], this.normals[i + 1], this.normals[i + 2]) || 1;
            for (let axis = 0; axis < 3; axis++) this.normals[i + axis] /= magnitude;
        }
        return { positions: this.positions, normals: this.normals, colors: this.colors, indices: this.indices };
    }

    private triangle(a: number, b: number, c: number): void {
        this.indices.push(a, b, c);
        a *= 3;
        b *= 3;
        c *= 3;
        const p = this.positions;
        const x1 = p[b] - p[a];
        const y1 = p[b + 1] - p[a + 1];
        const z1 = p[b + 2] - p[a + 2];
        const x2 = p[c] - p[a];
        const y2 = p[c + 1] - p[a + 1];
        const z2 = p[c + 2] - p[a + 2];
        for (const i of [a, b, c]) {
            this.normals[i] += y1 * z2 - z1 * y2;
            this.normals[i + 1] += z1 * x2 - x1 * z2;
            this.normals[i + 2] += x1 * y2 - y1 * x2;
        }
    }
}

export function enamelWells(): primitives.IGeometry {
    const mesh = new MeshDraft();
    const parts: Profile = [[.030, .005], [.030, .71], [.048, .83], [.099, .89], [.174, .96], [.194, 1],
        [.227, 1], [.244, .97], [.249, .92], [.224, .86], [.169, .805], [.133, .75], [.121, .67], [.119, .004]];
    mesh.lathe(parts, .91, .73, (_, v) => v > .37 && v < .64 ? shade(teal, .92 + v * .26) :
        shade([.985, .896, .742], v > .86 ? 1 : .94 + .09 * Math.sin(v * Math.PI)), 1, 3, 96);
    return mesh.build();
}

export function enamelRack(): primitives.IGeometry {
    const mesh = new MeshDraft();
    const sides: Profile = [[.003, .01], [.003, .92], [.018, .973], [.043, 1], [.080, 1],
        [.105, .989], [.119, .970], [.121, .950], [.105, .933], [.092, .915], [.091, .007]];
    mesh.lathe(sides, 2.18, .87, (_, v) => v < .756 ? shade(teal, .88 + .19 * v) : [1, .91, .77], .29, 3, 96);
    return mesh.build();
}

export function kraftBag(): primitives.IGeometry {
    const mesh = new MeshDraft();
    const sides: Profile = [[.008, .01], [.008, .73], [.033, .86], [.126, .94], [.25, 1], [.41, .96],
        [.525, .88], [.605, .82], [.658, .73], [.666, .01]];
    mesh.surface(42, 64, (u, v) => {
        const [h, r] = profile(sides, v);
        const a = u * TAU;
        const bound = (n: number) => Math.sign(n) * Math.pow(Math.abs(n), .34);
        const crinkle = (.009 + h * .013) * Math.sin(a * 13 + 11 * h);
        const grain = .90 + random(Math.round(u * 64), Math.round(v * 42)) * .12;
        const gusset = .021 * Math.sin(a * 6) * Math.sin(v * 14);
        return [[bound(Math.cos(a)) * (.43 * r + crinkle), h + gusset,
            bound(Math.sin(a)) * (.26 * r + crinkle)], shade([.88, .67, .435], grain)];
    });
    return mesh.build();
}
