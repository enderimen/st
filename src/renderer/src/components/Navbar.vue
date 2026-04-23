<template>
  <el-header class="navbar">
    <el-button class="hamburger-btn" icon="el-icon-menu" @click="$emit('toggleSidebar')" circle />

    <div class="search-bar">
      <el-input
        placeholder="Ne yapmak istersin?"
        prefix-icon="el-icon-search"
        class="search-bar-input"
        v-model="form.search"
      />
      <div v-if="getSearchResult.length > 0 && form.search.length > 0" class="search-bar-results">
        <ul>
          <li v-for="result in getSearchResult" :key="result.title">
            <router-link class="link" :to="result.link">{{ result.title }}</router-link>
          </li>
        </ul>
      </div>
    </div>
    <div class="profile-section">
      <p>Hoş geldin <span>{{ userFullName }}!</span></p>
      <el-dropdown class="profile-dropdown" @command="open">
        <span class="el-dropdown-link">
          <el-avatar :src="tenantLogoUrl" icon="el-icon-office-building"></el-avatar>
        </span>
        <el-dropdown-menu>
          <el-dropdown-item icon="el-icon-user">
            <router-link class="link" to="/anasayfa/profilim">Profil Bilgilerim</router-link>
          </el-dropdown-item>
          <el-dropdown-item divided command="logout" icon="el-icon-switch-button"
          >Çıkış Yap</el-dropdown-item
          >
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script>
import { SEARCH_ITEMS } from './../utils/constants';
import { supabase } from '../utils/supabase'
import globalMixin from '../mixin/global.mixin.js';

export default {
  name: 'Navbar',
  mixins: [globalMixin],
  data() {
    return {
      form: {
        search: ''
      },
      dialogVisible: false
    }
  },
  computed: {
    getSearchResult() {
      return SEARCH_ITEMS.filter((item) => {
        return item.keywords.toLowerCase().includes(this.form.search.toLowerCase())
      })
    }
  },
  methods: {
    open(type) {
      if (type != 'logout') return;
      
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
    },
    async logout() {
      await supabase.auth.signOut()
      localStorage.removeItem('tenant_id')
      localStorage.removeItem('user_full_name')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_id')
      
      this.$router.push({ name: 'Login' })
      // window.api.send('logout') // Eğer electron tarafında bir logout işlemi gerekiyorsa aktif kalabilir
    }
  },
  watch: {
    $route: {
      handler() {
        this.form.search = ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--navbar-bg);
  
  .profile {
    &-section {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;

      span {
        text-transform: capitalize;
      }
    }
    &-dropdown {
      cursor: pointer;
    }
  }
  .hamburger-btn {
    display: none;
  }
}
.search-bar {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 400px !important;

  &-input {
    width: 100%;
    margin: 0 20px;
  }
  &-results {
    position: absolute;
    background-color: #ffffff;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    top: 55px;
    left: 20px;
    width: 100%;
    border-radius: 4px;
    z-index: 2;
  }

  ul {
    list-style: none;
    li {
      padding: 10px 12px;
      transition: all 0.3s ease;
      cursor: pointer;

      &:not(:last-child) {
        border-bottom: 1px solid #e8e8e8;
      }

      &:hover {
        background-color: #f5f5f5;
      }
    }
  }
}
@media (max-width: 768px) {
  .hamburger-btn {
    display: inline-flex;
  }
}
</style>
  