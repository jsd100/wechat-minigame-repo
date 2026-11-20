const assert = require('node:assert/strict');
const { join } = require('node:path');
const { test } = require('node:test');
const compiled = process.env.BREAKFAST_TEST_DIR;
const { LEVELS } = require(join(compiled, 'core/levels.js'));
const { buildFoodRelief } = require(join(compiled, 'runtime/FoodRelief.js'));
const { enamelRack, enamelWells } = require(join(compiled, 'runtime/BreakfastMesh.js'));
const { layoutFooter } = require(join(compiled, 'runtime/footer-layout.js'));
const { boardDepthOffset, projectYBounds } = require(join(compiled, 'runtime/board-spacing.js'));

test('chapter one tabletop silhouettes clear the tray rim at compact and tall phone ratios', () => {
    const pitch = Math.atan2(8.19, 9.63);
    const upY = Math.cos(pitch);
    const upZ = -Math.sin(pitch);
    const cameraY = 8.35 * upY + 8.65 * upZ;
    const trayDepthRatio = .78;
    const rack = projectYBounds(enamelRack().positions, upY, upZ * trayDepthRatio);
    const plate = projectYBounds(enamelWells().positions, upY, upZ * trayDepthRatio);
    const trayTop = Math.max(rack.max, plate.max + .09 * upY);
    for (const [height, safeBottom] of [[854, 0], [930, 58], [1043, 40], [1120, 0]]) {
        const { trayLabelY, trayScale } = layoutFooter(480, height, safeBottom);
        const units = 2 * Math.max(4.22, 2.38 * height / 480) / height;
        const trayDepth = ((trayLabelY + 18) * units + cameraY - .05 * trayScale * upY) / upZ
            - .87 * trayDepthRatio * trayScale;
        const rim = trayDepth * upZ + trayTop * trayScale;
        for (const level of LEVELS) {
            const bottom = Math.min(...level.foods.map(({ kind, slot: [, y, z] }) => {
                const geometry = buildFoodRelief(kind, pitch);
                return y * upY + z * upZ + projectYBounds(geometry.positions, upY, upZ).min;
            }));
            const offset = boardDepthOffset(bottom, rim, upZ, units);
            assert.ok(bottom + offset * upZ - rim >= 18 * units - 1e-6, `level ${level.id} at height ${height}`);
            if (bottom - rim >= 18 * units) assert.equal(offset, 0);
            if (height === 1043 && level.id === 3) {
                assert.ok(bottom < rim, 'the old level 3 layout intersects the rim');
                assert.ok(offset < 0, 'level 3 must move away from the tray');
            }
        }
    }
});
