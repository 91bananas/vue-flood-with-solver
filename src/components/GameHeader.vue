<template>
  <div id="bar">
    <div class="movers" id="count">
      <span id="movestring">{{moveString}}</span>
      <span class="undo-count" v-if="undosRemaining > 0">({{undosRemaining}} undos left)</span>
    </div>
    <button class='conts' @click="handleOptionsClick">OPTIONS</button>
    <button class='conts' @click="undoMove" :disabled="!canUndo || undosRemaining <= 0">UNDO</button>
    <button class='conts' @click="startGame">RESTART</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const moveString = computed(() => store.getters.moveString)
const canUndo = computed(() => store.state.moveCount > 0)
const undosRemaining = computed(() => store.state.undosRemaining)

const handleOptionsClick = () => {
  store.dispatch('showOptions')
}

const startGame = () => {
  store.dispatch('startGame')
}

const undoMove = () => {
  store.dispatch('undoMove')
}
</script>

<style>
header {
  padding: 1rem;
  text-align: center;
}
#movestring {
  font-weight: bold;
  font-size: 1.2em;
}
.undo-count {
  font-size: 0.8em;
  color: #666;
  margin-left: 8px;
}
</style>
