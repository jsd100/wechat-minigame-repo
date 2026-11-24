const assert = require('node:assert/strict');
const { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const projectDir = path.resolve(__dirname, '../..');
const checker = path.join(__dirname, '../check-project.cjs');
const metadataPath = 'assets/breakfast/runtime/BreakfastGame.ts.meta';

function checkWithMetadata(uuid) {
    const fixture = mkdtempSync(path.join(tmpdir(), 'breakfast-project-check-'));
    try {
        cpSync(checker, path.join(fixture, 'tools/check-project.cjs'));
        for (const entry of ['assets', 'settings', 'extensions']) {
            cpSync(path.join(projectDir, entry), path.join(fixture, entry), { recursive: true });
        }
        for (const entry of ['package.json', 'tsconfig.json', 'build.wechatgame.json', 'build.wechatgame.release.json']) {
            cpSync(path.join(projectDir, entry), path.join(fixture, entry));
        }
        const metadata = JSON.parse(readFileSync(path.join(fixture, metadataPath), 'utf8'));
        if (uuid === undefined) delete metadata.uuid;
        else metadata.uuid = uuid;
        writeFileSync(path.join(fixture, metadataPath), JSON.stringify(metadata, null, 2));
        return spawnSync(process.execPath, [path.join(fixture, 'tools/check-project.cjs')], { encoding: 'utf8' });
    } finally {
        rmSync(fixture, { recursive: true, force: true });
    }
}

test('scene component rejects a mismatched script metadata UUID', () => {
    const result = checkWithMetadata('11111111-2222-4333-8444-555555555555');
    assert.notEqual(result.status, 0, 'a stale scene reference must not pass with different metadata');
    assert.match(result.stderr, /Breakfast Game component/);
});

test('scene component rejects a missing script metadata UUID', () => {
    const result = checkWithMetadata(undefined);
    assert.notEqual(result.status, 0, 'a scene reference must not pass without metadata identity');
    assert.match(result.stderr, /BreakfastGame script meta/);
});

test('scene component accepts its current script metadata association', () => {
    const result = spawnSync(process.execPath, [checker], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
});
