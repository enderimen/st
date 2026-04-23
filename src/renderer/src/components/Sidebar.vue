<template>
  <div class="sidebar-content">
    <div class="sidebar-logo">
      <el-image
        v-if="tenantLogoUrl"
        style="width: 80px; height: 80px"
        :src="tenantLogoUrl"
        fit="cover"></el-image>
      <i v-else class="el-icon-office-building" style="font-size: 40px; color: #fff; margin-bottom: 10px;"></i>

      <div>
        <p>{{ tenantName }}</p>
        <sub>v1.0.0</sub>
      </div>
    </div>
    <el-menu
      class="sidebar"
      :collapse="collapsed"
      background-color="#2c3e50"
      text-color="#fff"
      active-text-color="#ffd04b"
      :default-active="$route.path"
      router
    >
      <el-menu-item index="/anasayfa">
        <i class="el-icon-house"></i>
        Anasayfa
      </el-menu-item>
      <el-submenu index="0">
        <template #title>
          <i class="el-icon-school"></i>
          <span>Üretim & Operasyon</span>
        </template>
        <el-menu-item index="/anasayfa/uretimler">
          <i class="el-icon-coin"></i>
          Üretimler
        </el-menu-item>
        <el-menu-item index="/anasayfa/tum-sezonlar">
          <i class="el-icon-date"></i>
          Tüm Sezonlar
        </el-menu-item>
        <el-menu-item index="/anasayfa/urunler">
          <i class="el-icon-refrigerator"></i>
          Ürün Çeşitleri
        </el-menu-item>
        <el-menu-item index="/anasayfa/tedarikciler">
          <i class="el-icon-pie-chart"></i>
          Tedarikçiler
        </el-menu-item>
      </el-submenu>
      <el-submenu index="1">
        <template #title>
          <i class="el-icon-user"></i>
          <span>Müşteri Yönetimi</span>
        </template>
        <el-menu-item index="/anasayfa/musteriler">
          <i class="el-icon-s-unfold"></i>
          Müşteri Listesi
        </el-menu-item>
      </el-submenu>
      <el-submenu index="2">
        <template #title>
          <i class="el-icon-s-finance"></i>
          <span>Cari Yönetimi</span>
        </template>
        <el-menu-item index="/anasayfa/tum-cariler">
          <i class="el-icon-tickets"></i>
          Tüm Cariler
        </el-menu-item>
        <el-menu-item index="/anasayfa/tum-cari-islemleri">
          <i class="el-icon-edit-outline"></i>
          Cari Ekstreleri
        </el-menu-item>
      </el-submenu>
      <el-submenu index="3">
        <template #title>
          <i class="el-icon-question"></i>
          <span>Yardım</span>
        </template>
        <el-menu-item index="/anasayfa/ayarlar">
          <i class="el-icon-picture"></i>
          Nasıl Kullanılır?
        </el-menu-item>
      </el-submenu>
    </el-menu>

    <footer class="sidebar-footer" @click="open">
      <i class="el-icon-switch-button"></i>
      <p class="logout">Çıkış Yap</p>
    </footer>
  </div>
</template>

<script>
import { supabase } from '../utils/supabase'
import globalMixin from '../mixin/global.mixin.js'

export default {
  name: 'Sidebar',
  mixins: [globalMixin],
  props: ['collapsed'],
  data() {
    return {
      dialogVisible: false
    }
  },
  methods: {
    async logout() {
      await supabase.auth.signOut()
      localStorage.removeItem('tenant_id')
      localStorage.removeItem('tenant_name')
      localStorage.removeItem('tenant_logo_url')
      localStorage.removeItem('user_full_name')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_id')
      
      this.$router.push({ name: 'Login' })
    },
    open() {
      this.$confirm('Çıkış yapmak istediğinden emin misiniz?', 'Oturum Kapatma İşlemi', {
        distinguishCancelAndClose: true,
        confirmButtonText: 'Evet, Kapat',
        cancelButtonText: 'İptal Et',
      })
      .then(() => {
        this.logout();
      })
      .catch(action => {
        this.$notify({
          title: 'Bilgi',
          type: 'info',
          message: action === 'cancel' ? 'Oturum kapatma işlemi iptal edildi' : 'İşlem iptal edildi',
          duration: 3000,
          position: 'top-right',
        });
      });
    }
  },
}
</script>
  
<style lang="scss" scoped>
::v-deep {
  i {
    color: var(--white) !important;
  }
  .el-menu-item {
    display: flex;
    align-items: center;
    letter-spacing: .5px;

    &.is-active {
      font-weight: 600;
      [class^="el-icon-"] {
        color: inherit !important;
      }
    }
  }
}
.sidebar {
  width: 100%;
  height: 100vh;
  min-width: 200px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  border: none !important;
  
  &-content {
    display: flex;
    flex-direction: column;
    background-color: var(--sidebar-bg);
    width: 240px;
    min-width: 240px;
  }
  &-logo {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 16px 30px;
    color: var(--light-text);
    font-weight: bold;
    border-bottom: 1px solid var(--dusty-gray);

    sub {
      font-size: 11px;
      margin-top: 3px;
      opacity: 0.7;
    }
  }
  &-footer {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: auto;
    padding: 20px;
    color: var(--light-text);
    font-size: 20px;
    background-color: var(--pickled-bluewood);
    border-top: 1px solid var(--dark-border);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--dark-theme);
    }
    .logout {
      font-size: 14px !important;
    }
  }
}
</style>
  