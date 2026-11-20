const assert = require('node:assert/strict');
const { join } = require('node:path');
const { test } = require('node:test');
const { loadProgress, saveProgress, recordWin } = require(join(process.env.BREAKFAST_TEST_DIR, 'runtime/progress.js'));

const key = 'breakfast-stall.progress.v1';
const defaults = { unlocked: 1, wins: {}, sound: true, reduceMotion: false };

function memory(contents) {
    const data = new Map(contents === undefined ? [] : [[key, contents]]);
    return {
        getItem: (name) => data.get(name) ?? null,
        setItem: (name, value) => data.set(name, value),
    };
}

test('missing or malformed save starts at level 1', () => {
    for (const value of [undefined, 'oops', 'null', '[]', '{"unlocked":6, "wins":{"3":{"peakStaged":-1}}}']) {
        assert.deepEqual(loadProgress(memory(value)), defaults);
    }
});

test('winning unlocks next level and keeps best score', () => {
    const one = recordWin(defaults, 1, 2, false);
    assert.equal(one.unlocked, 2);
    const better = recordWin(one, 1, 1, true);
    assert.deepEqual(better.wins[1], { peakStaged: 1, clean: true });
    assert.deepEqual(defaults.wins, {});
    assert.deepEqual(recordWin(better, 1, 2, true).wins, better.wins);
    assert.equal(recordWin(better, 5, 0, false), better);
});

test('a saved final win in the six- or nine-level version unlocks the next board', () => {
    const wins = {
        1: { peakStaged: 0, clean: true },
        2: { peakStaged: 1, clean: true },
        3: { peakStaged: 1, clean: false },
        4: { peakStaged: 0, clean: true },
        5: { peakStaged: 2, clean: true },
        6: { peakStaged: 0, clean: false },
    };
    const sixLevelSave = { unlocked: 6, wins, sound: false, reduceMotion: true };
    const nineLevelSave = {
        ...sixLevelSave,
        unlocked: 9,
        wins: {
            ...wins,
            7: { peakStaged: 1, clean: false },
            8: { peakStaged: 2, clean: true },
            9: { peakStaged: 0, clean: true },
        },
    };
    assert.deepEqual(loadProgress(memory(JSON.stringify(sixLevelSave))), { ...sixLevelSave, unlocked: 7 });
    assert.deepEqual(loadProgress(memory(JSON.stringify(nineLevelSave))), { ...nineLevelSave, unlocked: 10 });
    const incomplete = { ...sixLevelSave, wins: { ...wins, 5: undefined } };
    assert.deepEqual(loadProgress(memory(JSON.stringify(incomplete))), {
        ...incomplete, unlocked: 5,
        wins: { 1: wins[1], 2: wins[2], 3: wins[3], 4: wins[4] },
    });
});

test('finishing level 12 stays at the last board and persists its result', () => {
    let progress = defaults;
    for (let i = 1; i < 12; i++) progress = recordWin(progress, i, 1, false);
    assert.equal(progress.unlocked, 12);
    assert.equal(progress.wins[12], undefined);
    const final = recordWin(progress, 12, 2, true);
    assert.equal(final.unlocked, 12);
    assert.deepEqual(final.wins[12], { peakStaged: 2, clean: false });
    assert.equal(recordWin(final, 13, 0, false), final);
    const storage = memory();
    saveProgress(storage, final);
    assert.deepEqual(loadProgress(storage), final);
});

test('settings survive restart independently of progress', () => {
    const storage = memory();
    const current = { ...recordWin(defaults, 1, 0, false), sound: false, reduceMotion: true };
    saveProgress(storage, current);
    assert.deepEqual(loadProgress(storage), current);
});

test('a storage error allows play to continue', () => {
    const storage = {
        getItem() { throw new Error('denied'); },
        setItem() { throw new Error('quota'); },
    };
    assert.deepEqual(loadProgress(storage), defaults);
    assert.doesNotThrow(() => saveProgress(storage, recordWin(defaults, 1, 0, false)));
});
