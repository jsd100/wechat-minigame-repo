export interface StoragePort {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export interface WinRecord {
    readonly peakStaged: number;
    readonly clean: boolean;
}

export interface Progress {
    readonly unlocked: number;
    readonly wins: Readonly<Partial<Record<number, WinRecord>>>;
    readonly sound: boolean;
    readonly reduceMotion: boolean;
}

export function loadProgress(storage: StoragePort): Progress {
    const initial: Progress = { unlocked: 1, wins: {}, sound: true, reduceMotion: false };
    try {
        const data: unknown = JSON.parse(storage.getItem(SAVE_KEY) ?? 'null');
        if (!isObject(data)) return initial;

        const savedWins = isObject(data.wins) ? data.wins : {};
        const wins: Record<number, WinRecord> = {};
        let unlocked = 1;
        for (const { id } of LEVELS) {
            const record = savedWins[id];
            if (!isObject(record) || !isTrayCount(record.peakStaged) || typeof record.clean !== 'boolean') break;
            wins[id] = { peakStaged: record.peakStaged, clean: record.clean };
            unlocked = Math.min(LEVELS.length, id + 1);
        }
        return { unlocked, wins, sound: data.sound !== false, reduceMotion: data.reduceMotion === true };
    } catch {
        return initial;
    }
}

export function saveProgress(storage: StoragePort, progress: Progress): void {
    try {
        storage.setItem(SAVE_KEY, JSON.stringify(progress));
    } catch {
        // The live session keeps its progress even if local storage is unavailable.
    }
}

export function recordWin(progress: Progress, levelId: number, peakStaged: number, usedUndo: boolean): Progress {
    if (!Number.isInteger(levelId) || levelId < 1 || levelId > progress.unlocked ||
        levelId > LEVELS.length || !isTrayCount(peakStaged)) return progress;
    const before = progress.wins[levelId];
    return {
        ...progress,
        unlocked: Math.min(LEVELS.length, Math.max(progress.unlocked, levelId + 1)),
        wins: {
            ...progress.wins,
            [levelId]: { peakStaged: Math.min(before?.peakStaged ?? peakStaged, peakStaged), clean: !usedUndo || before?.clean === true },
        },
    };
}
import { LEVELS } from '../core/levels';

const SAVE_KEY = 'breakfast-stall.progress.v1';


function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTrayCount(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 2;
}
