const { spawnSync } = require('node:child_process');
const { statSync } = require('node:fs');
const path = require('node:path');

const projectDir = path.resolve(__dirname, '..');
function findRepoRoot(start) {
    let current = start;
    while (true) {
        if (statSync(path.join(current, '.tooling'), { throwIfNoEntry: false })?.isDirectory()) return current;
        const parent = path.dirname(current);
        if (parent === current) throw new Error('无法从启动脚本向上找到包含 .tooling 的仓库根。');
        current = parent;
    }
}
const repoDir = findRepoRoot(__dirname);
const creator = process.env.COCOS_CREATOR_BIN || path.join(
    repoDir, '.tooling/apps/CocosCreator.app/Contents/MacOS/CocosCreator',
);
function findCreatorApp(executable) {
    const app = executable.split('.app/')[0] + '.app';
    if (app === executable) throw new Error('macOS Creator 可执行文件必须位于 .app 内，或用 COCOS_CREATOR_BIN 指定正确路径。');
    return app;
}
const result = process.platform === 'darwin'
    ? spawnSync('open', ['-a', findCreatorApp(creator), '--args', '--project', projectDir], { stdio: 'inherit' })
    : spawnSync(creator, ['--project', projectDir], { stdio: 'inherit' });
if (result.error) {
    console.error(`无法启动 Cocos Creator。请检查 ${creator}，或用 COCOS_CREATOR_BIN 指定可执行文件。`);
    console.error(result.error.message);
    process.exit(1);
}
if (result.signal) {
    console.error(`Cocos Creator 启动被信号 ${result.signal} 终止。`);
    process.exit(1);
}
process.exit(result.status ?? 1);
