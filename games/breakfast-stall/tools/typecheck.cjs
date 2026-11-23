const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const path = require('node:path');

const projectDir = path.resolve(__dirname, '..');
const sources = [];
for (const folder of ['core', 'runtime']) {
    const directory = path.join(projectDir, 'assets/breakfast', folder);
    sources.push(...readdirSync(directory).filter((file) => file.endsWith('.ts')).map((file) => path.join(directory, file)));
}
const result = spawnSync(process.execPath, [
    require.resolve('typescript/bin/tsc'), '--noEmit', '--skipLibCheck', '--target', 'ES2015',
    '--module', 'es2015', '--moduleResolution', 'node', '--experimentalDecorators',
    path.join(projectDir, 'temp/declarations/cc.d.ts'), ...sources,
], { stdio: 'inherit' });
process.exit(result.status ?? 1);
