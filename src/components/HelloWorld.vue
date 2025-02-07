<template>
  <div class="hello">
    <h1>{{ greeting }}</h1>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data() {
    return {
      greeting: 'Hello, World!'
    };
  }
});
</script>

<style scoped>
.hello {
  text-align: center;
  margin-top: 20px;
}
</style>