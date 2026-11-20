import type {
    ActionResult, Food, FoodKind, GameAction, GameEvent, GameSnapshot, GameState, Level, Needs, Rejection,
} from './types';

const TRAY_CAPACITY = 2;

export function createGame(level: Level): GameState {
    const canSelectOrder = level.mode === 'choose';
    return {
        level,
        activeOrderId: canSelectOrder ? null : level.orders[0].id,
        remainingByOrder: level.orders.reduce<Record<string, Needs>>((initial, { id, needs }) => {
            initial[id] = needs;
            return initial;
        }, {}),
        boardFoodIds: level.foods.map(({ id }) => id),
        stagedFoodIds: [],
        peakStaged: 0,
        canSelectOrder,
        status: canSelectOrder ? 'awaitingChoice' : 'playing',
        canUndo: false,
        usedUndo: false,
        previous: null,
    };
}

export function applyAction(state: GameState, action: GameAction): ActionResult {
    switch (action.type) {
        case 'restart':
            return { state: createGame(state.level), events: [] };
        case 'undo':
            if (state.canUndo && state.previous) {
                return {
                    state: { ...state, ...state.previous, canUndo: false, usedUndo: true, previous: null },
                    events: [],
                };
            }
            return rejected(state, 'unavailable');
        case 'select':
            if (state.canSelectOrder && state.level.orders.some(({ id }) => id === action.orderId)) {
                return { state: { ...state, status: 'playing', activeOrderId: action.orderId }, events: [] };
            }
            return rejected(state, 'unavailable');
        case 'take':
            return takeFood(state, action.foodId);
    }
}

export function getBlockers(state: GameState, foodId: string): readonly string[] {
    const food = state.level.foods.find(({ id }) => id === foodId);
    return food ? blockers(food, state.boardFoodIds) : [];
}

function blockers(food: Food, board: readonly string[]): string[] {
    return food.blockedBy.filter((id) => board.indexOf(id) !== -1);
}

function rejected(state: GameState, rejection: Rejection): ActionResult {
    return { state, events: [], rejection };
}

function needsFood(needs: Needs, kind: FoodKind): boolean {
    return (needs[kind] ?? 0) > 0;
}

function complete(needs: Needs): boolean {
    return !(Object.keys(needs) as FoodKind[]).some((kind) => needsFood(needs, kind));
}

function checkTake(food: Food, needs: Needs, board: readonly string[], stagedCount: number): Rejection | undefined {
    if (blockers(food, board).length) return 'blocked';
    if (!needsFood(needs, food.kind) && stagedCount >= TRAY_CAPACITY) return 'full';
    return undefined;
}

function takeFood(state: GameState, foodId: string): ActionResult {
    const food = state.level.foods.find(({ id }) => id === foodId);
    if (!food || state.boardFoodIds.indexOf(foodId) === -1 || state.status === 'stuck' || state.status === 'won') {
        return rejected(state, 'unavailable');
    }
    const currentOrder = state.activeOrderId;
    if (currentOrder === null) return rejected(state, 'chooseOrder');

    const reason = checkTake(food, state.remainingByOrder[currentOrder], state.boardFoodIds, state.stagedFoodIds.length);
    if (reason) return rejected(state, reason);

    const remainingByOrder = { ...state.remainingByOrder };
    const boardFoodIds = state.boardFoodIds.filter((id) => id !== foodId);
    let stagedFoodIds = [...state.stagedFoodIds];
    const events: GameEvent[] = [];
    const addToOrder = (item: Food, orderId: string) => {
        const needs = remainingByOrder[orderId];
        remainingByOrder[orderId] = { ...needs, [item.kind]: (needs[item.kind] ?? 0) - 1 };
        events.push({ type: 'toOrder', foodId: item.id, orderId });
    };

    if (needsFood(remainingByOrder[currentOrder], food.kind)) {
        addToOrder(food, currentOrder);
    } else {
        stagedFoodIds.push(foodId);
        events.push({ type: 'toTray', foodId });
    }
    const peakStaged = Math.max(state.peakStaged, stagedFoodIds.length);

    for (const item of state.level.foods) {
        if (boardFoodIds.indexOf(item.id) !== -1 && item.blockedBy.indexOf(foodId) !== -1 && blockers(item, boardFoodIds).length === 0) {
            events.push({ type: 'revealed', foodId: item.id });
        }
    }

    let activeOrderId: string | null = currentOrder;
    if (complete(remainingByOrder[currentOrder])) {
        events.push({ type: 'sealed', orderId: currentOrder });
        const nextOrder = state.level.orders.find(({ id }) => !complete(remainingByOrder[id]));
        activeOrderId = nextOrder?.id ?? null;
        if (nextOrder) {
            stagedFoodIds = stagedFoodIds.filter((id) => {
                const item = state.level.foods.find((candidate) => candidate.id === id);
                if (!item || !needsFood(remainingByOrder[nextOrder.id], item.kind)) return true;
                addToOrder(item, nextOrder.id);
                return false;
            });
            if (complete(remainingByOrder[nextOrder.id])) {
                events.push({ type: 'sealed', orderId: nextOrder.id });
                activeOrderId = null;
            }
        }
    }

    const status = getStatus(state.level, activeOrderId === null ? null : remainingByOrder[activeOrderId],
        boardFoodIds, stagedFoodIds.length);
    const canUndo = status !== 'won' && !state.usedUndo;
    const previous: GameSnapshot | null = canUndo ? {
        activeOrderId: state.activeOrderId,
        remainingByOrder: state.remainingByOrder,
        boardFoodIds: state.boardFoodIds,
        stagedFoodIds: state.stagedFoodIds,
        peakStaged: state.peakStaged,
        canSelectOrder: state.canSelectOrder,
        status: state.status,
    } : null;
    return {
        state: { ...state, activeOrderId, remainingByOrder, boardFoodIds, stagedFoodIds, peakStaged,
            status, canSelectOrder: false, canUndo, previous },
        events,
    };
}

function getStatus(level: Level, needs: Needs | null, board: readonly string[], stagedCount: number): GameSnapshot['status'] {
    if (needs === null) return 'won';
    const hasMove = level.foods.some((food) => board.indexOf(food.id) !== -1 && !checkTake(food, needs, board, stagedCount));
    return hasMove ? 'playing' : 'stuck';
}
