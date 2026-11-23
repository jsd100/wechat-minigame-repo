const { spawnSync } = require('node:child_process');
const { readFileSync, statSync } = require('node:fs');
const path = require('node:path');

const projectDir = path.resolve(__dirname, '..');
const configPath = path.join(projectDir, 'build.wechatgame.release.json');
const { buildPath, outputName } = require(configPath);
const outputDir = path.resolve(projectDir, buildPath.replace(/^project:\/\//, ''), outputName);
const creator = process.env.COCOS_CREATOR_BIN || path.resolve(
    projectDir, '../.tooling/apps/CocosCreator.app/Contents/MacOS/CocosCreator',
);

const result = spawnSync(creator, ['--project', projectDir, '--build', `configPath=${configPath}`], {
    cwd: projectDir,
    stdio: 'inherit',
});

if (result.error) {
    console.error(`无法启动 Cocos Creator。请检查 ${creator}，或用 COCOS_CREATOR_BIN 指定可执行文件。`);
    console.error(result.error.message);
    process.exit(1);
}

// Cocos Creator 3.8 uses 36 as its successful build exit code.
if (result.status !== 36) {
    console.error(`微信小游戏构建失败（Cocos ${result.signal || `退出码 ${result.status}`}）。`);
    process.exit(result.status || 1);
}

for (const filename of ['game.js', 'game.json', 'project.config.json', 'first-screen.js', 'breakfast-start.jpg']) {
    const file = path.join(outputDir, filename);
    if (!statSync(file, { throwIfNoEntry: false })?.isFile()) {
        console.error(`微信小游戏构建产物缺少 ${file}`);
        process.exit(1);
    }
}

const firstScreen = readFileSync(path.join(outputDir, 'first-screen.js'), 'utf8');
if (!firstScreen.includes('let bgName = "breakfast-start.jpg";') || !firstScreen.includes('let useLogo = false;')) {
    console.error('微信小游戏构建未应用自定义启动页，请检查早餐摊微信启动页扩展是否启用。');
    process.exit(1);
}

console.log(`微信小游戏发布包已生成于 ${outputDir}`);
