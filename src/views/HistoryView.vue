<template>
  <div class="history-view">
    <h2>Solver History</h2>
    <div class="history-controls">
      <button @click="$router.push('/')">Back to Game</button>
      <select v-model="sortBy">
        <option value="recent">Most Recent</option>
        <option value="difficulty">By Difficulty</option>
      </select>
    </div>

    <table class="results-table">
      // ... similar table structure as SolverControls ...
    </table>
  </div>
</template>

<script>
export default {
  name: 'HistoryView',
  data() {
    return {
      sortBy: 'recent'
    }
  },
  computed: {
    sortedBoards() {
      const boards = this.$store.state.boardHistory;
      if (this.sortBy === 'difficulty') {
        return this.$store.getters.sortedBoardsByDifficulty;
      }
      // Sort by timestamp
      return Object.entries(boards)
        .sort(([,a], [,b]) => b.timestamp - a.timestamp)
        .map(([hash, data]) => ({ hash, ...data }));
    }
  },
  // ... rest of component logic ...
}
</script>
