const { spawnSync } = require('node:child_process');
const { mkdtempSync, readdirSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const projectDir = path.resolve(__dirname, '..');
const sourceDir = path.join(projectDir, 'assets/breakfast');
const outDir = mkdtempSync(path.join(tmpdir(), 'breakfast-rules-'));
function checkSpawn(result, command) {
    if (result.error) {
        console.error(`${command} 启动失败：${result.error.message}`);
        return 1;
    }
    if (result.signal) {
        console.error(`${command} 被信号 ${result.signal} 终止。`);
        return 1;
    }
    return result.status ?? 1;
}
try {
    const runtimeModules = [
        'progress', 'TapSequence', 'order-presentation', 'FoodRelief', 'food-contours',
        'hud-hit', 'help-demo', 'footer-layout', 'BreakfastMesh', 'board-spacing',
    ];
    const sources = [
        path.join(projectDir, 'tests/types/cc.d.ts'),
        ...readdirSync(path.join(sourceDir, 'core')).filter((file) => file.endsWith('.ts')).map((file) => path.join(sourceDir, 'core', file)),
        ...runtimeModules.map((file) => path.join(sourceDir, 'runtime', `${file}.ts`)),
    ];
    const tsc = require.resolve('typescript/bin/tsc');
    let result = spawnSync(process.execPath, [
        tsc, '--strict', '--skipLibCheck', '--module', 'commonjs', '--target', 'ES2022',
        '--rootDir', sourceDir, '--outDir', outDir, ...sources,
    ], { stdio: 'inherit' });
    let exitCode = checkSpawn(result, 'TypeScript 编译');
    if (exitCode === 0) {
        const tests = readdirSync(path.join(projectDir, 'tests')).filter((file) => file.endsWith('.test.cjs'))
            .map((file) => path.join(projectDir, 'tests', file));
        result = spawnSync(process.execPath, ['--test', ...tests], {
            stdio: 'inherit', env: { ...process.env, BREAKFAST_TEST_DIR: outDir },
        });
        exitCode = checkSpawn(result, 'Node 测试');
    }
    process.exitCode = exitCode;
} finally {
    rmSync(outDir, { recursive: true, force: true });
}
