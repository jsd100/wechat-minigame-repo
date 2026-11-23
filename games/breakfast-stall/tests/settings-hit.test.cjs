const assert = require('node:assert/strict');
const { join } = require('node:path');
const { test } = require('node:test');
const { resolveHudHit } = require(join(process.env.BREAKFAST_TEST_DIR, 'runtime/hud-hit.js'));
const { applyAction } = require(join(process.env.BREAKFAST_TEST_DIR, 'core/rules.js'));

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
    assert.deepEqual(resolveHudHit(0, 0, [restart], modal), { type: 'close-dialog' });
    assert.deepEqual(resolveHudHit(-100, -100, [restart], modal), { type: 'close-dialog' });
    assert.equal(resolveHudHit(15, 42, [restart], modal), 'ignore');
});

test('either setting remains independently clickable while the dialog is open', () => {
    assert.deepEqual(resolveHudHit(50, 100, [], modal), { type: 'sound' });
    assert.deepEqual(resolveHudHit(50, 70, [], modal), { type: 'motion' });
});

test('the help dialog routes food taps locally and its backdrop only closes it', () => {
    const help = { ...modal, controls: [
        { x: 50, y: 100, w: 60, h: 40, action: { type: 'help-take', foodId: 'riceCake' } },
    ] };
    assert.deepEqual(resolveHudHit(50, 100, [restart], help), { type: 'help-take', foodId: 'riceCake' });
    assert.deepEqual(resolveHudHit(0, 0, [restart], help), { type: 'close-dialog' });
});

test('the opening ticket teaches blocking, staging and automatic handoff with the real rules', () => {
    const { createHelpDemo } = require(join(process.env.BREAKFAST_TEST_DIR, 'runtime/help-demo.js'));
    const start = createHelpDemo();
    const take = (state, foodId) => applyAction(state, { type: 'take', foodId });
    assert.equal(take(start, 'teaEgg').rejection, 'blocked');
    const rice = take(start, 'riceCake');
    assert.deepEqual(rice.state.stagedFoodIds, ['riceCake']);
    assert.deepEqual(rice.events.map(event => event.type), ['toTray', 'revealed']);
    const egg = take(rice.state, 'teaEgg');
    assert.deepEqual(egg.events, [
        { type: 'toOrder', foodId: 'teaEgg', orderId: 'A' },
        { type: 'sealed', orderId: 'A' },
        { type: 'toOrder', foodId: 'riceCake', orderId: 'B' },
        { type: 'sealed', orderId: 'B' },
    ]);
    assert.equal(egg.state.status, 'won');
    assert.deepEqual(egg.state.stagedFoodIds, []);
    assert.deepEqual(createHelpDemo(), start);
});
