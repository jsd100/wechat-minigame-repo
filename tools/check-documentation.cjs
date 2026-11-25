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

// Only these two historical navigation targets changed during the archive move.
// Do not validate old source paths or other historical facts in these documents.
for (const [relative, target] of [
    ['docs/superpowers/verification/2026-11-20-breakfast-stall-sample.md', '../../archive/monorepo-migration.md'],
    ['docs/superpowers/specs/2026-11-23-minigame-monorepo-design.md', '../../archive/monorepo-execution.md'],
]) {
    const file = path.join(root, relative);
    const source = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
    if (!source.includes(`](${target})`)) failures.push(`${relative}: archive navigation must target ${target}`);
    const resolved = path.resolve(path.dirname(file), target);
    if (!existsSync(resolved) || !statSync(resolved).isFile()) failures.push(`${relative}: missing archive target ${target}`);
}

if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
}
console.log('Documentation navigation and archive links passed.');
