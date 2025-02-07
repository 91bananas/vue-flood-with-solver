// import { createStore } from 'vuex'
// import solver from '../solver/solver'
// import { boardStateHelpers } from '../solver/boardStateHelpers'

// const DEFAULT_GAME = {
//     gamesize: 12,
//     done: [],
//     ingame: false,
//     lastMove: 0,
//     maxMoves: 22,
//     moveCount: 0,
//     theSize: 0,
//     theSizeString: '',
//     gameOver: false,
//     colors: ['blue', 'red', 'yellow', 'purple', 'orange', 'green'],
//     showOptions: false,
//     showMessage: false,
//     showStartup: true,
//     message: '',
//     allColorsArray: [],
//     allColorsArrayLookup: {},
//     solverDelay: 100,
//     solverActive: false,
//     solverSolution: null,
//     solverStrategy: 'simple',
//     solverMoveIndex: 0,
//     previousBoardState: null,
//     currentBoardHash: null,
//     solverResults: {}
// }

// const getColor = function(colors) {
//     const random = Math.floor(Math.random() * 6)
//     return colors[random]
// }

// const generateArray = function(size, colors) {
//     const returnArray = []
//     const loop = [...Array(size).keys()]
//     for (let el of loop) {
//         for (let el2 of loop) {
//             returnArray.push({ id: el + 'p' + el2, color: getColor(colors), done: false })
//         }
//     }
//     return returnArray
// }

// const store = createStore({
//     state: () => Object.assign({}, DEFAULT_GAME),
//     getters: {
//         moveString: state => `Moves: ${state.moveCount}/${state.maxMoves}`,
//         maxMoves: state => state.maxMoves,
//         lastMove: state => state.lastMove,
//         moveCount: state => state.moveCount,
//         colors: state => state.colors,
//         allColorsArray: state => state.allColorsArray,
//         allColorsArrayLookup: state => state.allColorsArrayLookup,
//         showMessage: state => state.showMessage,
//         message: state => state.message,
//         done: state => state.done,
//         showStartup: state => state.showStartup,
//         showOptions: state => state.showOptions,
//         gamesize: state => state.gamesize,
//         theSizeString: state => state.theSizeString,
//         solverActive: state => state.solverActive
//     },
//     mutations: {
//         MOVE(state, move) {
//             if (state.ingame) {
//                 state.lastMove = move;
//                 state.moveCount++;
//             }
//         },
//         START_GAME(state) {
//             state.moveCount = 0;
//             state.ingame = true;
//         },
//         SHOW_OPTIONS(state, show) {
//             state.showOptions = show
//         },
//         HIDE_OPTIONS(state, show) {
//             state.showOptions = show;
//         },
//         START_GAME(state, newGame) {
//             const solverState = {
//                 solverResults: state.solverResults,
//                 solverStrategy: state.solverStrategy,
//                 currentBoardHash: newGame.currentBoardHash,
//                 previousBoardState: newGame.previousBoardState
//             };
//             Object.assign(state, DEFAULT_GAME);
//             Object.assign(state, newGame);
//             Object.assign(state, solverState);
//         },
//         MAKE_LARGE(state, newGamesize) {
//             state.gamesize = newGamesize;
//         },
//         MAKE_SMALL(state, newGamesize) {
//             state.gamesize = newGamesize;
//         },
//         UPDATE_ALL(state, payload) {
//             if (state.ingame) {
//                 let p = {};
//                 for (let a in payload.neighborsToUpdate) {
//                     p[payload.neighborsToUpdate[a].id] = a;
//                 }
//                 let newA = [];
//                 for (let i in state.allColorsArray) {
//                     let now = state.allColorsArray[i];
//                     if (now.done) {
//                         now.color = payload.localColor;
//                     }
//                     if (now.id in p) {
//                         now.done = true;
//                         now.color = payload.localColor;
//                     }
//                     newA.push(Object.assign({}, now));
//                 }
//                 state.allColorsArray = newA;
//                 const allDone = state.allColorsArray.filter(arg => arg.done);
//                 if (allDone.length === (state.gamesize * state.gamesize) && (state.moveCount <= state.maxMoves)) {
//                     state.message = 'Nice job! You flooded the board in ' + state.moveCount + ' moves!';
//                     state.showMessage = true;
//                     state.ingame = false;
//                 } else if (state.moveCount === state.maxMoves) {
//                     state.message = 'I\'m sorry you ran out of moves.';
//                     state.showMessage = true;
//                     state.ingame = false;
//                 }
//             }
//         },
//         TOGGLE_SOLVER(state) {
//             state.solverActive = !state.solverActive;
//         },
//         SET_SOLVER_SOLUTION(state, solution) {
//             state.solverSolution = solution;
//         },
//         INCREMENT_SOLVER_MOVE(state) {
//             state.solverMoveIndex++;
//         },
//         SET_SOLVER_STRATEGY(state, strategy) {
//             state.solverStrategy = strategy;
//         },
//         RESET_SOLVER(state) {
//             state.solverActive = false;
//             state.solverSolution = null;
//             state.solverMoveIndex = 0;
//         },
//         SAVE_CURRENT_BOARD(state) {
//             state.previousBoardState = boardStateHelpers.cloneBoardState(state.allColorsArray);
//             state.currentBoardHash = boardStateHelpers.createBoardHash(state.allColorsArray, state.gamesize);
//         },
//         RESTORE_PREVIOUS_BOARD(state) {
//             if (state.previousBoardState) {
//                 state.allColorsArray = boardStateHelpers.cloneBoardState(state.previousBoardState);
//                 state.moveCount = 0;
//                 state.lastMove = 0;
//                 state.ingame = true;
//                 state.showMessage = false;
//             }
//         },
//         RECORD_SOLVER_RESULT(state, { strategy, moves, list }) {
//             if (!state.currentBoardHash) return;
//             state.solverResults = {
//                 ...state.solverResults,
//                 [state.currentBoardHash]: {
//                     ...(state.solverResults[state.currentBoardHash] || {}),
//                     boardState: state.previousBoardState,
//                     [strategy]: { moves, list },
//                 }
//             };
//         },
//         SET_CURRENT_BOARD_HASH(state, hash) {
//             state.currentBoardHash = hash;
//         }
//     },
//     actions: {
//         startGame({ commit }) {
//             commit('START_GAME');
//         },
//         moveMade({ commit }, color) {
//             commit('MOVE', color);
//         },
//         showOptions({ commit }) {
//             commit('SHOW_OPTIONS', true)
//         },
//         hideOptions({ commit }) {
//             commit('HIDE_OPTIONS', false);
//         },
//         makeLarge({ commit, dispatch }) {
//             commit('MAKE_LARGE', 20);
//             dispatch('startGame');
//         },
//         makeSmall({ commit, dispatch }) {
//             commit('MAKE_SMALL', 12);
//             dispatch('startGame');
//         },
//         startGame({ commit, state, getters, dispatch }) {
//             const solverDataToKeep = {
//                 solverResults: state.solverResults,
//                 solverStrategy: state.solverStrategy
//             };
//             let data = Object.assign({}, DEFAULT_GAME, solverDataToKeep);
//             if (getters.gamesize === 12) {
//                 data.maxMoves = 22;
//                 data.theSize = 0;
//                 data.theSizeString = ' Psmall';
//                 data.gamesize = 12;
//             } else if (getters.gamesize === 20) {
//                 data.maxMoves = 32;
//                 data.theSize = 2;
//                 data.theSizeString = ' Plarge';
//                 data.gamesize = 20;
//             }
//             data.showStartup = false;
//             data.ingame = true;
//             data.allColorsArray = generateArray(data.gamesize, data.colors);
//             data.allColorsArrayLookup = {};
//             for (let el in data.allColorsArray) {
//                 const key = data.allColorsArray[el].id;
//                 data.allColorsArrayLookup[key] = el;
//             }
//             const firstel = data.allColorsArray[0];
//             firstel.done = true;
//             data.done.push(firstel);
//             commit('START_GAME', data);
//             commit('SAVE_CURRENT_BOARD');
//             dispatch('checkDoneColors', firstel.color);
//         },
//         checkDoneColors({ commit, getters }, color) {
//             let neighborsToUpdate = [];
//             let localColor = color;
//             let elements = getters.allColorsArray.filter(element => element.done).map(element => ({ ...element }));
//             for (let el = 0; el < elements.length; el++) {
//                 let element = elements[el];
//                 if (!color) {
//                     localColor = element.color;
//                 }
//                 const id = element.id;
//                 const tempID = id.split('p');
//                 const tempx = tempID[0];
//                 const tempy = tempID[1];
//                 let dirs = [];
//                 dirs.push(tempx + 'p' + String(parseInt(tempy) - 1));
//                 dirs.push(String(parseInt(tempx) + 1) + 'p' + tempy);
//                 dirs.push(tempx + 'p' + String(parseInt(tempy) + 1));
//                 dirs.push(String(parseInt(tempx) - 1) + 'p' + tempy);
//                 for (let d in dirs) {
//                     const dir = dirs[d];
//                     if (dir.search('-') === -1) {
//                         let neighbor = Object.assign({}, getters.allColorsArray[getters.allColorsArrayLookup[dir]]);
//                         if (neighbor && neighbor.color === color && neighborsToUpdate.filter(n => n.id == dir).length === 0) {
//                             neighbor.done = true;
//                             neighborsToUpdate.push(neighbor);
//                             elements.push(neighbor);
//                         }
//                     }
//                 }
//             }
//             commit('UPDATE_ALL', { neighborsToUpdate, localColor });
//         },
//         toggleSolver({ state, commit, dispatch }) {
//             if (!state.ingame) return;
//             if (!state.solverSolution) {
//                 const result = solver.solve(
//                     state.allColorsArray,
//                     state.gamesize,
//                     state.solverStrategy,
//                     state.maxMoves
//                 );
//                 commit('SET_SOLVER_SOLUTION', result.moves);
//                 commit('RECORD_SOLVER_RESULT', {
//                     strategy: state.solverStrategy,
//                     moves: result.solved ? result.moves.length : 'UNSOLVED',
//                     list: result.moves,
//                 });
//             }
//             commit('TOGGLE_SOLVER');
//             if (state.solverActive) {
//                 dispatch('playNextMove');
//             }
//         },
//         playNextMove({ state, commit, dispatch }) {
//             if (!state.solverActive || !state.solverSolution || !state.ingame) {
//                 commit('RESET_SOLVER');
//                 return;
//             }
//             if (state.solverMoveIndex < state.solverSolution.length) {
//                 dispatch('moveMade', state.solverSolution[state.solverMoveIndex]);
//                 commit('INCREMENT_SOLVER_MOVE');
//                 setTimeout(() => {
//                     dispatch('playNextMove');
//                 }, state.solverDelay);
//             } else {
//                 commit('RESET_SOLVER');
//             }
//         },
//         restorePreviousBoard({ commit }) {
//             commit('RESTORE_PREVIOUS_BOARD');
//             commit('RESET_SOLVER');
//         },
//         changeSolverStrategy({ commit }, strategy) {
//             commit('SET_SOLVER_STRATEGY', strategy);
//             commit('RESET_SOLVER');
//         },
//         async runAllStrategies({ state, dispatch, commit }) {
//             // ... copy implementation from store.js
//         },
//         async runSolverWithStrategy({ state, commit, dispatch }, strategy) {
//             // ... copy implementation from store.js
//         },
//         restoreHistoricalBoard({ state, commit, dispatch }, boardHash) {
//             // ... copy implementation from store.js
//         }
//     }
// })

// export default store
