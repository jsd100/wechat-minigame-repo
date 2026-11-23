const fs = require('node:fs');
const path = require('node:path');

const specifier = process.argv[2];
if (!specifier) {
    console.error('Usage: node resolve-mcp-module.cjs <module-specifier>');
    process.exit(2);
}
try {
    const paths = [path.resolve(__dirname, '../../node_modules'), path.resolve(__dirname, '..')];
    try {
        process.stdout.write(require.resolve(specifier, { paths }));
    } catch (error) {
        if (error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw error;
        const segments = specifier.split('/');
        const packageName = specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
        const packageEntry = require.resolve(packageName, { paths });
        let packageDir = path.dirname(packageEntry);
        while (packageDir !== path.dirname(packageDir)) {
            if (fs.existsSync(path.join(packageDir, 'package.json'))) break;
            packageDir = path.dirname(packageDir);
        }
        const entry = specifier.slice(packageName.length).replace(/^\//, '');
        const modulePath = path.join(packageDir, entry);
        if (!fs.existsSync(modulePath)) throw new Error(`Resolved module does not exist: ${modulePath}`);
        process.stdout.write(modulePath);
    }
} catch (error) {
    console.error(`Cannot resolve shared MCP module ${specifier}: ${error.message}`);
    process.exit(1);
}
