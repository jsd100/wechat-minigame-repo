const assert = require('node:assert/strict');
const { join } = require('node:path');
const { test } = require('node:test');
const { buildFoodRelief } = require(join(process.env.BREAKFAST_TEST_DIR, 'runtime/FoodRelief.js'));
const { FOOD_ATLAS_SIZE, FOOD_ATLAS_CELL_SIZE, FOOD_CONTOURS } = require(join(process.env.BREAKFAST_TEST_DIR, 'runtime/food-contours.js'));

test('eight atlas surfaces form closed 3D food volumes on the tabletop', () => {
    for (const kind of Object.keys(FOOD_CONTOURS)) {
        const { positions, uvs, indices } = buildFoodRelief(kind, Math.atan2(8.19, 9.63));
        const y = positions.filter((_, i) => i % 3 === 1);
        const z = positions.filter((_, i) => i % 3 === 2);
        assert.ok(positions.every(Number.isFinite), kind);
        assert.ok(Math.abs(Math.min(...y)) < 1e-7, kind);
        assert.ok(Math.max(...z) - Math.min(...z) > .35, kind);
        assert.equal(uvs.length, positions.length * 2 / 3, kind);
        const incidences = new Map();
        for (let i = 0; i < indices.length; i += 3) {
            for (let side = 0; side < 3; side++) {
                const a = indices[i + side];
                const b = indices[i + (side + 1) % 3];
                assert.ok(a >= 0 && a < positions.length / 3 && a !== b, kind);
                const edge = a < b ? `${a}:${b}` : `${b}:${a}`;
                incidences.set(edge, (incidences.get(edge) ?? 0) + 1);
            }
        }
        assert.ok([...incidences.values()].every((value) => value === 2), kind);
    }
    assert.equal(Object.keys(FOOD_CONTOURS).length, 8);
    for (const { cell: [x, y], edge } of Object.values(FOOD_CONTOURS)) {
        assert.ok(x + FOOD_ATLAS_CELL_SIZE <= FOOD_ATLAS_SIZE[0] && y + FOOD_ATLAS_CELL_SIZE <= FOOD_ATLAS_SIZE[1]);
        assert.ok(edge.every(([u, v]) => u >= 0 && v >= 0 && u < FOOD_ATLAS_CELL_SIZE && v < FOOD_ATLAS_CELL_SIZE));
    }
});
