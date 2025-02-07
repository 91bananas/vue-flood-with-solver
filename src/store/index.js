const DEFAULT_GAME = {
    // ...existing code...
    moveHistory: [], // Add this to track move history
    // ...existing code...
};

// ...existing code...
    saveToHistory(state, { hash, data }) {
      state.boardHistory[hash] = {
        ...data,
        board: [...state.allColorsArray], // Store complete board data
        size: state.boardSize,
        moves: state.moves,
        maxMoves: state.maxMoves,
        timestamp: Date.now(),
        strategies: data.strategies || {}
      };
      localStorage.setItem('boardHistory', JSON.stringify(state.boardHistory));
    },

    restoreHistoricalBoard(state, hash) {
      const boardData = state.boardHistory[hash];
      if (!boardData || !boardData.board) {
        console.error(`No board data found for hash: ${hash}`);
        return;
      }

      state.boardSize = boardData.size;
      state.allColorsArray = [...boardData.board];
      state.moves = boardData.moves;
      state.maxMoves = boardData.maxMoves;
      state.currentBoardHash = hash;
    },
// ...existing code...
  mutations: {
    // ...existing code...
    UPDATE_ALL(state, payload) {
        if (state.ingame) {
            // Save current state before updating
            state.moveHistory.push({
                board: boardStateHelpers.cloneBoardState(state.allColorsArray),
                moveCount: state.moveCount
            });

            // ...existing UPDATE_ALL code...
        }
    },
    UNDO_MOVE(state) {
        if (state.moveHistory.length > 0) {
            const previousState = state.moveHistory.pop();
            state.allColorsArray = previousState.board;
            state.moveCount = previousState.moveCount;
        }
    },
    // ...existing code...
  },
  actions: {
  },
// ...existing code...
