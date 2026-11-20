const assert = require('node:assert/strict');
const { join } = require('node:path');
const { test } = require('node:test');
const root = process.env.BREAKFAST_TEST_DIR;
const { describeStuck, showHandoff } = require(join(root, 'runtime/order-presentation.js'));
const { LEVELS } = require(join(root, 'core/levels.js'));
const { createGame, applyAction } = require(join(root, 'core/rules.js'));

test('the finishing order folds before the new order takes the food in the trays', () => {
    let before = createGame(LEVELS[1]);
    for (const foodId of ['soyMilk', 'bun', 'riceCake', 'corn']) before = applyAction(before, { type: 'take', foodId }).state;
    const result = applyAction(before, { type: 'take', foodId: 'teaEgg' });
    assert.equal(result.state.status, 'won');
    const handoff = showHandoff(before, result.state, 'A');
    assert.equal(handoff.activeOrderId, 'B');
    assert.equal(handoff.status, 'playing');
    assert.deepEqual(handoff.stagedFoodIds, ['riceCake', 'corn']);
    assert.equal(handoff.remainingByOrder.A.teaEgg, 0);
    assert.deepEqual(handoff.remainingByOrder.B, { riceCake: 1, corn: 1 });
    assert.equal(showHandoff(before, result.state, 'B'), null);
});

test('new-level hints describe the blockers left on the table in full-tray routes', () => {
    const names = {
        bun: '包子', riceCake: '米糕', corn: '玉米', teaEgg: '茶叶蛋', flowerRoll: '花卷',
        soyMilk: '豆浆', oilStick: '油条', sweetPotato: '红薯',
    };
    const cases = [
        [8, null, ['bun', 'soyMilk', 'corn', 'flowerRoll'], '两只碟都占了，米糕还挡着茶叶蛋。'],
        [8, null, ['bun', 'soyMilk', 'riceCake', 'flowerRoll'], '两只碟都占了，玉米还挡着茶叶蛋。'],
        [10, 'A', ['bun', 'soyMilk', 'riceCake', 'oilStick'], '两只碟都占了，花卷还挡着茶叶蛋。'],
        [10, 'B', ['soyMilk', 'oilStick', 'flowerRoll', 'teaEgg'], '两只碟都占了，包子还挡着米糕。'],
        [12, 'A', ['bun-front', 'bun-back', 'sweetPotato', 'riceCake', 'oilStick'], '要留一个包子名额给挡住茶叶蛋的那只。'],
    ];
    for (const [level, orderId, route, message] of cases) {
        let state = createGame(LEVELS[level - 1]);
        if (orderId) state = applyAction(state, { type: 'select', orderId }).state;
        for (const foodId of route) {
            state = applyAction(state, { type: 'take', foodId }).state;
        }
        assert.equal(state.status, 'stuck');
        assert.equal(describeStuck(state, names), message);
    }
});
