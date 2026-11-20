const trayClearance = 18;

export function projectYBounds(positions: ArrayLike<number>, upY: number, upZ: number): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;
    for (let vertex = 0; vertex < positions.length; vertex += 3) {
        const y = positions[vertex + 1] * upY + positions[vertex + 2] * upZ;
        min = Math.min(min, y);
        max = Math.max(max, y);
    }
    return { min, max };
}

export function boardDepthOffset(boardBottom: number, trayTop: number, upZ: number, worldPerUiUnit: number): number {
    const overlap = trayTop + trayClearance * worldPerUiUnit - boardBottom;
    return overlap > 0 ? overlap / upZ : 0;
}
