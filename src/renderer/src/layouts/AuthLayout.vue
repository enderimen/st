<template>
  <div class="auth-layout">
    <router-view />
  </div>
</template>
  
  <script>
export default {
  name: 'AuthLayout'
}
</script>
  
<style scoped>
.auth-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>
  