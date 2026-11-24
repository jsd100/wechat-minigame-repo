const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync, statSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const failures = [];
const required = [
    'docs/getting-started.md',
    'docs/archive/README.md',
    'docs/archive/monorepo-execution.md',
    'docs/archive/monorepo-migration.md',
];
for (const relative of required) {
    if (!existsSync(path.join(root, relative))) failures.push(`missing required documentation: ${relative}`);
}
for (const relative of ['docs/monorepo-execution.md', 'docs/monorepo-migration.md']) {
    if (existsSync(path.join(root, relative))) failures.push(`archive remains in daily docs: ${relative}`);
}

const tracked = execFileSync('git', ['ls-files', '-z', '--', '*.md'], { cwd: root, encoding: 'utf8' })
    .split('\0').filter(Boolean).filter(relative => !relative.startsWith('docs/superpowers/') && !relative.includes('/extensions/'));
for (const relative of tracked) {
    const file = path.join(root, relative);
    const source = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
    for (const match of source.matchAll(/(?<!!)\[[^\]]*\]\(([^)]+)\)/g)) {
        const target = match[1].trim();
        if (/^(?:https?:|mailto:|#)/.test(target)) continue;
        const clean = target.replace(/^<|>$/g, '').split('#')[0];
        if (!clean) continue;
        if (/^docs\/monorepo-(?:execution|migration)\.md$/.test(clean)) {
            failures.push(`${relative}: links to unarchived ${clean}`);
        }
        const resolved = path.resolve(path.dirname(file), decodeURIComponent(clean));
        if (!existsSync(resolved)) failures.push(`${relative}: broken local link ${target}`);
        else if (!statSync(resolved).isFile()) failures.push(`${relative}: link is not a file ${target}`);
    }
}

if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
}
console.log('Documentation navigation and archive links passed.');
