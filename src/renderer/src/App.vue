<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted() {
    const tenantName = localStorage.getItem('tenant_name')
    document.title = tenantName ? `${tenantName} | Stok Takip Programı` : 'Stok Takip Programı'
    
    // Eğer zaten giriş yapılmışsa pencereyi büyüt
    if (localStorage.getItem('tenant_id')) {
      window.api.send('login-success')
    }
  }
}
</script>