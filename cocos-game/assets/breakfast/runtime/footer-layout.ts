export function layoutFooter(width: number, height: number, bottomInset: number) {
    const inner = Math.min(width - 43, 438);
    const inset = Math.max(0, bottomInset);
    const buttonHeight = 56;
    const safeBottom = inset - height / 2;
    const previousHeight = 44;
    const previous = { x: 0, y: safeBottom + 4 + previousHeight / 2, w: 148, h: previousHeight };
    const panelBottom = previous.y + previous.h / 2 + 9;
    const panel = { x: 0, y: panelBottom + 54, w: inner, h: 108 };

    const buttonGap = 16;
    const buttonWidth = (inner - 28 - buttonGap) / 2;
    const buttonX = (buttonWidth + buttonGap) / 2;
    const buttonY = panelBottom + 12 + buttonHeight / 2;
    const trayScale = Math.max(.65, Math.min(1, .70 + (height - inset - 840) / 225));
    return {
        panel,
        tipY: panelBottom + 88,
        left: { x: -buttonX, y: buttonY, w: buttonWidth, h: buttonHeight },
        right: { x: buttonX, y: buttonY, w: buttonWidth, h: buttonHeight },
        previous,
        trayLabelY: Math.max(panelBottom + panel.h + 20, -height * .374),
        trayLabelX: inner * .239 * trayScale,
        trayScale,
    };
}
