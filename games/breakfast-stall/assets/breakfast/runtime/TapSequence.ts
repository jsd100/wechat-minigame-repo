export class TapSequence {
    private readonly active = new Set<number>();
    private primary: number | null = null;

    begin(id: number): void {
        if (this.active.size === 0) this.primary = id;
        this.active.add(id);
    }

    end(id: number): boolean {
        if (!this.active.delete(id) || this.primary !== id) return false;
        this.primary = null;
        return true;
    }

    reset(): void {
        this.active.clear();
        this.primary = null;
    }
}
