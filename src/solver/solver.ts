interface Strategy {
    (grid: string[][], floodedRegion: number[][]): number;
}

interface Strategies {
    [key: string]: Strategy;
}

const strategies: Strategies = {
    simple(grid: string[][], floodedRegion: number[][]): number {
        return grid.length * grid.length - floodedRegion.length;
    },

    diagonal(grid: string[][], floodedRegion: number[][]): number {
        const size = grid.length;
        let score = size * size - floodedRegion.length;
        let totalDistance = 0;
        for (const [row, col] of floodedRegion) {
            const distToCorner = (size - 1 - row) + (size - 1 - col);
            totalDistance += distToCorner;
        }
        return score + (totalDistance / floodedRegion.length);
    },

    edge(grid: string[][], floodedRegion: number[][]): number {
        const size = grid.length;
        let score = size * size - floodedRegion.length;
        let edgeCells = 0;

        for (const [row, col] of floodedRegion) {
            if (row === 0 || row === size - 1 || col === 0 || col === size - 1) {
                edgeCells++;
            }
        }
        return score - (edgeCells * 0.5);
    },

    region(grid: string[][], floodedRegion: number[][]): number {
        // ...existing code for region strategy...
    },

    connectivity(grid: string[][], floodedRegion: number[][]): number {
        const size = grid.length;
        let score = size * size - floodedRegion.length;
        let connections = 0;
        const visited = new Set(floodedRegion.map(([r, c]) => `${r},${c}`));
        for (const [row, col] of floodedRegion) {
            const neighbors = [
                [row - 1, col], [row + 1, col],
                [row, col - 1], [row, col + 1]
            ];
            for (const [nRow, nCol] of neighbors) {
                if (visited.has(`${nRow},${nCol}`)) {
                    connections++;
                }
            }
        }
        return score - (connections * 0.25);
    },

    distanceWeighted(grid: string[][], floodedRegion: number[][]): number {
        const size = grid.length;
        let score = size * size - floodedRegion.length;
        const centerRow = Math.floor(size / 2);
        const centerCol = Math.floor(size / 2);
        let distanceScore = 0;
        for (const [row, col] of floodedRegion) {
            const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
            distanceScore += distance;
        }
        return score + (distanceScore / floodedRegion.length);
    },

    colorClustering(grid: string[][], floodedRegion: number[][]): number {
        const size = grid.length;
        let score = size * size - floodedRegion.length;
        const colorClusters = new Map<string, number>();
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const color = grid[row][col];
                if (!colorClusters.has(color)) {
                    colorClusters.set(color, 0);
                }
                if (col < size - 1 && grid[row][col + 1] === color) {
                    colorClusters.set(color, colorClusters.get(color)! + 1);
                }
                if (row < size - 1 && grid[row + 1][col] === color) {
                    colorClusters.set(color, colorClusters.get(color)! + 1);
                }
            }
        }
        const currentColor = grid[floodedRegion[0][0]][floodedRegion[0][1]];
        const clusterSize = colorClusters.get(currentColor) || 0;
        return score - (clusterSize * 0.5);
    },

    hybrid(grid: string[][], floodedRegion: number[][]): number {
        const connectivityScore = strategies.connectivity(grid, floodedRegion);
        const regionScore = strategies.colorClustering(grid, floodedRegion);
        const edgeScore = strategies.edge(grid, floodedRegion);
        return (connectivityScore * 0.4) + (regionScore * 0.3) + (edgeScore * 0.3);
    },

    dynamic(grid: string[][], floodedRegion: number[][]): number {
        const size = grid.length;
        const progress = floodedRegion.length / (size * size);
        if (progress < 0.3) {
            return strategies.connectivity(grid, floodedRegion);
        } else if (progress < 0.7) {
            return strategies.colorClustering(grid, floodedRegion);
        } else {
            return strategies.edge(grid, floodedRegion);
        }
    },

    enhancedDiagonal(grid: string[][], floodedRegion: number[][]): number {
        const size = grid.length;
        let score = size * size - floodedRegion.length;
        const corners = [[0, 0], [0, size - 1], [size - 1, 0], [size - 1, size - 1]];
        let cornerBonus = 0;
        for (const [row, col] of floodedRegion) {
            for (const [cRow, cCol] of corners) {
                if (row === cRow && col === cCol) {
                    cornerBonus += 2;
                }
            }
        }
        return score - cornerBonus;
    },

    enhancedRegion(grid: string[][], floodedRegion: number[][]): number {
        const baseScore = strategies.region(grid, floodedRegion);
        const currentColor = grid[floodedRegion[0][0]][floodedRegion[0][1]];
        let potentialGrowth = 0;
        const size = grid.length;
        for (const [row, col] of floodedRegion) {
            const neighbors = [
                [row - 1, col], [row + 1, col],
                [row, col - 1], [row, col + 1]
            ];
            for (const [nRow, nCol] of neighbors) {
                if (nRow >= 0 && nRow < size && nCol >= 0 && nCol < size) {
                    if (grid[nRow][nCol] === currentColor) {
                        potentialGrowth++;
                    }
                }
            }
        }
        return baseScore - (potentialGrowth * 0.3);
    }
};

const solver = {
    strategies,

    convertToGrid(allColorsArray: any[], size: number): string[][] {
        // Validate inputs
        if (!Array.isArray(allColorsArray) || !size) {
            console.error('Invalid input:', { allColorsArray, size });
            return Array(size).fill(null).map(() => Array(size).fill(''));
        }

        const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));

        for (const cell of allColorsArray) {
            if (cell && cell.id && cell.color) {
                const [row, col] = cell.id.split('p').map(Number);
                if (row >= 0 && row < size && col >= 0 && col < size) {
                    grid[row][col] = cell.color;
                }
            }
        }

        return grid;
    },

    coordToId(row: number, col: number): string {
        return `${row}p${col}`;
    },

    getFloodedRegion(grid: string[][]): number[][] {
        const size = grid.length;
        const visited = Array(size).fill(null).map(() => Array(size).fill(false));
        const floodColor = grid[0][0];
        const floodedCells: number[][] = [];

        const dfs = (row: number, col: number) => {
            if (row < 0 || row >= size || col < 0 || col >= size) return;
            if (visited[row][col] || grid[row][col] !== floodColor) return;

            visited[row][col] = true;
            floodedCells.push([row, col]);

            dfs(row - 1, col);
            dfs(row + 1, col);
            dfs(row, col - 1);
            dfs(row, col + 1);
        };

        dfs(0, 0);
        return floodedCells;
    },

    getAdjacentColors(grid: string[][]): string[] {
        const floodedRegion = this.getFloodedRegion(grid);
        const adjacentColors = new Set<string>();
        const currentColor = grid[0][0];
        const size = grid.length;

        for (const [row, col] of floodedRegion) {
            const neighbors = [
                [row - 1, col], [row + 1, col],
                [row, col - 1], [row, col + 1]
            ];

            for (const [nRow, nCol] of neighbors) {
                if (nRow >= 0 && nRow < size &&
                    nCol >= 0 && nCol < size &&
                    grid[nRow][nCol] !== currentColor) {
                    adjacentColors.add(grid[nRow][nCol]);
                }
            }
        }

        return Array.from(adjacentColors);
    },

    flood(grid: string[][], color: string): string[][] {
        const floodedRegion = this.getFloodedRegion(grid);
        const newGrid = grid.map(row => [...row]);

        for (const [row, col] of floodedRegion) {
            newGrid[row][col] = color;
        }

        return newGrid;
    },

    isSolved(grid: string[][]): boolean {
        const targetColor = grid[0][0];
        return grid.every(row => row.every(cell => cell === targetColor));
    },

    getScore(grid: string[][]): number {
        return grid.length * grid.length - this.getFloodedRegion(grid).length;
    },

    solve(allColorsArray: any[], size: number, strategy = 'simple', maxMoves = 22) {
        const grid = this.convertToGrid(allColorsArray, size);
        if (this.isSolved(grid)) return { solved: true, moves: [] };

        const solution: string[] = [];
        let currentGrid = grid;
        let moveCount = 0;

        while (!this.isSolved(currentGrid) && moveCount < maxMoves) {
            const adjacentColors = this.getAdjacentColors(currentGrid);
            if (adjacentColors.length === 0) break;

            let bestColor = adjacentColors[0];
            let bestScore = Infinity;

            for (const color of adjacentColors) {
                const testGrid = this.flood(currentGrid, color);
                const floodedRegion = this.getFloodedRegion(testGrid);
                const score = strategies[strategy](testGrid, floodedRegion);

                if (score < bestScore) {
                    bestScore = score;
                    bestColor = color;
                }
            }

            currentGrid = this.flood(currentGrid, bestColor);
            solution.push(bestColor);
            moveCount++;
        }

        return {
            solved: this.isSolved(currentGrid),
            moves: solution
        };
    }
};

export default solver;
