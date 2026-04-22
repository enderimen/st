<template>
  <div class="panel-layout">
    <Sidebar :collapsed="isSidebarCollapsed" @toggle="toggleSidebar" />

    <div class="main-container" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <Navbar @toggleSidebar="toggleSidebar" />
      <ContentArea>
        <router-view />
      </ContentArea>
    </div>
  </div>
</template>
  
<script>
import ContentArea from '../components/ContentArea.vue';
import Sidebar from '../components/Sidebar.vue';
import Navbar from '../components/Navbar.vue';

export default {
  name: 'PanelLayout',
  components: { Sidebar, Navbar, ContentArea },
  data() {
    return {
      isSidebarCollapsed: false,
    };
  },
  methods: {
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },
  },
};
</script>

<style lang="scss">
#app {
  display: flex;
  height: 100vh;
}
.panel-layout {
  display: flex;
  width: 100%;
}
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s;

  &.sidebar-collapsed {
    margin-left: 60px; // collapsed sidebar width
  }
}
</style>