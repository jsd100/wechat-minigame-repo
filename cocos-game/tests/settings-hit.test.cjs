const assert = require('node:assert/strict');
const { join } = require('node:path');
const { test } = require('node:test');
const { resolveHudHit } = require(join(process.env.BREAKFAST_TEST_DIR, 'runtime/hud-hit.js'));

const restart = { x: 0, y: 0, w: 40, h: 40, action: { type: 'restart' } };
const modal = {
    panel: { x: 40, y: 70, w: 110, h: 120 },
    controls: [
        { x: 50, y: 100, w: 80, h: 26, action: { type: 'sound' } },
        { x: 50, y: 70, w: 80, h: 26, action: { type: 'motion' } },
    ],
};

test('the settings overlay owns taps over the board and all underlying controls', () => {
    assert.deepEqual(resolveHudHit(0, 0, [restart]), { type: 'restart' });
    assert.equal(resolveHudHit(-100, -100, [restart]), null);
    assert.deepEqual(resolveHudHit(0, 0, [restart], modal), { type: 'settings' });
    assert.deepEqual(resolveHudHit(-100, -100, [restart], modal), { type: 'settings' });
    assert.equal(resolveHudHit(15, 42, [restart], modal), 'ignore');
});

test('either setting remains independently clickable while the dialog is open', () => {
    assert.deepEqual(resolveHudHit(50, 100, [], modal), { type: 'sound' });
    assert.deepEqual(resolveHudHit(50, 70, [], modal), { type: 'motion' });
});
