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

    window.electron.ipcRenderer.on('update-message', this.handleUpdateMessage)

    // Eğer zaten giriş yapılmışsa pencereyi büyüt
    if (localStorage.getItem('tenant_id')) {
      window.api.send('login-success')
    }
  },
  methods: {
    handleUpdateMessage(event, message) {
      this.$notify({
        title: 'Sistem Güncellemesi',
        message: message,
        type: 'info',
        duration: 5000
      })
    }
  },
  beforeDestroy() {
    window.electron.ipcRenderer.removeAllListeners('update-message')
  }
}
</script>