import type { GameAction } from '../core/types';

export type HudAction = GameAction | { type: 'next' | 'previous' | 'sound' | 'motion' | 'settings' };

export interface HitArea {
    x: number;
    y: number;
    w: number;
    h: number;
    action?: HudAction;
}

export interface HudModal {
    panel: HitArea;
    controls: readonly HitArea[];
}

export function resolveHudHit(
    x: number, y: number, areas: readonly HitArea[], modal?: HudModal,
): HudAction | 'ignore' | null {
    const contains = (rect: HitArea) => Math.abs(x - rect.x) <= rect.w / 2 && Math.abs(y - rect.y) <= rect.h / 2;
    if (modal) {
        const control = modal.controls.find(contains);
        if (control?.action) return control.action;
        return contains(modal.panel) ? 'ignore' : { type: 'settings' };
    }
    const area = areas.find(contains);
    return area ? area.action ?? 'ignore' : null;
}
