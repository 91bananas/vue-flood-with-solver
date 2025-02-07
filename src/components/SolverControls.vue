<template>
  <div class="solver-controls">
    <div class="solver-settings">
      <label>Solver Strategy:</label>
      <select v-model="solverStrategy">
        <optgroup label="Basic Strategies">
          <option value="simple">Simple</option>
          <option value="diagonal">Diagonal Priority</option>
          <option value="edge">Edge Priority</option>
          <option value="region">Region Merging</option>
        </optgroup>
        <optgroup label="Enhanced Strategies">
          <option value="enhancedDiagonal">Enhanced Diagonal</option>
          <option value="enhancedRegion">Enhanced Region</option>
          <option value="connectivity">Connectivity Based</option>
          <option value="distanceWeighted">Distance Weighted</option>
          <option value="colorClustering">Color Clustering</option>
          <option value="hybrid">Hybrid</option>
          <option value="dynamic">Dynamic</option>
        </optgroup>
      </select>
      <button @click="$store.dispatch('toggleSolver')" :disabled="!ingame">
        Solve Board
      </button>
      <button @click="restoreBoard" :disabled="!hasPreviousBoard">
        Restore Previous Board
      </button>
      <button @click="runAllStrategies" :disabled="!ingame">
        Run All Strategies
      </button>
      <button @click="showComparison" :disabled="!ingame">
        Compare Solutions
      </button>
    </div>
    <!-- Results table section -->
    <div class="solver-results" v-if="hasResults">
      <h4>Solver Results</h4>

      <div class="results-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </div>

      <div class="results-content">
        <!-- Basic Strategies Tab -->
        <div v-if="activeTab === 'basic'" class="results-table-wrapper">
          <table class="results-table">
            <thead>
              <tr>
                <th>Board ID</th>
                <th>Simple</th>
                <th>Diagonal</th>
                <th>Edge</th>
                <th>Region</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(result, hash) in recentBoards"
                  :key="hash"
                  :class="{ 'current-board': isCurrentBoard(hash) }">
                <td>
                  {{ formatBoardId(hash) }}
                  <span class="success-ratio">({{ getSuccessRatio(result) }})</span>
                </td>
                <td>{{ formatResult(result.simple) }}</td>
                <td>{{ formatResult(result.diagonal) }}</td>
                <td>{{ formatResult(result.edge) }}</td>
                <td>{{ formatResult(result.region) }}</td>
                <td>
                  <a v-if="!isCurrentBoard(hash)"
                     @click="restoreBoardState(hash)">
                    Restore
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="table-footer">
            <button v-if="hasMoreHistory"
                    @click="showFullHistory"
                    class="view-history-btn">
              View Full History ({{ totalBoards - 5 }} more)
            </button>
          </div>
        </div>

        <!-- Enhanced Strategies Tab -->
        <div v-if="activeTab === 'enhanced'" class="results-table-wrapper">
          <table class="results-table">
            <thead>
              <tr>
                <th>Board ID</th>
                <th>E.Diagonal</th>
                <th>E.Region</th>
                <th>Connectivity</th>
                <th>Distance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(result, hash) in solverResults"
                  :key="hash"
                  :class="{ 'current-board': isCurrentBoard(hash) }">
                <td>{{ formatBoardId(hash) }}</td>
                <td>{{ formatResult(result.enhancedDiagonal) }}</td>
                <td>{{ formatResult(result.enhancedRegion) }}</td>
                <td>{{ formatResult(result.connectivity) }}</td>
                <td>{{ formatResult(result.distanceWeighted) }}</td>
                <td>
                  <a v-if="!isCurrentBoard(hash)"
                     @click="restoreBoardState(hash)">
                    Restore
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Advanced Strategies Tab -->
        <div v-if="activeTab === 'advanced'" class="results-table-wrapper">
          <table class="results-table">
            <thead>
              <tr>
                <th>Board ID</th>
                <th>Clustering</th>
                <th>Hybrid</th>
                <th>Dynamic</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(result, hash) in solverResults"
                  :key="hash"
                  :class="{ 'current-board': isCurrentBoard(hash) }">
                <td>{{ formatBoardId(hash) }}</td>
                <td>{{ formatResult(result.colorClustering) }}</td>
                <td>{{ formatResult(result.hybrid) }}</td>
                <td>{{ formatResult(result.dynamic) }}</td>
                <td>
                  <a v-if="!isCurrentBoard(hash)"
                     @click="restoreBoardState(hash)">
                    Restore
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <ComparisonModal
      v-if="isComparisonVisible"
      :isVisible="isComparisonVisible"
      :initialBoard="currentBoard"
      :size="boardSize"
      @close="isComparisonVisible = false"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { useRouter } from 'vue-router';  // Add this import
import ComparisonModal from './ComparisonModal.vue'

export default {
  components: {
    ComparisonModal
  },
  data() {
    return {
      activeTab: 'basic',
      tabs: [
        { id: 'basic', label: 'Basic Strategies' },
        { id: 'enhanced', label: 'Enhanced Strategies' },
        { id: 'advanced', label: 'Advanced Strategies' }
      ],
      isComparisonVisible: false
    }
  },
  computed: {
    ...mapState(['ingame', 'currentBoardHash', 'solverStrategy']),
    canUndo() {
      return this.$store.state.moveCount > 0;
    },
    solverResults() {
      // The boardHistory already contains strategies
      const results = {};
      Object.entries(this.$store.state.boardHistory).forEach(([hash, data]) => {
        results[hash] = data.strategies || {};
      });
      return results;
    },
    hasPreviousBoard() {
      return !!this.$store.state.previousBoardState;
    },
    hasResults() {
      return Object.keys(this.solverResults).length > 0;
    },
    currentBoard() {
      return this.$store.state.allColorsArray
    },
    boardSize() {
      return this.$store.state.boardSize
    },
    recentBoards() {
      const boardEntries = Object.entries(this.solverResults)
        .sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0))
        .slice(0, 5);
      return Object.fromEntries(boardEntries);
    },
    totalBoards() {
      return Object.keys(this.solverResults).length;
    },
    hasMoreHistory() {
      return this.totalBoards > 5;
    }
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  methods: {
    isCurrentBoard(hash) {
      return hash === this.currentBoardHash;
    },
    restoreBoardState(boardHash) {
      try {
        this.$store.dispatch('restoreHistoricalBoard', boardHash);
      } catch (error) {
        console.error('Failed to restore board:', error);
        // Optionally show user feedback
        alert('Failed to restore board state');
      }
    },
    undoLastMove() {
      this.$store.dispatch('undoMove');
    },
    formatBoardId(hash) {
      return hash.slice(-6);
    },
    formatResult(result) {
      if (!result) return '-';
      return result.moves === 'UNSOLVED' ? '❌' : result.moves.toString();
    },
    getSuccessRatio(result) {
      if (!result) return '0/0';
      const total = Object.keys(result).length;
      const solved = Object.values(result)
        .filter(s => typeof s.moves === 'number').length;
      return `${solved}/${total}`;
    },
    restoreBoard() {
      this.$store.dispatch('restorePreviousBoard');
    },
    runAllStrategies() {
      this.$store.dispatch('runAllStrategies');
    },
    showComparison() {
      this.isComparisonVisible = true
    },
    showFullHistory() {
      this.router.push('/history');  // Use router from setup
    }
  },
  created() {
    // Initialize history when component is created
    this.$store.dispatch('initializeHistory');
  }
}
</script>

<style lang="scss" scoped>
.solver-controls {
  // ...existing styles...
}

.results-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: -1px;

  button {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: #f5f5f5;
    border-radius: 4px 4px 0 0;
    cursor: pointer;

    &.active {
      background: #fff;
      border-bottom-color: #fff;
      font-weight: bold;
    }

    &:hover {
      background: #fff;
    }
  }
}

.results-table-wrapper {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 0 4px 4px 4px;
  padding: 16px;
}

.results-table {
  width: 100%;

  th, td {
    padding: 8px;
    text-align: center;
  }
}

.table-footer {
  margin-top: 1rem;
  text-align: center;
}

.view-history-btn {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #eee;
  }
}

.success-ratio {
  font-size: 0.8em;
  color: #666;
  margin-left: 4px;
}
</style>
