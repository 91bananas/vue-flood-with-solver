<template>
  <div id="app">
    <app-header />
    <div class="game-wrapper">
      <game-header />
      <game-board />
      <color-controls />
    </div>
    <solver-controls />
    <start-modal />
    <message-modal />
    <options-modal />
  </div>
</template>

<script lang="ts">
import AppHeader from './components/AppHeader.vue'
import GameHeader from './components/GameHeader.vue'
import GameBoard from './components/GameBoard.vue'
import ColorControls from './components/ColorControls.vue'
import SolverControls from './components/SolverControls.vue'
import StartModal from './components/StartModal.vue'
import MessageModal from './components/MessageModal.vue'
import OptionsModal from './components/OptionsModal.vue'

export default {
  name: 'App',
  components: {
    AppHeader,
    GameHeader,
    GameBoard,
    ColorControls,
    SolverControls,
    StartModal,
    MessageModal,
    OptionsModal
  }
}
</script>

<style lang="scss">
@import './assets/styles.scss';
</style>
