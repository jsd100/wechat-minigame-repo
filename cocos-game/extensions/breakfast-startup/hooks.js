const fs = require('node:fs');
const path = require('node:path');

const cover = 'breakfast-start.jpg';
const splashStyle = {
    useCustomBg: 'true',
    useLogo: 'false',
    bgName: JSON.stringify(cover),
    // Creator uses aspect-fill when both fitting flags are false.
    fitWidth: 'false',
    fitHeight: 'false',
    bgColor: '[12 / 255, 63 / 255, 54 / 255, 1]',
    progressBarColor: '[255 / 255, 226 / 255, 158 / 255, 1]',
    progressBackground: '[79 / 255, 128 / 255, 110 / 255, 1]',
};

exports.throwError = true;

exports.onAfterBuild = function onAfterBuild(_options, result) {
    const firstScreen = path.join(result.dest, 'first-screen.js');
    const settingsPath = result.paths.settings;
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    let renderer = fs.readFileSync(firstScreen, 'utf8');

    // Keep Creator's WebGL context, progress callbacks and startup order.
    for (const [name, value] of Object.entries(splashStyle)) {
        const declaration = new RegExp(`^let ${name} = [^\r\n]+?;\r?$`, 'gm');
        if (Array.from(renderer.matchAll(declaration)).length !== 1) {
            throw new Error(`当前 Creator 微信首屏模板已变更，无法配置 ${name}`);
        }
        renderer = renderer.replace(declaration, `let ${name} = ${value};`);
    }

    fs.copyFileSync(path.join(__dirname, cover), path.join(result.dest, cover));
    fs.writeFileSync(firstScreen, renderer);
    if (settings.splashScreen?.totalTime > 0) {
        // This cover already runs before the engine. Avoid an extra engine splash after it.
        settings.splashScreen.totalTime = 0;
        fs.writeFileSync(settingsPath, JSON.stringify(settings));
    }
    for (const name of ['logo.png', 'slogan.png']) {
        fs.rmSync(path.join(result.dest, name), { force: true });
    }
    console.log('[breakfast-startup] 已应用微信启动页');
};
