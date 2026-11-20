const assert = require('node:assert/strict');
const { join } = require('node:path');
const { test } = require('node:test');
const { layoutFooter } = require(join(process.env.BREAKFAST_TEST_DIR, 'runtime/footer-layout.js'));
const { resolveHudHit } = require(join(process.env.BREAKFAST_TEST_DIR, 'runtime/hud-hit.js'));

const top = ({ y, h }) => y + h / 2;
const bottom = ({ y, h }) => y - h / 2;

test('compact previous row gives the counter room while keeping safe, separate tap targets', () => {
    for (const [height, inset] of [[854, 0], [1067, 40], [930, 58]]) {
        const { panel, left, right, previous, trayLabelY } = layoutFooter(480, height, inset);
        const safeBottom = inset - height / 2;
        assert.ok(bottom(previous) >= safeBottom + 4);
        assert.ok(bottom(previous) <= safeBottom + 6);
        assert.ok(previous.h >= 44 && previous.h <= 48);
        assert.ok(previous.w >= 135 && previous.w <= 160);
        assert.ok(bottom(panel) - top(previous) >= 8);
        assert.ok(bottom(panel) - safeBottom <= 58);
        assert.ok(trayLabelY - 11 - top(panel) >= 8);
        assert.ok(right.x - right.w / 2 - (left.x + left.w / 2) >= 14);
        for (const area of [left, right]) {
            assert.ok(area.h >= 56);
            assert.ok(area.w > 150);
        }
        assert.ok(bottom(left) > bottom(panel));
        assert.ok(top(left) < top(panel));
    }
});

test('visible button edges are tappable and the gap between rows has no action', () => {
    const { left, right, previous } = layoutFooter(480, 1067, 40);
    const areas = [{ ...left, action: { type: 'undo' } }, { ...right, action: { type: 'restart' } },
        { ...previous, action: { type: 'previous' } }];
    for (const area of areas) {
        assert.deepEqual(resolveHudHit(area.x + area.w / 2 - 5, bottom(area) + 5, areas), area.action);
    }
    assert.equal(resolveHudHit(previous.x, top(previous) + 6, areas), null);
    assert.equal(resolveHudHit(previous.x, previous.y, [{ ...previous }]), 'ignore');
});
