const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

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
assert.equal(JSON.parse(read('package.json')).private, true);
console.log('Monorepo layout checks passed.');
