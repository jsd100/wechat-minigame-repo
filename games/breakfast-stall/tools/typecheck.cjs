const { spawnSync } = require('node:child_process');
const { existsSync, readdirSync } = require('node:fs');
const path = require('node:path');
const projectDir = path.resolve(__dirname, '..');
const declarations = path.join(projectDir, 'temp/declarations/cc.d.ts');
if (!existsSync(declarations)) {
    console.error('缺少 Creator 生成的 temp/declarations/cc.d.ts。请先打开本工程完成 Creator 导入，再运行完整类型检查。');
    process.exit(1);
}
const sources = [];
for (const folder of ['core', 'runtime']) {
    const directory = path.join(projectDir, 'assets/breakfast', folder);
    sources.push(...readdirSync(directory).filter((file) => file.endsWith('.ts')).map((file) => path.join(directory, file)));
}
const result = spawnSync(process.execPath, [
    require.resolve('typescript/bin/tsc'), '--noEmit', '--skipLibCheck', '--target', 'ES2015',
    '--module', 'es2015', '--moduleResolution', 'node', '--experimentalDecorators',
    declarations, ...sources,
], { stdio: 'inherit' });
if (result.error) {
    console.error(`TypeScript 类型检查启动失败：${result.error.message}`);
    process.exit(1);
}
if (result.signal) {
    console.error(`TypeScript 类型检查被信号 ${result.signal} 终止。`);
    process.exit(1);
}
process.exit(result.status ?? 1);
