<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted() {
    document.title = import.meta.env.VITE_APP_TITLE
    
    // Eğer zaten giriş yapılmışsa pencereyi büyüt
    if (localStorage.getItem('tenant_id')) {
      window.api.send('login-success')
    }
  }
}
</script>