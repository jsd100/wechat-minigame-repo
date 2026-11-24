// Minimal type surface for pure-logic tests, not a Cocos runtime substitute.
// Full engine typing is checked separately by tools/typecheck.cjs.
declare module 'cc' {
    namespace primitives {
        interface IGeometry {
            positions: number[];
            normals: number[];
            colors: number[];
            indices: number[];
        }
    }
}
