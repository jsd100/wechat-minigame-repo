const assert = require('node:assert/strict');
const { join } = require('node:path');
const { test } = require('node:test');
const root = process.env.BREAKFAST_TEST_DIR;
const { LEVELS } = require(join(root, 'core/levels.js'));
const { applyAction, createGame, getBlockers } = require(join(root, 'core/rules.js'));

const take = (state, foodId) => applyAction(state, { type: 'take', foodId });

function start(levelId, orderId) {
    const level = LEVELS[levelId - 1];
    assert.ok(level, `missing level ${levelId}`);
    const game = createGame(level);
    if (game.level.mode === 'fixed') {
        assert.equal(game.activeOrderId, orderId);
        return game;
    }
    return applyAction(game, { type: 'select', orderId }).state;
}

function play(state, route) {
    for (const foodId of route) {
        const result = take(state, foodId);
        assert.equal(result.rejection, undefined, `${state.level.id}: ${foodId}`);
        state = result.state;
    }
    return state;
}

function lowestPeak(state) {
    if (state.status === 'won') return state.peakStaged;
    let best = null;
    for (const foodId of state.boardFoodIds) {
        const step = take(state, foodId);
        if (!step.rejection) {
            const result = lowestPeak(step.state);
            if (result !== null && (best === null || result < best)) best = result;
        }
    }
    return best;
}

test('all boards have valid blocker graphs and match the required food counts', () => {
    assert.deepEqual(LEVELS.map(({ id, mode }) => [id, mode]), [[1, 'fixed'], [2, 'fixed'], [3, 'fixed'],
        [4, 'choose'], [5, 'choose'], [6, 'choose'], [7, 'fixed'], [8, 'fixed'], [9, 'choose'],
        [10, 'choose'], [11, 'fixed'], [12, 'choose']]);
    for (const level of LEVELS) {
        const foodById = new Map(level.foods.map((food) => [food.id, food]));
        assert.equal(foodById.size, level.foods.length);
        function visit(id, path) {
            assert.ok(!path.includes(id), `cycle at ${id}`);
            assert.ok(foodById.has(id), `unknown food: ${id}`);
            for (const blocker of foodById.get(id).blockedBy) visit(blocker, [...path, id]);
        }
        for (const id of foodById.keys()) visit(id, []);

        const actual = {};
        const expected = {};
        for (const { kind } of level.foods) actual[kind] = (actual[kind] ?? 0) + 1;
        for (const { needs } of level.orders) {
            for (const [kind, count] of Object.entries(needs)) expected[kind] = (expected[kind] ?? 0) + count;
        }
        assert.deepEqual(actual, expected, `level ${level.id}`);
        assert.equal(new Set(level.foods.map(({ slot }) => slot.join(','))).size, level.foods.length);
    }
});

test('the new boards preserve their two recipes and direct blocker relationships', () => {
    const expected = [
        [7, { bun: 1, teaEgg: 1 }, { riceCake: 1, corn: 1, soyMilk: 1 },
            { teaEgg: ['riceCake'], soyMilk: ['teaEgg'] }],
        [8, { soyMilk: 1, bun: 1, teaEgg: 1 }, { riceCake: 1, corn: 1, flowerRoll: 1 },
            { teaEgg: ['riceCake', 'corn'] }],
        [9, { riceCake: 1, corn: 1, flowerRoll: 1 }, { soyMilk: 1, bun: 1, teaEgg: 1 },
            { teaEgg: ['riceCake', 'corn'] }],
        [10, { bun: 1, soyMilk: 1, teaEgg: 1 }, { riceCake: 1, oilStick: 1, flowerRoll: 1 },
            { riceCake: ['bun'], flowerRoll: ['oilStick'], teaEgg: ['flowerRoll'] }],
        [11, { bun: 2, teaEgg: 1 }, { bun: 1, soyMilk: 1, sweetPotato: 1 },
            { teaEgg: ['bun-left', 'bun-right'] }],
        [12, { bun: 2, sweetPotato: 1, teaEgg: 1 }, { bun: 1, riceCake: 1, oilStick: 1 },
            { 'bun-middle': ['riceCake'], teaEgg: ['bun-middle', 'oilStick'], sweetPotato: ['bun-back'] }],
    ];
    for (const [id, first, second, blockers] of expected) {
        const level = LEVELS.find((candidate) => candidate.id === id);
        assert.ok(level, `missing level ${id}`);
        assert.deepEqual(level.orders, [{ id: 'A', needs: first }, { id: 'B', needs: second }]);
        const actual = Object.fromEntries(level.foods
            .filter(({ blockedBy }) => blockedBy.length)
            .map((food) => [food.id, food.blockedBy]));
        assert.deepEqual(actual, blockers, `level ${id}`);
    }
});

test('all allowed order choices reproduce the documented solution minima', () => {
    const actual = LEVELS.map((level) => ['A', ...(level.mode === 'choose' ? ['B'] : [])]
        .map((orderId) => lowestPeak(start(level.id, orderId))));
    assert.deepEqual(actual, [[0], [1], [1], [null, 0], [1, 2], [1, 0],
        [1], [2], [0, 2], [2, 1], [0], [2, 0]]);
    assert.equal(lowestPeak(take(start(6, 'A'), 'bun-visible').state), 2);
});

test('the published example routes clear each board with the expected staging', () => {
    const routes = [
        [1, 'A', ['soyMilk', 'bun'], 0],
        [2, 'A', ['soyMilk', 'bun', 'riceCake', 'teaEgg', 'corn'], 1],
        [3, 'A', ['soyMilk', 'bun', 'riceCake', 'teaEgg', 'corn', 'flowerRoll'], 1],
        [4, 'B', ['riceCake', 'corn', 'flowerRoll', 'teaEgg', 'soyMilk'], 0],
        [5, 'A', ['bun', 'riceCake', 'teaEgg', 'soyMilk', 'corn'], 1],
        [5, 'B', ['corn', 'bun', 'riceCake', 'teaEgg', 'soyMilk'], 2],
        [6, 'A', ['riceCake', 'bun-under-rice', 'teaEgg', 'soyMilk', 'bun-visible', 'corn'], 1],
        [6, 'B', ['riceCake', 'corn', 'bun-visible', 'bun-under-rice', 'teaEgg', 'soyMilk'], 0],
        [7, 'A', ['bun', 'riceCake', 'teaEgg', 'soyMilk', 'corn'], 1],
        [8, 'A', ['bun', 'soyMilk', 'riceCake', 'corn', 'teaEgg', 'flowerRoll'], 2],
        [9, 'A', ['riceCake', 'corn', 'flowerRoll', 'teaEgg', 'soyMilk', 'bun'], 0],
        [9, 'B', ['soyMilk', 'bun', 'riceCake', 'corn', 'teaEgg', 'flowerRoll'], 2],
        [10, 'A', ['bun', 'soyMilk', 'oilStick', 'flowerRoll', 'teaEgg', 'riceCake'], 2],
        [10, 'B', ['oilStick', 'flowerRoll', 'bun', 'riceCake', 'soyMilk', 'teaEgg'], 1],
        [11, 'A', ['bun-left', 'bun-right', 'teaEgg', 'bun-front', 'soyMilk', 'sweetPotato'], 0],
        [11, 'A', ['bun-front', 'bun-left', 'bun-right', 'teaEgg', 'soyMilk', 'sweetPotato'], 1],
        [12, 'A', ['bun-back', 'sweetPotato', 'riceCake', 'bun-middle', 'oilStick', 'teaEgg', 'bun-front'], 2],
        [12, 'B', ['riceCake', 'oilStick', 'bun-front', 'bun-back', 'bun-middle', 'sweetPotato', 'teaEgg'], 0],
    ];
    for (const [level, order, route, peak] of routes) {
        const state = play(start(level, order), route);
        assert.equal(state.status, 'won');
        assert.equal(state.peakStaged, peak);
    }
});

test('level 7 seals the first order and immediately moves the staged rice cake into the next one', () => {
    const beforeSeal = play(start(7, 'A'), ['bun', 'riceCake']);
    assert.deepEqual(beforeSeal.stagedFoodIds, ['riceCake']);
    assert.equal(take(beforeSeal, 'soyMilk').rejection, 'blocked');
    const result = take(beforeSeal, 'teaEgg');
    assert.deepEqual(result.events, [
        { type: 'toOrder', foodId: 'teaEgg', orderId: 'A' },
        { type: 'revealed', foodId: 'soyMilk' },
        { type: 'sealed', orderId: 'A' },
        { type: 'toOrder', foodId: 'riceCake', orderId: 'B' },
    ]);
    assert.equal(result.state.activeOrderId, 'B');
    assert.deepEqual(result.state.stagedFoodIds, []);
});

test('level 8 can recover after staging the flower roll with either of the tea egg blockers', () => {
    for (const [staged, remaining] of [['riceCake', 'corn'], ['corn', 'riceCake']]) {
        const stuck = play(start(8, 'A'), ['bun', 'soyMilk', staged, 'flowerRoll']);
        assert.equal(stuck.status, 'stuck');
        assert.deepEqual(stuck.stagedFoodIds, [staged, 'flowerRoll']);
        assert.deepEqual(getBlockers(stuck, 'teaEgg'), [remaining]);
        const restored = applyAction(stuck, { type: 'undo' }).state;
        assert.deepEqual(restored.stagedFoodIds, [staged]);
        assert.equal(play(restored, [remaining, 'teaEgg', 'flowerRoll']).status, 'won');
    }
});

test('level 10 can recover from full trays with either starting order', () => {
    const first = play(start(10, 'A'), ['bun', 'soyMilk', 'riceCake', 'oilStick']);
    assert.equal(first.status, 'stuck');
    assert.deepEqual(first.stagedFoodIds, ['riceCake', 'oilStick']);
    assert.deepEqual(getBlockers(first, 'teaEgg'), ['flowerRoll']);
    const repeated = applyAction(first, { type: 'restart' }).state;
    const chosen = applyAction(repeated, { type: 'select', orderId: 'A' }).state;
    assert.equal(play(chosen, ['bun', 'soyMilk', 'oilStick', 'flowerRoll', 'teaEgg', 'riceCake']).status, 'won');

    const second = play(start(10, 'B'), ['soyMilk', 'oilStick', 'flowerRoll', 'teaEgg']);
    assert.equal(second.status, 'stuck');
    assert.deepEqual(second.stagedFoodIds, ['soyMilk', 'teaEgg']);
    assert.deepEqual(getBlockers(second, 'riceCake'), ['bun']);
    const restoredSecond = applyAction(second, { type: 'undo' }).state;
    assert.equal(play(restoredSecond, ['bun', 'riceCake', 'teaEgg']).status, 'won');
});

test('level 12 gets stuck if order A uses both bun slots before taking the middle bun', () => {
    const stuck = play(start(12, 'A'), ['bun-front', 'bun-back', 'sweetPotato', 'riceCake', 'oilStick']);
    assert.equal(stuck.status, 'stuck');
    assert.equal(stuck.remainingByOrder.A.bun, 0);
    assert.deepEqual(stuck.stagedFoodIds, ['riceCake', 'oilStick']);
    assert.deepEqual(getBlockers(stuck, 'teaEgg'), ['bun-middle']);
    const restored = applyAction(stuck, { type: 'undo' }).state;
    assert.equal(restored.status, 'playing');
    assert.equal(take(restored, 'bun-middle').state.status, 'stuck');
});

test('level 3 deadlock can be undone and level 4 can be restarted with another order', () => {
    const stuck = play(start(3, 'A'), ['soyMilk', 'bun', 'corn', 'flowerRoll']);
    assert.equal(stuck.status, 'stuck');
    const restored = applyAction(stuck, { type: 'undo' }).state;
    assert.deepEqual(restored.stagedFoodIds, ['corn']);
    assert.equal(play(restored, ['riceCake', 'teaEgg', 'flowerRoll']).status, 'won');

    const wrongFirst = play(start(4, 'A'), ['soyMilk', 'riceCake', 'corn']);
    assert.equal(wrongFirst.status, 'stuck');
    const restart = applyAction(wrongFirst, { type: 'restart' }).state;
    assert.equal(restart.status, 'awaitingChoice');
    const other = applyAction(restart, { type: 'select', orderId: 'B' }).state;
    assert.equal(play(other, ['riceCake', 'corn', 'flowerRoll', 'teaEgg', 'soyMilk']).status, 'won');
});
