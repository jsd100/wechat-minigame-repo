import type { Food, FoodKind, Level } from './types';

function food(kind: FoodKind, slot: Food['slot'], blockedBy: readonly string[] = [], id: string = kind): Food {
    return { id, kind, slot, blockedBy };
}

const firstFoods = [food('soyMilk', [-1, 0, 0.2]), food('bun', [1, 0, -0.1])];
const tutorialFoods = [
    food('soyMilk', [-1.46, 0, .34]),
    food('bun', [-.96, 0, 1.76]),
    food('teaEgg', [.12, 0, -.23], ['riceCake']),
    food('riceCake', [.16, .02, .60]),
    food('corn', [1.39, 0, 1.24]),
];

export const LEVELS: readonly Level[] = [
    {
        id: 1, title: '两样刚刚好', mode: 'fixed',
        orders: [{ id: 'A', needs: { soyMilk: 1, bun: 1 } }],
        foods: firstFoods,
    },
    {
        id: 2, title: '先放一下', mode: 'fixed',
        orders: [{ id: 'A', needs: { soyMilk: 1, bun: 1, teaEgg: 1 } }, { id: 'B', needs: { riceCake: 1, corn: 1 } }],
        foods: tutorialFoods,
    },
    {
        id: 3, title: '别把碟子占满', mode: 'fixed',
        orders: [{ id: 'A', needs: { soyMilk: 1, bun: 1, teaEgg: 1 } }, { id: 'B', needs: { riceCake: 1, corn: 1, flowerRoll: 1 } }],
        foods: [...tutorialFoods, food('flowerRoll', [1.37, 0, -.10])],
    },
    {
        id: 4, title: '这单先做', mode: 'choose',
        orders: [{ id: 'A', needs: { soyMilk: 1, teaEgg: 1 } }, { id: 'B', needs: { riceCake: 1, corn: 1, flowerRoll: 1 } }],
        foods: [
            food('soyMilk', [1.71, 0, -0.6]),
            food('teaEgg', [0.04, 0, -0.47], ['riceCake', 'corn', 'flowerRoll']),
            food('riceCake', [-0.7, 0, 0.02]),
            food('corn', [0.68, 0, -0.06]),
            food('flowerRoll', [0.02, 0, 0.43]),
        ],
    },
    {
        id: 5, title: '两种做法', mode: 'choose',
        orders: [{ id: 'A', needs: { bun: 1, teaEgg: 1 } }, { id: 'B', needs: { riceCake: 1, soyMilk: 1, corn: 1 } }],
        foods: [
            food('soyMilk', [-0.52, 0, -1.19], ['bun', 'teaEgg']),
            food('bun', [-1.06, 0, -0.43]),
            food('teaEgg', [0.16, 0, -0.38], ['riceCake']),
            food('riceCake', [0.01, 0, 0.35]),
            food('corn', [1.41, 0, 0.64]),
        ],
    },
    {
        id: 6, title: '出摊小考', mode: 'choose',
        orders: [{ id: 'A', needs: { soyMilk: 1, bun: 1, teaEgg: 1 } }, { id: 'B', needs: { bun: 1, riceCake: 1, corn: 1 } }],
        foods: [
            food('soyMilk', [-0.94, 0, -0.64], ['riceCake']),
            food('bun', [0.35, 0, -0.14], ['riceCake'], 'bun-under-rice'),
            food('teaEgg', [0.53, 0, -0.84], ['bun-under-rice']),
            food('riceCake', [-0.38, 0, 0.55]),
            food('bun', [1.58, 0, -0.42], [], 'bun-visible'),
            food('corn', [1.17, 0, 0.98]),
        ],
    },
    {
        id: 7, title: '热乎续单', mode: 'fixed',
        orders: [{ id: 'A', needs: { bun: 1, teaEgg: 1 } }, { id: 'B', needs: { riceCake: 1, corn: 1, soyMilk: 1 } }],
        foods: [
            food('bun', [-1.37, 0, 0.75]),
            food('soyMilk', [-0.14, 0, -0.74], ['teaEgg']),
            food('teaEgg', [0.09, 0, 0.10], ['riceCake']),
            food('riceCake', [-0.03, 0, 0.96]),
            food('corn', [1.35, 0, 0.51]),
        ],
    },
    {
        id: 8, title: '别先拿花卷', mode: 'fixed',
        orders: [{ id: 'A', needs: { soyMilk: 1, bun: 1, teaEgg: 1 } }, { id: 'B', needs: { riceCake: 1, corn: 1, flowerRoll: 1 } }],
        foods: [
            food('soyMilk', [1.45, 0, -0.40]),
            food('bun', [-1.55, 0, -0.73]),
            food('teaEgg', [0, 0, -0.40], ['riceCake', 'corn']),
            food('riceCake', [-0.52, 0, 0.36]),
            food('corn', [0.48, 0, 0.40]),
            food('flowerRoll', [1.45, 0, 1.25]),
        ],
    },
    {
        id: 9, title: '两张单都能出', mode: 'choose',
        orders: [{ id: 'A', needs: { riceCake: 1, corn: 1, flowerRoll: 1 } }, { id: 'B', needs: { soyMilk: 1, bun: 1, teaEgg: 1 } }],
        foods: [
            food('soyMilk', [1.35, 0, -0.47]),
            food('bun', [1.32, 0, 1.30]),
            food('teaEgg', [-0.95, 0, -0.46], ['riceCake', 'corn']),
            food('riceCake', [-1.47, 0, 0.35]),
            food('corn', [-0.49, 0, 0.10]),
            food('flowerRoll', [-1.56, 0, 1.65]),
        ],
    },
    {
        id: 10, title: '先腾哪边', mode: 'choose',
        orders: [{ id: 'A', needs: { bun: 1, soyMilk: 1, teaEgg: 1 } }, { id: 'B', needs: { riceCake: 1, oilStick: 1, flowerRoll: 1 } }],
        foods: [
            food('bun', [-1.18, 0, 0.13]),
            food('soyMilk', [-0.27, 0, 1.45]),
            food('riceCake', [-1.47, 0, -0.69], ['bun']),
            food('teaEgg', [0.99, 0, -0.99], ['flowerRoll']),
            food('flowerRoll', [1.22, 0, -0.21], ['oilStick']),
            food('oilStick', [1.05, 0, 0.37]),
        ],
    },
    {
        id: 11, title: '两只就够', mode: 'fixed',
        orders: [{ id: 'A', needs: { bun: 2, teaEgg: 1 } }, { id: 'B', needs: { bun: 1, soyMilk: 1, sweetPotato: 1 } }],
        foods: [
            food('bun', [-0.58, 0, 0.31], [], 'bun-left'),
            food('bun', [0.58, 0, 0.38], [], 'bun-right'),
            food('bun', [1.53, 0, 1.50], [], 'bun-front'),
            food('teaEgg', [0, 0, -0.29], ['bun-left', 'bun-right']),
            food('soyMilk', [-1.59, 0, -0.39]),
            food('sweetPotato', [1.65, 0, -0.68]),
        ],
    },
    {
        id: 12, title: '早市收摊', mode: 'choose',
        orders: [{ id: 'A', needs: { bun: 2, sweetPotato: 1, teaEgg: 1 } }, { id: 'B', needs: { bun: 1, riceCake: 1, oilStick: 1 } }],
        foods: [
            food('bun', [1.43, 0, -0.64], [], 'bun-back'),
            food('bun', [-1.13, 0, 0.02], ['riceCake'], 'bun-middle'),
            food('bun', [1.58, 0, 1.35], [], 'bun-front'),
            food('sweetPotato', [1.73, 0, -1.50], ['bun-back']),
            food('teaEgg', [-0.50, 0, -0.36], ['bun-middle', 'oilStick']),
            food('riceCake', [-1.43, 0, 0.96]),
            food('oilStick', [0.08, 0, 0.04]),
        ],
    },
];
