<template>
  <div v-if="showOptions" class="startUp" id="options">
    <p>Board Size</p>
    <a href='#' id="small_sizer" @click="makeSmall">Small</a>
    <a href='#' id="large_sizer" @click="makeLarge">Large</a>
    <div id="close_btn">
      <button class="close_btn" @click="hideOptions">Close</button>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  computed: {
    showOptions() {
      return this.$store.getters.showOptions;
    }
  },
  methods: {
    ...mapActions(['hideOptions', 'makeLarge', 'makeSmall'])
  }
}
</script>
