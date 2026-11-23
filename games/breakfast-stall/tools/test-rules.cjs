const { spawnSync } = require('node:child_process');
const { mkdtempSync, readdirSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const projectDir = path.resolve(__dirname, '..');
const sourceDir = path.join(projectDir, 'assets/breakfast');
const outDir = mkdtempSync(path.join(tmpdir(), 'breakfast-rules-'));
const runtimeModules = [
    'progress', 'TapSequence', 'order-presentation', 'FoodRelief', 'food-contours',
    'hud-hit', 'help-demo', 'footer-layout', 'BreakfastMesh', 'board-spacing',
];
const sources = [
    path.join(projectDir, 'temp/declarations/cc.d.ts'),
    ...readdirSync(path.join(sourceDir, 'core')).filter((file) => file.endsWith('.ts')).map((file) => path.join(sourceDir, 'core', file)),
    ...runtimeModules.map((file) => path.join(sourceDir, 'runtime', `${file}.ts`)),
];
const tsc = require.resolve('typescript/bin/tsc');
let result = spawnSync(process.execPath, [
    tsc, '--strict', '--skipLibCheck', '--module', 'commonjs', '--target', 'ES2022',
    '--rootDir', sourceDir, '--outDir', outDir, ...sources,
], { stdio: 'inherit' });
if (result.status === 0) {
    const tests = readdirSync(path.join(projectDir, 'tests')).filter((file) => file.endsWith('.test.cjs'))
        .map((file) => path.join(projectDir, 'tests', file));
    result = spawnSync(process.execPath, ['--test', ...tests], {
        stdio: 'inherit', env: { ...process.env, BREAKFAST_TEST_DIR: outDir },
    });
}
rmSync(outDir, { recursive: true, force: true });
process.exit(result.status ?? 1);
