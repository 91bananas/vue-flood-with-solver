<template>
  <div v-if="showMessage" class='startUp' id='msgbox'>
    <p>{{message}}</p>
    <div>
      <button class="play-button" @click="startGame">Please click here to play again</button>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  computed: {
    showMessage() {
      return this.$store.getters.showMessage;
    },
    ...mapState(['message'])
  },
  methods: {
    startGame() {
      this.$store.dispatch('startGame');
    }
  }
}
</script>
