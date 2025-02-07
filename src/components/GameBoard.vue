<template>
  <div id="console">
    <div id="gameboard" class="cb-mode">
      <div class='blackoverlay' id='fade'></div>
      <div id="innerboard">
        <div v-for="el in allColorsArray"
             :key="el.id"
             :id="el.id"
             :class="el.color + ' pieces ' + theSizeString"
             @click="handleCellClick(el)" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  computed: {
    ...mapState(['lastMove', 'ingame', 'theSizeString', 'allColorsArray'])
  },
  methods: {
    handleCellClick(el) {
      this.$store.dispatch('moveMade', el.color);
    },
  },
}
</script>
