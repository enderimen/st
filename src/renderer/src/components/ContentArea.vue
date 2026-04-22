<template>
    <div class="content-area">
      <slot />
    </div>
</template>

<script>
export default {
  name: 'ContentArea',
}
</script>

<style lang="scss">
.content-area {
  padding: 40px;
  background-color: var(--main-content-bg);
  flex: 1;
  overflow-y: auto;
}
</style>
  