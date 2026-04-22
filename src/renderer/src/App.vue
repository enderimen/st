<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted () {
    document.title = import.meta.env.VITE_APP_TITLE;
  },
}
</script>