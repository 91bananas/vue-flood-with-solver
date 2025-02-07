interface ColorCell {
    id: string;
    color: string;
}

export const boardStateHelpers = {
    createBoardHash(allColorsArray: ColorCell[], size: number): string {
        const boardString = allColorsArray
            .map(cell => cell.color[0])
            .join('');
        
        let hash = 0;
        for (let i = 0; i < boardString.length; i++) {
            const char = boardString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `board_${Math.abs(hash)}_${size}`;
    },

    cloneBoardState(allColorsArray: ColorCell[]): ColorCell[] {
        return allColorsArray.map(cell => ({...cell}));
    }
};
