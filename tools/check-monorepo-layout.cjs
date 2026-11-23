const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const game = path.join(root, 'games/breakfast-stall');
const has = (relative) => existsSync(path.join(root, relative));
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');

for (const relative of [
    'package.json', 'tsconfig.json', 'assets/main.scene', 'assets/main.scene.meta',
    'assets/breakfast/core/rules.ts', 'assets/breakfast/core/rules.ts.meta',
    'settings/cocos-creator-mcp.json', 'build.wechatgame.json', 'build.wechatgame.release.json',
    'extensions/breakfast-startup/builder.js', 'extensions/breakfast-startup/hooks.js',
    'extensions/breakfast-startup/package.json', 'extensions/breakfast-startup/breakfast-start.jpg',
    'extensions/breakfast-startup/breakfast-start-art.jpg',
]) assert.ok(existsSync(path.join(game, relative)), `missing games/breakfast-stall/${relative}`);
assert.equal(has('cocos-game/package.json'), false, 'the old Creator manifest must not remain');
const manifest = JSON.parse(read('games/breakfast-stall/package.json'));
assert.equal(manifest.uuid, '971ca89b-52c5-4df6-833b-2fa2525ec12c');
assert.equal(manifest.creator.version, '3.8.8');
const config = JSON.parse(read('games/breakfast-stall/build.wechatgame.release.json'));
assert.equal(config.outputName, 'wechatgame-breakfast-release');
assert.equal(config.packages.wechatgame.appid, 'wx136b6cd4db8ee9c0');
assert.match(read('games/breakfast-stall/assets/main.scene'), /7ab9fJX3ypFuK7Xmel041GX/);
for (const directory of ['build', 'library', 'local', 'profiles', 'temp']) {
    assert.match(read('.gitignore'), new RegExp(`^/games/\\*/${directory}/$`, 'm'));
}
const rootManifest = JSON.parse(read('package.json'));
assert.equal(rootManifest.private, true);
assert.deepEqual(rootManifest.workspaces, ['games/*', '.tooling']);
assert.equal(rootManifest.engines.node, '>=24 <25');
assert.equal(rootManifest.devDependencies.typescript, '5.9.3');
assert.equal(has('package-lock.json'), true, 'the root npm lockfile must exist');
const lock = JSON.parse(read('package-lock.json'));
for (const [location, entry] of Object.entries(lock.packages)) {
    if (location.includes('node_modules/') && entry.version && !entry.link) {
        assert.ok(entry.resolved, `${location} must pin its registry source`);
        assert.ok(entry.integrity, `${location} must pin its registry integrity`);
    }
}
const toolingManifest = JSON.parse(read('.tooling/package.json'));
const launcher = read('.tooling/bin/mini-ai-mcp');
assert.doesNotMatch(launcher, /"\$tooling_dir\/node_modules\/\$module"/);
for (const [specifier, entry] of [
    ['@weadmin/weixin-minigame-helper-mcp/mcp/index.js', 'mcp/index.js'],
    ['@cloudbase/cloudbase-mcp/dist/cli.cjs', 'dist/cli.cjs'],
]) {
    const packageName = specifier.split('/').slice(0, 2).join('/');
    const location = Object.keys(lock.packages).find((key) => key.endsWith(`node_modules/${packageName}`));
    assert.ok(location, `${packageName} must be in the root npm lockfile`);
    assert.equal(lock.packages[location].version, toolingManifest.dependencies[packageName]);
    const resolved = execFileSync(process.execPath, [
        '.tooling/bin/resolve-mcp-module.cjs', specifier,
    ], { cwd: root, encoding: 'utf8' });
    assert.equal(resolved, path.join(root, location, entry));
}
assert.equal(has('project.config.json'), false, 'the invalid root WeChat entry must be removed');
for (const relative of ['README.md', 'AGENTS.md', '环境使用说明.md', 'docs/开发排障与测试手册.md']) {
    assert.ok(has(relative), `missing current guide ${relative}`);
    const content = read(relative);
    assert.match(content, /games\/breakfast-stall\//, `${relative} must use the game workspace`);
    assert.equal(content.includes('cocos-game/'), false, `${relative} must not use the old Creator path`);
    assert.equal(content.includes('.tooling/node_modules/.bin/tsc'), false, `${relative} must use the root TypeScript entry`);
}
for (const relative of ['README.md', '环境使用说明.md', 'docs/开发排障与测试手册.md']) {
    const content = read(relative);
    assert.match(content, /npm test/);
    assert.match(content, /npm run typecheck/);
    assert.match(content, /npm run build:breakfast/);
}
console.log('Monorepo layout checks passed.');
