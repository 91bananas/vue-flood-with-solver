<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <div class="header-content">
          <h3>Strategy Comparison</h3>
          <div class="header-controls">
            <div class="filter-controls">
              <label>
                <input type="checkbox" v-model="showSolved"> Solved
              </label>
              <label>
                <input type="checkbox" v-model="showUnsolved"> Unsolved
              </label>
            </div>
            
            <div class="playback-controls">
              <button class="play-pause-btn" @click="togglePlayback">
                {{ isAutoPlaying ? '⏸' : '▶' }}
              </button>
              <div class="slider-container">
                <input
                  type="range"
                  v-model.number="currentMove"
                  :min="0"
                  :max="maxMoves"
                  :disabled="isAutoPlaying"
                  class="move-slider"
                >
                <div class="slider-labels">
                  <span>0</span>
                  <span>{{ maxMoves || '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="close-button" @click="close">&times;</button>
      </div>

      <div class="comparison-view">
        <div class="boards-grid">
          <div v-for="strategy in filteredStrategies"
               :key="strategy.value"
               class="board-wrapper"
               :class="getBoardStatusClass(strategy.value)">
            <div class="board-header">
              <div class="strategy-info">
                <h4>{{ strategy.label }}</h4>
                <span class="move-counter">
                  Move {{ displayMoveNumber }} of {{ getMovesCount(strategy.value) }}
                </span>
              </div>
              <div class="status-badge" :class="getBoardStatusClass(strategy.value)">
                {{ getBoardStatus(strategy.value) }}
              </div>
            </div>
            <div class="mini-board">
              <!-- Change the cell rendering -->
              <div v-for="cell in getBoardAtMove(strategy.value, currentMove)"
                   :key="`${strategy.value}-${cell.id}`"
                   :class="['cell', cell.color]">
              </div>
            </div>
            <div class="board-info">
              <div class="current-move">
                {{ getMoveInfo(strategy.value, currentMove) }}
              </div>
              <div class="completion">
                {{ getCompletionPercent(strategy.value, currentMove) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ComparisonModal',
  props: {
    isVisible: Boolean,
    initialBoard: Array,
    size: Number
  },
  data() {
    return {
      currentMove: 0,
      isAutoPlaying: false,
      playbackInterval: null,
      solverResults: {},
      showSolved: true,
      showUnsolved: true,
      strategies: [
        { value: 'simple', label: 'Simple' },
        { value: 'diagonal', label: 'Diagonal' },
        { value: 'edge', label: 'Edge' },
        { value: 'region', label: 'Region' },
        { value: 'connectivity', label: 'Connectivity' },
        { value: 'distanceWeighted', label: 'Distance' },
        { value: 'colorClustering', label: 'Clustering' },
        { value: 'hybrid', label: 'Hybrid' },
        { value: 'dynamic', label: 'Dynamic' }
      ]
    }
  },
  computed: {
    maxMoves() {
      if (Object.keys(this.solverResults).length === 0) {
        return 0;
      }
      return Math.max(...this.strategies.map(strategy => {
        const moves = this.$store.getters.getComparisonMoves(strategy.value);
        return moves?.length || 0;
      }));
    },
    displayMoveNumber() {
      return this.currentMove;
    },
    filteredStrategies() {
      return this.strategies.filter(strategy => {
        const moves = this.$store.getters.getComparisonMoves(strategy.value);
        const isSolved = moves && moves.length > 0;
        return (this.showSolved && isSolved) || (this.showUnsolved && !isSolved);
      });
    },
    gridSize() {
      return this.size || 12; // Default to 12 if size not provided
    }
  },
  methods: {
    close() {
      this.stopPlayback();
      this.$emit('close');
    },
    async mounted() {
      this.startComparison();
    },
    async startComparison() {
      this.currentMove = 0;
      this.solverResults = {};

      const boardCopy = this.initialBoard.map(cell => ({...cell}));
      
      for (const strategy of this.strategies) {
        try {
          const result = await this.$store.dispatch('runSolver', {
            strategy: strategy.value,
            board: boardCopy,
            size: this.size || Math.sqrt(this.initialBoard.length)
          });
          this.solverResults[strategy.value] = result;
        } catch (err) {
          console.error(`Error running solver for ${strategy.value}:`, err);
        }
      }

      if (Object.keys(this.solverResults).length > 0) {
        this.startPlayback();
      }
    },
    getStrategyLabel(strategy) {
      return this.strategies.find(s => s.value === strategy)?.label;
    },
    getCurrentBoard(strategy, moveIndex) {
      const board = this.$store.getters.getComparisonBoard(strategy, moveIndex);
      return board || this.initialBoard;
    },
    getMovesCount(strategy) {
      const moves = this.$store.getters.getComparisonMoves(strategy);
      return moves?.length || 0;
    },
    getMoveInfo(strategy, moveIndex) {
      if (moveIndex === 0) return 'Start';
      const moves = this.$store.getters.getComparisonMoves(strategy);
      if (!moves || moveIndex > moves.length) return 'No move';
      return `Move: ${moves[moveIndex - 1]}`;
    },
    getCompletionPercent(strategy, moveIndex) {
      const board = this.getBoardAtMove(strategy, moveIndex);
      if (!board) return 0;
      
      const doneCount = board.filter(cell => cell.done).length;
      return Math.round((doneCount / board.length) * 100);
    },
    togglePlayback() {
      if (this.isAutoPlaying) {
        this.stopPlayback();
      } else {
        this.startPlayback();
      }
    },
    startPlayback() {
      this.isAutoPlaying = true;
      this.playbackInterval = setInterval(() => {
        if (this.currentMove >= this.maxMoves) {
          this.stopPlayback();
          return;
        }
        this.currentMove++;
      }, 500); // Made animation faster
    },
    stopPlayback() {
      this.isAutoPlaying = false;
      clearInterval(this.playbackInterval);
    },
    nextMove() {
      if (this.currentMove < this.maxMoves - 1) {
        this.currentMove++;
      }
    },
    previousMove() {
      if (this.currentMove > 0) {
        this.currentMove--;
      }
    },
    getBoardStatus(strategy) {
      const moves = this.$store.getters.getComparisonMoves(strategy);
      const board = this.$store.getters.getComparisonBoard(strategy, moves?.length || 0);
      
      if (!moves) return 'Pending';
      
      // Check if all cells are the same color in final state
      const isSolved = board?.every(cell => cell.color === board[0].color);
      
      if (moves.length >= 22 && !isSolved) {
        return 'Not solved';
      }
      
      return isSolved ? `Solved in ${moves.length}` : 'Not solved';
    },

    getBoardStatusClass(strategy) {
      const moves = this.$store.getters.getComparisonMoves(strategy);
      const board = this.$store.getters.getComparisonBoard(strategy, moves?.length || 0);
      
      if (!moves) return 'pending';
      
      const isSolved = board?.every(cell => cell.color === board[0].color);
      return isSolved ? 'solved' : 'unsolved';
    },
    getBoardAtMove(strategy, moveIndex) {
      const boards = this.$store.getters.getComparisonBoard(strategy, moveIndex);
      const totalMoves = this.getMovesCount(strategy);
      
      // If this strategy is done, show its final state
      if (moveIndex >= totalMoves) {
        return this.$store.getters.getComparisonBoard(strategy, totalMoves) || this.initialBoard;
      }
      
      // Otherwise show the current move state
      return boards || this.initialBoard;
    }
  },
  watch: {
    currentMove(newValue) {
      // Ensure currentMove stays within bounds
      if (newValue < 0) {
        this.currentMove = 0;
      } else if (this.maxMoves > 0 && newValue > this.maxMoves) {
        this.currentMove = this.maxMoves;
      }
    },
    isVisible: {
      immediate: true,
      handler(newValue) {
        if (newValue) {
          this.startComparison();
        }
      }
    }
  },
  beforeUnmount() {
    this.stopPlayback();
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 90vw;  // Wider to accommodate more boards
  max-height: 90vh;
  overflow: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  position: relative;

  .header-content {
    flex: 1;
    
    h3 {
      margin-bottom: 10px;
    }
  }

  .close-button {
    position: static; // Remove absolute positioning
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 5px 10px;
    margin-left: 20px;

    &:hover {
      color: #666;
    }
  }
}

.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  min-width: 180px;
  // ...rest of existing filter controls styles...
}

.boards-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 10px 0;
  justify-content: center;
  max-width: 1200px;  // Prevent getting too wide
  margin-left: auto;
  margin-right: auto;
}

.board-wrapper {
  flex: 0 0 auto;
  width: 180px;  // Fixed width for each board
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  
  &.solved { border-color: #4CAF50; }
  &.unsolved { border-color: #f44336; }
  &.pending { border-color: #ff9800; }

  .mini-board {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1px;
    background: #222;
    padding: 1px;
    margin: 5px auto;
    width: 120px;
    height: 120px;

    @media (min-width: 768px) {
      width: 140px;
      height: 140px;
    }
    
    @media (min-width: 1200px) {
      width: 160px;
      height: 160px;
    }

    .cell {
      width: 100%;
      height: 100%;
      min-width: 8px;
      min-height: 8px;
      
      &.blue { background-color: #0000ff; }
      &.red { background-color: #ff0000; }
      &.yellow { background-color: #ffff00; }
      &.purple { background-color: #800080; }
      &.orange { background-color: #ff7600; }
      &.green { background-color: #00aa00; }
    }
  }
}

.board-header {
  padding: 4px 6px;
  background: #f5f5f5;
  border-radius: 4px;
  margin: -5px -5px 5px -5px;
  
  .strategy-info {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 2px;
    
    h4 {
      font-size: 0.8em;
      margin: 0;
    }
    
    .move-counter {
      font-size: 0.7em;
      color: #666;
    }
  }
}

.status-badge {
  font-size: 0.65em;
  padding: 1px 4px;
  margin-top: 2px;
  
  &.solved {
    background: #e8f5e9;
    color: #2e7d32;
  }
  
  &.unsolved {
    background: #ffebee;
    color: #c62828;
  }
  
  &.pending {
    background: #fff3e0;
    color: #ef6c00;
  }
}

.comparison-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;

  button {
    padding: 8px 16px;
    font-size: 18px;
  }
}

.strategy-select {
  .strategy-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 20px 0;
  }
}

.board-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2px;
  padding: 0 4px;
  height: 1.2em;
  font-family: monospace;
  font-size: 0.75em;
  color: #666;

  .current-move {
    text-align: left;
  }

  .completion {
    text-align: right;
  }
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  max-width: 600px;  // Reduced from 800px
  margin: 0 auto;    // Changed from 20px auto

  .play-pause-btn {
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    font-size: 14px;   // Slightly smaller font
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;        // Remove padding
    min-width: 32px;   // Ensure consistent size

    &:hover {
      background: #45a049;
    }
  }

  .slider-container {
    flex: 1;
    margin: 0 20px;    // Increased side margins
    position: relative;  // For absolute positioning of labels
    padding: 0 10px;    // Space for the labels

    .move-slider {
      width: 100%;
      // ...existing slider styles...
    }

    .slider-labels {
      display: flex;
      justify-content: space-between;
      position: absolute;
      left: 0;
      right: 0;
      bottom: -20px;
      color: #666;
      font-size: 12px;

      span {
        &:first-child { transform: translateX(-50%); }
        &:last-child { transform: translateX(50%); }
      }
    }
  }
}
</style>
