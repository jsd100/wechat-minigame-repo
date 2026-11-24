const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

const game = path.resolve(__dirname, '..');
const read = relative => readFileSync(path.join(game, relative), 'utf8');
const manifest = JSON.parse(read('package.json'));
assert.equal(manifest.uuid, '971ca89b-52c5-4df6-833b-2fa2525ec12c');
assert.equal(manifest.creator.version, '3.8.8');
const config = JSON.parse(read('build.wechatgame.release.json'));
assert.equal(config.outputName, 'wechatgame-breakfast-release');
assert.equal(config.packages.wechatgame.appid, 'wx136b6cd4db8ee9c0');

for (const relative of [
    'package.json', 'tsconfig.json', 'assets/main.scene', 'assets/main.scene.meta',
    'settings/cocos-creator-mcp.json', 'build.wechatgame.json', 'build.wechatgame.release.json',
    'extensions/breakfast-startup/builder.js', 'extensions/breakfast-startup/hooks.js',
    'extensions/breakfast-startup/package.json', 'extensions/breakfast-startup/breakfast-start.jpg',
    'extensions/breakfast-startup/breakfast-start-art.jpg',
]) assert.ok(existsSync(path.join(game, relative)), `missing breakfast project file ${relative}`);

const scriptMeta = JSON.parse(read('assets/breakfast/runtime/BreakfastGame.ts.meta'));
const scene = JSON.parse(read('assets/main.scene'));
const gameNode = scene.find(item => item._name === 'Breakfast Game' && item.__type__ === 'cc.Node');
assert.ok(gameNode, 'Breakfast Game node must exist');
const component = gameNode._components.map(reference => scene[reference.__id__]);
const scriptComponent = component.find(item => item?.__type__ === '7ab9fJX3ypFuK7Xmel041GX');
assert.ok(scriptComponent, 'Breakfast Game component must reference its script meta UUID');
assert.ok(scriptMeta.uuid, 'BreakfastGame script meta must retain its UUID');
console.log('Breakfast project checks passed.');
