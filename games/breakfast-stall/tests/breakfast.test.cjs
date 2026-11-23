const assert = require('node:assert/strict');
const { join } = require('node:path');
const { test } = require('node:test');
const { createGame, applyAction, getBlockers } = require(join(process.env.BREAKFAST_TEST_DIR, 'core/rules.js'));

function makeLevel(orders, foods, mode = 'fixed') {
    return {
        id: 1,
        title: 'Test stall',
        mode,
        orders: orders.map((needs, index) => ({ id: 'AB'[index], needs })),
        foods: foods.map(([id, kind, blockedBy = []]) => ({ id, kind, blockedBy, slot: [0, 0, 0] })),
    };
}

function take(state, foodId) {
    return applyAction(state, { type: 'take', foodId });
}

function select(state, orderId) {
    return applyAction(state, { type: 'select', orderId });
}

const stageBoth = makeLevel([{ bun: 1 }, { corn: 1, riceCake: 1 }], [
    ['bun', 'bun'], ['corn', 'corn'], ['rice', 'riceCake'],
]);

const covered = makeLevel([{ bun: 1, teaEgg: 1 }, { corn: 1, riceCake: 1, flowerRoll: 1 }], [
    ['bun', 'bun'], ['egg', 'teaEgg', ['rice']], ['corn', 'corn'], ['rice', 'riceCake'], ['roll', 'flowerRoll'],
], 'choose');

test('full trays still allow direct fulfillment and winning settles the score', () => {
    const game = take(take(createGame(stageBoth), 'corn').state, 'rice').state;
    assert.equal(game.status, 'playing');
    assert.equal(game.peakStaged, 2);
    const won = take(game, 'bun').state;
    assert.equal(won.status, 'won');
    assert.equal(won.canUndo, false);
    assert.equal(won.activeOrderId, null);
    assert.equal(applyAction(won, { type: 'undo' }).state, won);
});

test('switch drains trays in insertion order and wins', () => {
    const game = take(take(createGame(stageBoth), 'rice').state, 'corn').state;
    const { state, events } = take(game, 'bun');
    assert.deepEqual(events, [
        { type: 'toOrder', foodId: 'bun', orderId: 'A' },
        { type: 'sealed', orderId: 'A' },
        { type: 'toOrder', foodId: 'rice', orderId: 'B' },
        { type: 'toOrder', foodId: 'corn', orderId: 'B' },
        { type: 'sealed', orderId: 'B' },
    ]);
    assert.deepEqual(state.stagedFoodIds, []);
    assert.equal(state.status, 'won');
});

test('undo switch restores both orders, trays and blockers', () => {
    const fixture = makeLevel([{ bun: 1 }, { corn: 1, riceCake: 1 }], [
        ['bun', 'bun'], ['corn', 'corn', ['bun']], ['rice', 'riceCake'],
    ]);
    const before = take(createGame(fixture), 'rice').state;
    const after = take(before, 'bun');
    assert.equal(after.state.activeOrderId, 'B');
    assert.deepEqual(after.state.stagedFoodIds, []);
    assert.deepEqual(getBlockers(after.state, 'corn'), []);
    assert.deepEqual(after.events[1], { type: 'revealed', foodId: 'corn' });
    const restored = applyAction(after.state, { type: 'undo' }).state;
    for (const key of ['remainingByOrder', 'boardFoodIds', 'stagedFoodIds', 'peakStaged', 'activeOrderId']) {
        assert.deepEqual(restored[key], before[key]);
    }
    assert.deepEqual(getBlockers(restored, 'corn'), ['bun']);
    assert.equal(restored.usedUndo, true);
    assert.equal(restored.canUndo, false);
});

test('undo first take reopens choice and rejected taps never lock the order', () => {
    const initial = createGame(covered);
    assert.equal(take(initial, 'bun').rejection, 'chooseOrder');
    const picked = select(initial, 'A').state;
    assert.equal(take(picked, 'egg').rejection, 'blocked');
    assert.equal(select(picked, 'B').state.activeOrderId, 'B');
    const moved = take(picked, 'bun').state;
    assert.equal(moved.canSelectOrder, false);
    assert.equal(select(moved, 'B').state, moved);
    const restored = applyAction(moved, { type: 'undo' }).state;
    assert.equal(restored.canSelectOrder, true);
    assert.equal(select(restored, 'B').state.activeOrderId, 'B');
    assert.equal(restored.usedUndo, true);
});

test('blocked and duplicate taps leave the state unchanged', () => {
    const before = select(createGame(covered), 'A').state;
    assert.equal(take(before, 'egg').state, before);
    const after = take(before, 'bun').state;
    assert.deepEqual(take(after, 'bun'), { state: after, events: [], rejection: 'unavailable' });
    assert.equal(take(after, 'missing').state, after);
});

test('deadlock requires no legal food, undo heals it, and restart resets the allowance', () => {
    let game = select(createGame(covered), 'A').state;
    game = take(take(game, 'corn').state, 'roll').state;
    assert.equal(game.status, 'playing');
    assert.equal(take(game, 'rice').rejection, 'full');
    game = take(game, 'bun').state;
    assert.equal(game.status, 'stuck');
    const restored = applyAction(game, { type: 'undo' }).state;
    assert.equal(restored.status, 'playing');
    assert.equal(restored.usedUndo, true);
    const restart = applyAction(restored, { type: 'restart' }).state;
    assert.deepEqual(restart, createGame(covered));
});

test('undo reduces the peak when the last move occupied another tray', () => {
    let game = select(createGame(covered), 'A').state;
    game = take(take(game, 'corn').state, 'roll').state;
    const restored = applyAction(game, { type: 'undo' }).state;
    assert.equal(game.peakStaged, 2);
    assert.equal(restored.peakStaged, 1);
    assert.deepEqual(restored.stagedFoodIds, ['corn']);
    assert.equal(restored.usedUndo, true);
});
