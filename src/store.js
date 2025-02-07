// import Vue from 'vue';
import Vuex from 'vuex';
import solver from './solver/solver';
import { boardStateHelpers } from './solver/boardStateHelpers';
import { storageService } from './services/storageService';


const DEFAULT_GAME = {
    gamesize: 12,
    done: [],
    ingame: false,
    lastMove: 0,
    maxMoves: 22,
    moveCount: 0,
    theSize: 0,
    theSizeString: '',
    gameOver: false,
    colors: ['blue', 'red', 'yellow', 'purple', 'orange', 'green'],
    showOptions: false,
    showMessage: false,
    showStartup: true,
    message: '',
    allColorsArray: [],
    allColorsArrayLookup: {},
    // solver stuff
    solverDelay: 20,
    solverActive: false,
    solverSolution: null,
    solverStrategy: 'simple',
    solverMoveIndex: 0,
    previousBoardState: null,
    currentBoardHash: null,
    solverResults: {},
    solverComparisonBoards: {},
    boardHistory: {}, // Add this to default state
    moveHistory: [], // Add this to track move history
    undosRemaining: 3, // Add this to track remaining undos
};

const getColor = function(colors) {
    const random = Math.floor(Math.random() * 6);
    return colors[random];
};

const generateArray = function(size, colors) {
    const returnArray = [];
    const loop = [...Array(size).keys()];
    for (let el of loop) {
        for (let el2 of loop) {
            returnArray.push({ id: el + 'p' + el2, color: getColor(colors), done: false });
        }
    }
    return returnArray;
};

const store = new Vuex.Store({
    state: Object.assign({}, DEFAULT_GAME, {
        boardHistory: storageService.getAllBoards(),
    }),
    mutations: {
        SHOW_OPTIONS(state, show) {
            state.showOptions = show;
        },
        HIDE_OPTIONS(state, show) {
            state.showOptions = show;
        },
        START_GAME(state, newGame) {
            // Keep solver results and board history when starting new game
            const dataToKeep = {
                solverResults: state.solverResults,
                solverStrategy: state.solverStrategy,
                boardHistory: state.boardHistory,
                currentBoardHash: newGame.currentBoardHash,
                previousBoardState: newGame.previousBoardState
            };
            Object.assign(state, DEFAULT_GAME);
            Object.assign(state, newGame);
            Object.assign(state, dataToKeep);
            state.undosRemaining = 3; // Reset undo count on new game
        },
        MAKE_LARGE(state, newGamesize) {
            state.gamesize = newGamesize;
        },
        MAKE_SMALL(state, newGamesize) {
            state.gamesize = newGamesize;
        },
        MOVE(state, move) {
            if (state.ingame) {
                state.lastMove = move;
                state.moveCount++;
            }
        },
        UPDATE_ALL(state, payload) {
            if (state.ingame) {
                // Save current state before updating
                state.moveHistory.push({
                    board: boardStateHelpers.cloneBoardState(state.allColorsArray),
                    moveCount: state.moveCount
                });

                let p = {};
                for (let a in payload.neighborsToUpdate) {
                    p[payload.neighborsToUpdate[a].id] = a;
                }
                let newA = [];
                for (let i in state.allColorsArray) {
                    let now = state.allColorsArray[i];
                    if (now.done) {
                        now.color = payload.localColor;
                    }
                    if (now.id in p) {
                        now.done = true;
                        now.color = payload.localColor;
                    }
                    newA.push(Object.assign({}, now));
                }
                state.allColorsArray = newA;
                const allDone = state.allColorsArray.filter(arg => arg.done);
                if (allDone.length === (state.gamesize * state.gamesize) && (state.moveCount <= state.maxMoves)) {
                    state.message = 'Nice job! You flooded the board in ' + state.moveCount + ' moves!';
                    state.showMessage = true;
                    state.ingame = false;
                } else if (state.moveCount === state.maxMoves) {
                    state.message = 'I\'m sorry you ran out of moves.';
                    state.showMessage = true;
                    state.ingame = false;
                }
            }
        },
        UNDO_MOVE(state) {
            if (state.moveHistory.length > 0 && state.undosRemaining > 0) {
                const previousState = state.moveHistory.pop();
                state.allColorsArray = previousState.board;
                state.moveCount = state.moveCount - 1; // Explicitly decrement move counter
                state.lastMove = 0; // Reset last move
                state.undosRemaining--;
            }
        },
        // Solver-related mutations
        TOGGLE_SOLVER(state) {
            state.solverActive = !state.solverActive;
        },
        SET_SOLVER_SOLUTION(state, solution) {
            state.solverSolution = solution;
        },
        INCREMENT_SOLVER_MOVE(state) {
            state.solverMoveIndex++;
        },
        SET_SOLVER_STRATEGY(state, strategy) {
            state.solverStrategy = strategy;
        },
        RESET_SOLVER(state) {
            state.solverActive = false;
            state.solverSolution = null;
            state.solverMoveIndex = 0;
        },
        SAVE_CURRENT_BOARD(state) {
            const hash = boardStateHelpers.createBoardHash(state.allColorsArray, state.gamesize);
            state.previousBoardState = boardStateHelpers.cloneBoardState(state.allColorsArray);
            state.currentBoardHash = hash;

            // Save complete board data to history
            state.boardHistory[hash] = {
              boardState: boardStateHelpers.cloneBoardState(state.allColorsArray),
              gamesize: state.gamesize,
              maxMoves: state.maxMoves,
              timestamp: Date.now(),
              strategies: state.boardHistory[hash]?.strategies || {},
            };

            // Update localStorage
            storageService.saveBoard(hash, state.boardHistory[hash]);
            console.log('Saved board with hash:', hash, state.boardHistory[hash]);
          },
        RESTORE_PREVIOUS_BOARD(state) {
            if (state.previousBoardState) {
                state.allColorsArray = boardStateHelpers.cloneBoardState(state.previousBoardState);
                state.moveCount = 0;
                state.lastMove = 0;
                state.ingame = true;
                state.showMessage = false;
            }
        },
        RECORD_SOLVER_RESULT(state, { strategy, moves, list }) {
            if (!state.currentBoardHash) return;

            // Update both solverResults and boardHistory
            const result = {
                boardState: state.previousBoardState,
                strategies: {
                    ...(state.solverResults[state.currentBoardHash]?.strategies || {}),
                    [strategy]: { moves, list }
                }
            };

            state.solverResults = {
                ...state.solverResults,
                [state.currentBoardHash]: result
            };

            state.boardHistory = {
                ...state.boardHistory,
                [state.currentBoardHash]: result
            };

            // Save to localStorage
            storageService.saveBoard(state.currentBoardHash, result);
        },
        SET_CURRENT_BOARD_HASH(state, hash) {
            state.currentBoardHash = hash;
        },
        SET_COMPARISON_BOARD(state, { strategy, board, moves }) {
            state.solverComparisonBoards[strategy] = { board, moves };
        },
        CLEAR_COMPARISON_BOARDS(state) {
            state.solverComparisonBoards = {};
        },
        LOAD_BOARD_HISTORY(state) {
            state.boardHistory = storageService.getAllBoards();
        },
    },
    actions: {
        saveToHistory(state, { hash, strategies }) {
            state.boardHistory[hash] = {
                board: [...state.allColorsArray],
                size: state.boardSize,
                moves: state.moves,
                maxMoves: state.maxMoves,
                timestamp: Date.now(),
                strategies: strategies || {}
            };
            localStorage.setItem('boardHistory', JSON.stringify(state.boardHistory));
        },
        restoreHistoricalBoard({ state, commit, dispatch }, boardHash) {
            console.log('Attempting to restore board:', boardHash);

            // Try getting board from both history and storage
            let boardData = state.boardHistory[boardHash] || storageService.getBoard(boardHash);

            if (!boardData || !boardData.boardState) {
              console.error('No board data found for hash:', boardHash);
              return;
            }

            const data = {
              ...DEFAULT_GAME,
              gamesize: boardData.gamesize,
              maxMoves: boardData.maxMoves,
              showStartup: false,
              ingame: true,
              moveCount: 0,
              allColorsArray: boardStateHelpers.cloneBoardState(boardData.boardState),
              currentBoardHash: boardHash,
              previousBoardState: boardData.boardState,
              solverResults: state.solverResults,
              solverStrategy: state.solverStrategy,
              boardHistory: state.boardHistory
            };

            // Set up lookup table
            data.allColorsArrayLookup = {};
            for (let el in data.allColorsArray) {
              const key = data.allColorsArray[el].id;
              data.allColorsArrayLookup[key] = el;
            }

            // Set initial cell as done
            data.allColorsArray[0].done = true;
            data.done = [data.allColorsArray[0]];

            commit('START_GAME', data);
            dispatch('checkDoneColors', data.allColorsArray[0].color);
          },
        initializeHistory(state) {
            const savedHistory = localStorage.getItem('boardHistory');
            if (savedHistory) {
                state.boardHistory = JSON.parse(savedHistory);
            }
        },
        showOptions({ commit }) {
            commit('SHOW_OPTIONS', true);
        },
        hideOptions({ commit }) {
            commit('HIDE_OPTIONS', false);
        },
        makeLarge({ commit, dispatch }) {
            commit('MAKE_LARGE', 20);
            dispatch('startGame');
        },
        makeSmall({ commit, dispatch }) {
            commit('MAKE_SMALL', 12);
            dispatch('startGame');
        },
        startGame({ commit, state, getters, dispatch }) {
            const solverDataToKeep = {
                solverResults: state.solverResults,
                solverStrategy: state.solverStrategy
            };
            let data = Object.assign({}, DEFAULT_GAME, solverDataToKeep);
            if (getters.gamesize === 12) {
                data.maxMoves = 22;
                data.theSize = 0;
                data.theSizeString = ' Psmall';
                data.gamesize = 12;
            } else if (getters.gamesize === 20) {
                data.maxMoves = 32;
                data.theSize = 2;
                data.theSizeString = ' Plarge';
                data.gamesize = 20;
            }
            data.showStartup = false;
            data.ingame = true;
            data.allColorsArray = generateArray(data.gamesize, data.colors);
            data.allColorsArrayLookup = {};
            for (let el in data.allColorsArray) {
                const key = data.allColorsArray[el].id;
                data.allColorsArrayLookup[key] = el;
            }
            const firstel = data.allColorsArray[0];
            firstel.done = true;
            data.done.push(firstel);
            commit('START_GAME', data);
            commit('SAVE_CURRENT_BOARD');
            dispatch('checkDoneColors', firstel.color);
        },
        moveMade({ commit, dispatch, getters }, color) {
            if (getters.lastMove !== color) {
                commit('MOVE', color);
                dispatch('checkDoneColors', color);
            }
        },
        checkDoneColors({ commit, getters }, color) {
            let neighborsToUpdate = [];
            let localColor = color;
            let elements = getters.allColorsArray.filter(element => element.done).map(element => ({ ...element }));
            for (let el = 0; el < elements.length; el++) {
                let element = elements[el];
                if (!color) {
                    localColor = element.color;
                }
                const id = element.id;
                const tempID = id.split('p');
                const tempx = tempID[0];
                const tempy = tempID[1];
                let dirs = [];
                dirs.push(tempx + 'p' + String(parseInt(tempy) - 1));
                dirs.push(String(parseInt(tempx) + 1) + 'p' + tempy);
                dirs.push(tempx + 'p' + String(parseInt(tempy) + 1));
                dirs.push(String(parseInt(tempx) - 1) + 'p' + tempy);
                for (let d in dirs) {
                    const dir = dirs[d];
                    if (dir.search('-') === -1) {
                        let neighbor = Object.assign({}, getters.allColorsArray[getters.allColorsArrayLookup[dir]]);
                        if (neighbor && neighbor.color === color && neighborsToUpdate.filter(n => n.id == dir).length === 0) {
                            neighbor.done = true;
                            neighborsToUpdate.push(neighbor);
                            elements.push(neighbor);
                        }
                    }
                }
            }
            commit('UPDATE_ALL', { neighborsToUpdate, localColor });
        },
        restorePreviousBoard({ commit }) {
            commit('RESTORE_PREVIOUS_BOARD');
            commit('RESET_SOLVER');
        },
        toggleSolver({ state, commit, dispatch }) {
            if (!state.ingame) return;
            if (!state.solverSolution) {
                const result = solver.solve(
                    state.allColorsArray,
                    state.gamesize,
                    state.solverStrategy,
                    state.maxMoves
                );
                commit('SET_SOLVER_SOLUTION', result.moves);
                commit('RECORD_SOLVER_RESULT', {
                    strategy: state.solverStrategy,
                    moves: result.solved ? result.moves.length : 'UNSOLVED',
                    list: result.moves,
                });
            }
            commit('TOGGLE_SOLVER');
            if (state.solverActive) {
                dispatch('playNextMove');
            }
        },
        playNextMove({ state, commit, dispatch }) {
            if (!state.solverActive || !state.solverSolution || !state.ingame) {
                commit('RESET_SOLVER');
                return;
            }
            if (state.solverMoveIndex < state.solverSolution.length) {
                dispatch('moveMade', state.solverSolution[state.solverMoveIndex]);
                commit('INCREMENT_SOLVER_MOVE');
                setTimeout(() => {
                    dispatch('playNextMove');
                }, state.solverDelay);
            } else {
                commit('RESET_SOLVER');
            }
        },
        changeSolverStrategy({ commit }, strategy) {
            commit('SET_SOLVER_STRATEGY', strategy);
            commit('RESET_SOLVER');
            console.log('new strategy', strategy);
        },
        async runAllStrategies({ state, dispatch, commit }) {
            if (!state.ingame) return;
            const strategies = [
                'simple', 'diagonal', 'edge', 'region',
                'enhancedDiagonal', 'enhancedRegion', 'connectivity',
                'distanceWeighted', 'colorClustering', 'hybrid', 'dynamic'
            ];
            for (const strategy of strategies) {
                if (strategy === 'simple') {
                    commit('SAVE_CURRENT_BOARD');
                }
                commit('SET_SOLVER_STRATEGY', strategy);
                await dispatch('runSolverWithStrategy', strategy);
                if (strategy !== 'dynamic') {
                    commit('RESTORE_PREVIOUS_BOARD');
                }
            }
        },
        async runSolverWithStrategy({ state, commit, dispatch }, strategy) {
            const result = solver.solve(
                state.allColorsArray,
                state.gamesize,
                strategy,
                state.maxMoves
            );
            commit('RECORD_SOLVER_RESULT', {
                strategy,
                moves: result.solved ? result.moves.length : 'UNSOLVED',
                list: result.moves,
            });
            if (result.moves.length > 0) {
                for (const move of result.moves) {
                    await new Promise(resolve => setTimeout(resolve, state.solverDelay));
                    await dispatch('moveMade', move);
                }
            }
        },
        restoreHistoricalBoard({ state, commit, dispatch }, boardHash) {
            console.log('Attempting to restore board:', boardHash);
            console.log('Current solver results:', state.solverResults);
            const boardData = state.solverResults[boardHash];
            if (!boardData || !boardData.boardState) {
                console.log('No board data found for hash:', boardHash);
                return;
            }
            console.log('Found board data:', boardData);
            commit('MOVE', 0);
            commit('RESET_SOLVER');
            const solverDataToKeep = {
                solverResults: state.solverResults,
                solverStrategy: state.solverStrategy
            };
            let data = Object.assign({}, DEFAULT_GAME, solverDataToKeep);
            data.gamesize = Math.sqrt(boardData.boardState.length);
            if (data.gamesize === 12) {
                data.maxMoves = 22;
                data.theSize = 0;
                data.theSizeString = ' Psmall';
            } else {
                data.maxMoves = 32;
                data.theSize = 2;
                data.theSizeString = ' Plarge';
            }
            data.showStartup = false;
            data.ingame = true;
            data.moveCount = 0;
            data.allColorsArray = boardStateHelpers.cloneBoardState(boardData.boardState);
            data.allColorsArrayLookup = {};
            for (let el in data.allColorsArray) {
                const key = data.allColorsArray[el].id;
                data.allColorsArrayLookup[key] = el;
            }
            const firstel = data.allColorsArray[0];
            firstel.done = true;
            data.done = [firstel];
            data.currentBoardHash = boardHash;
            data.previousBoardState = boardData.boardState;
            console.log('About to commit new game state with hash:', data.currentBoardHash);
            commit('START_GAME', data);
            console.log('After START_GAME, current hash is:', state.currentBoardHash);
            dispatch('checkDoneColors', firstel.color);
        },
        async runSolver({ state, commit }, { strategy, board, size }) {
            const result = solver.solve(
                board,
                size,
                strategy,
                state.maxMoves
            );

            // Create a series of board states for comparison
            const boardStates = [boardStateHelpers.cloneBoardState(board)]; // Start with initial state
            let currentBoard = boardStateHelpers.cloneBoardState(board);

            // Set initial "done" state for first cell
            currentBoard[0].done = true;

            // Apply each move to generate board states
            for (const move of result.moves) {
                // First mark all "done" cells with new color
                for (const cell of currentBoard) {
                    if (cell.done) {
                        cell.color = move;
                    }
                }

                // Then update "done" status based on flood fill
                const grid = solver.convertToGrid(currentBoard, size);
                const floodedRegion = solver.getFloodedRegion(grid);
                for (const [row, col] of floodedRegion) {
                    const id = `${row}p${col}`;
                    const cellIndex = currentBoard.findIndex(cell => cell.id === id);
                    if (cellIndex !== -1) {
                        currentBoard[cellIndex].done = true;
                    }
                }

                // Save state after this move
                boardStates.push(boardStateHelpers.cloneBoardState(currentBoard));
            }

            commit('SET_COMPARISON_BOARD', {
                strategy,
                board: boardStates,
                moves: result.moves
            });

            return {
                moves: result.solved ? result.moves.length : 'UNSOLVED',
                list: result.moves,
                boardStates
            };
        },
        clearComparisonBoards({ commit }) {
            commit('CLEAR_COMPARISON_BOARDS');
        },
        initializeHistory({ commit }) {
            commit('initializeHistory');
        },
        undoMove({ state, commit }) {
            if (state.undosRemaining <= 0) {
                window.alert("No more undos remaining! Start a new game to get more undos.");
                return;
            }
            commit('UNDO_MOVE');
        },
    },
    getters: {
        moveString: state => `${state.moveCount}/${state.maxMoves}`,
        maxMoves: state => state.maxMoves,
        lastMove: state => state.lastMove,
        moveCount: state => state.moveCount,
        colors: state => state.colors,
        allColorsArray: state => state.allColorsArray,
        allColorsArrayLookup: state => state.allColorsArrayLookup,
        showMessage: state => state.showMessage,
        done: state => state.done,
        showStartup: state => state.showStartup,
        showOptions: state => state.showOptions,
        gamesize: state => state.gamesize,
        theSizeString: state => state.theSizeString,
        getComparisonBoard: (state) => (strategy, moveIndex) => {
            return state.solverComparisonBoards[strategy]?.board[moveIndex] || [];
        },
        getComparisonMoves: (state) => (strategy) => {
            return state.solverComparisonBoards[strategy]?.moves || [];
        },
        boardDifficulty: (state) => (hash) => {
            return state.boardHistory[hash]?.difficulty || 0;
        },
        sortedBoardsByDifficulty: (state) => {
            return Object.entries(state.boardHistory)
                .sort(([,a], [,b]) => (b.difficulty || 0) - (a.difficulty || 0))
                .map(([hash, data]) => ({ hash, ...data }));
        }
    }
});

export default store;
