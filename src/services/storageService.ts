interface BoardResult {
    boardState: any[];
    strategies: Record<string, { moves: number | string; list: string[] }>;
    difficulty?: number;
    timestamp: number;
}

const STORAGE_KEY = 'vue_flood_history';

export const storageService = {
    getAllBoards(): Record<string, BoardResult> {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    },

    saveBoard(boardHash: string, result: BoardResult) {
        const stored = this.getAllBoards();
        stored[boardHash] = {
            ...result,
            timestamp: Date.now(),
            difficulty: this.calculateDifficulty(result)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    },

    calculateDifficulty(result: BoardResult): number {
        // Calculate difficulty score based on solver performance
        const solutions = Object.values(result.strategies)
            .map(s => typeof s.moves === 'number' ? s.moves : Infinity);

        const minMoves = Math.min(...solutions);
        const solvedCount = solutions.filter(m => m < Infinity).length;

        // Higher score = harder board
        // Points for minimum moves needed
        // Points for fewer solvers succeeding
        return Math.round((minMoves * 10) + ((9 - solvedCount) * 5));
    }
};
