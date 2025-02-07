<template>
  <div class="moves-container cb-mode">
    <div v-for="el in colors"
         :key="el"
         :id="el + 'cont'"
         :class="el + ' outer_moves'"
         @click="handleCellClick(el)" />
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  computed: {
    ...mapState(['lastMove', 'ingame', 'colors'])
  },
  methods: {
    handleCellClick(color) {
      this.$store.dispatch('moveMade', color);
    },
  },
}
</script>
