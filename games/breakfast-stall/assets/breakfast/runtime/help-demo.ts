import { createGame } from '../core/rules';
import type { Level } from '../core/types';

export type HelpFood = 'riceCake' | 'teaEgg';

const demoLevel: Level = {
    id: 0, title: '小摊开工单', mode: 'fixed',
    orders: [{ id: 'A', needs: { teaEgg: 1 } }, { id: 'B', needs: { riceCake: 1 } }],
    foods: [
        { id: 'teaEgg', kind: 'teaEgg', slot: [0, 0, 0], blockedBy: ['riceCake'] },
        { id: 'riceCake', kind: 'riceCake', slot: [0, 0, 0], blockedBy: [] },
    ],
};

export function createHelpDemo() {
    return createGame(demoLevel);
}
