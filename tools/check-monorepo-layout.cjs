const assert = require('node:assert/strict');
const { existsSync, readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');

// Generic workspace contract. Game identity belongs to each game's own check.
const root = path.resolve(process.argv[2] || path.resolve(__dirname, '..'));
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const has = (relative) => existsSync(path.join(root, relative));
const manifest = JSON.parse(read('package.json'));
assert.equal(manifest.private, true, 'the workspace root must be private');
assert.deepEqual(manifest.workspaces, ['games/*', '.tooling']);
assert.equal(manifest.engines.node, '>=24 <25');
assert.equal(manifest.devDependencies?.typescript, '5.9.3');
assert.equal(has('project.config.json'), false, 'the repository root is not a WeChat runtime entry');

const lock = JSON.parse(read('package-lock.json'));
for (const [location, entry] of Object.entries(lock.packages)) {
    if (location.includes('node_modules/') && entry.version && !entry.link) {
        assert.ok(entry.resolved, `${location} must pin its registry source`);
        assert.ok(entry.integrity, `${location} must pin its registry integrity`);
    }
}
const workspacePaths = ['', '.tooling'];
const gamesRoot = path.join(root, 'games');
if (existsSync(gamesRoot)) {
    for (const entry of readdirSync(gamesRoot, { withFileTypes: true })) {
        if (entry.isDirectory()) workspacePaths.push(`games/${entry.name}`);
    }
}
for (const path of workspacePaths) {
    if (!has(`${path ? `${path}/` : ''}package.json`)) continue;
    const source = JSON.parse(read(`${path ? `${path}/` : ''}package.json`));
    const entry = lock.packages[path];
    assert.ok(entry, `${path || '<root>'} must have a lockfile workspace entry`);
    for (const key of ['dependencies', 'devDependencies']) {
        assert.deepEqual(entry[key] || {}, source[key] || {}, `${path || '<root>'} ${key} must match its manifest`);
    }
}
for (const directory of ['build', 'library', 'local', 'profiles', 'temp']) {
    assert.match(read('.gitignore'), new RegExp(`^/games/\\*/${directory}/$`, 'm'));
}
const gamesDir = path.join(root, 'games');
const games = existsSync(gamesDir)
    ? readdirSync(gamesDir, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
    : [];
assert.ok(games.length > 0, 'at least one game workspace is required');
const outputNames = new Set();
for (const game of games) {
    const gameManifest = JSON.parse(read(`games/${game}/package.json`));
    assert.ok(gameManifest.scripts?.check, `games/${game} must own its check script`);
    const config = JSON.parse(read(`games/${game}/build.wechatgame.release.json`));
    assert.ok(config.outputName, `games/${game} must declare an outputName`);
    assert.equal(outputNames.has(config.outputName), false, `duplicate WeChat output name: ${config.outputName}`);
    outputNames.add(config.outputName);
}
console.log('Monorepo generic layout checks passed.');
