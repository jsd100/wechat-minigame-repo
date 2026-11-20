export type FoodKind = 'soyMilk' | 'bun' | 'teaEgg' | 'riceCake' | 'corn' | 'flowerRoll' | 'oilStick' | 'sweetPotato';
export type Needs = Readonly<Partial<Record<FoodKind, number>>>;

export interface Food {
    readonly id: string;
    readonly kind: FoodKind;
    readonly slot: readonly [number, number, number];
    readonly blockedBy: readonly string[];
}

export interface Order {
    readonly id: string;
    readonly needs: Needs;
}

export interface Level {
    readonly id: number;
    readonly title: string;
    readonly mode: 'fixed' | 'choose';
    readonly orders: readonly Order[];
    readonly foods: readonly Food[];
}

export type GameAction =
    | { type: 'select'; orderId: string }
    | { type: 'take'; foodId: string }
    | { type: 'undo' }
    | { type: 'restart' };

export type GameEvent =
    | { type: 'toOrder'; foodId: string; orderId: string }
    | { type: 'toTray'; foodId: string }
    | { type: 'revealed'; foodId: string }
    | { type: 'sealed'; orderId: string };

export interface GameSnapshot {
    readonly activeOrderId: string | null;
    readonly remainingByOrder: Readonly<Record<string, Needs>>;
    readonly boardFoodIds: readonly string[];
    readonly stagedFoodIds: readonly string[];
    readonly peakStaged: number;
    readonly canSelectOrder: boolean;
    readonly status: 'awaitingChoice' | 'playing' | 'stuck' | 'won';
}

export interface GameState extends GameSnapshot {
    readonly level: Level;
    readonly canUndo: boolean;
    readonly usedUndo: boolean;
    readonly previous: GameSnapshot | null;
}

export type Rejection = 'chooseOrder' | 'blocked' | 'full' | 'unavailable';

export interface ActionResult {
    readonly state: GameState;
    readonly events: readonly GameEvent[];
    readonly rejection?: Rejection;
}
