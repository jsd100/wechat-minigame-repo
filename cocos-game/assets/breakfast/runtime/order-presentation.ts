import type { FoodKind, GameState } from '../core/types';
import { getBlockers } from '../core/rules';

export function showHandoff(before: GameState, after: GameState, sealedId: string): GameState | null {
    if (before.activeOrderId !== sealedId) return null;
    const next = before.level.orders.find(({ id }) => {
        if (id === sealedId) return false;
        const remaining = before.remainingByOrder[id];
        return (Object.keys(remaining) as FoodKind[]).some((kind) => (remaining[kind] ?? 0) > 0);
    });
    if (!next) return null;
    return {
        ...before,
        activeOrderId: next.id,
        canSelectOrder: false,
        remainingByOrder: { ...before.remainingByOrder, [sealedId]: after.remainingByOrder[sealedId] },
    };
}

export function describeStuck(state: GameState, names: Readonly<Record<FoodKind, string>>): string {
    if (state.level.id === 3) return '两个暂存碟满了，米糕还挡着茶叶蛋。';
    if (state.level.id === 4) return '两只碟子放不下挡着蛋的三件食物。';

    const remaining = state.activeOrderId && state.remainingByOrder[state.activeOrderId];
    if (!remaining) return '暂存碟已满，需求食物还被挡住。';
    for (const food of state.level.foods) {
        if (state.boardFoodIds.indexOf(food.id) === -1 || (remaining[food.kind] ?? 0) === 0) continue;
        const blockers = getBlockers(state, food.id);
        if (!blockers.length) continue;
        if (state.level.id === 12 && state.activeOrderId === 'A' && !remaining.bun && food.kind === 'teaEgg' &&
            blockers.indexOf('bun-middle') !== -1) return '要留一个包子名额给挡住茶叶蛋的那只。';
        const labels = state.level.foods.filter(({ id }) => blockers.indexOf(id) !== -1).map(({ kind }) => names[kind]);
        const uniqueLabels = labels.filter((label, index) => labels.indexOf(label) === index);
        return `两只碟都占了，${uniqueLabels.join('、')}还挡着${names[food.kind]}。`;
    }
    return '暂存碟已满，需求食物还被挡住。';
}
