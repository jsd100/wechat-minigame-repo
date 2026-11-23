const assert = require('node:assert/strict');
const { join } = require('node:path');
const { test } = require('node:test');
const { TapSequence } = require(join(process.env.BREAKFAST_TEST_DIR, 'runtime/TapSequence.js'));

test('concurrent contacts produce one tap even when released in a later frame', () => {
    const sequence = new TapSequence();
    sequence.begin(8);
    sequence.begin(9);
    assert.equal(sequence.end(8), true);
    sequence.begin(10);
    assert.equal(sequence.end(9), false);
    assert.equal(sequence.end(10), false);
    sequence.begin(11);
    assert.equal(sequence.end(11), true);
});

test('a held contact across reset and a duplicate end cannot activate anything', () => {
    const sequence = new TapSequence();
    sequence.begin(2);
    sequence.reset();
    assert.equal(sequence.end(2), false);
    sequence.begin(2);
    assert.equal(sequence.end(2), true);
    assert.equal(sequence.end(2), false);
});

test('releasing a secondary before the primary leaves ownership with the primary', () => {
    const sequence = new TapSequence();
    sequence.begin(1);
    sequence.begin(2);
    assert.equal(sequence.end(2), false);
    assert.equal(sequence.end(1), true);
});
