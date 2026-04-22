<template>
  <div class="login-page">
    <el-card class="login-card">
      <div class="login-header">
        <h2 class="title">Hoş Geldiniz!</h2>
        <p class="desc">{{ getProfileDetail.companyName }} | Stok Takip Programı</p>
      </div>

      <el-alert
        v-if="!isOnline"
        class="message"
        title="İnternet bağlantınızı kontrol edin."
        type="warning"
        show-icon
        :closable="false"
      >
      </el-alert>

      <el-alert
        v-if="isOnline && showOnlineMessage"
        class="message"
        title="İnternet bağlantısı sağlandı."
        type="success"
        show-icon
        :closable="false"
      >
      </el-alert>

      <el-form :model="loginForm" ref="loginForm" :rules="rules" label-position="top">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="Kullanıcı adınızı girin"
            autocomplete="off"
          ></el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            type="password"
            v-model="loginForm.password"
            placeholder="Şifrenizi girin"
            autocomplete="off"
            show-password
          >
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            class="login-btn"
            :disabled="!isOnline"
          >
            Giriş Yap
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'Login',
  data() {
    return {
      loading: false,
      isOnline: navigator.onLine,
      showOnlineMessage: false,
      loginForm: {
        username: 'senkoylum',
        password: '123456'
      },
      rules: {
        username: [{ required: true, message: 'Kullanıcı adı gerekli', trigger: 'blur' }],
        password: [{ required: true, message: 'Şifre gerekli', trigger: 'blur' }]
      }
    }
  },
  mounted() {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  },
  beforeDestroy() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
  },
  computed: {
    ...mapGetters({
      getProfileDetail: 'user/getProfileDetail'
    })
  },
  methods: {
    ...mapActions({
      login: 'auth/login'
    }),
    handleOnline() {
      this.isOnline = true
      this.showOnlineMessage = true

      setTimeout(() => {
        this.showOnlineMessage = false
      }, 2000)
    },
    handleOffline() {
      this.isOnline = false
    },
    handleLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (valid) {
          this.loading = true

          try {
            const { accessToken } = await this.login(this.loginForm)

            if (accessToken) {
              window.api.send('login-success')
              this.$router.push({ name: 'Home' })
            } else {
              this.$notify({
                title: 'Başarısız',
                type: 'error',
                message: 'Lütfen bilgilerinizi kontrol edin!',
                duration: 3000,
                position: 'top-right'
              })
              this.loading = false
              return
            }
          } catch (error) {
            if (err.response && err.response.status === 401) {
              const msg = err.response.data?.message || 'Yetkisiz giriş'
              this.$notify({
                title: 'Başarısız',
                type: 'error',
                message: msg,
                duration: 3000,
                position: 'top-right'
              })
              console.error(msg)
            }
          } finally {
            this.loading = false
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.login-card {
  width: 365px;
  padding: 20px;
  border: none;
  transition: all 0.3s ease;
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.login-header h2 {
  margin-bottom: 8px;
  font-weight: 700;
}

.login-header p {
  color: #666;
  font-size: 12px;
}

.login-btn {
  width: 100%;
  background: linear-gradient(to right, #6a11cb, #2575fc);
  border-color: transparent;
  &:hover {
    background: linear-gradient(to right, #2575fc, #6a11cb);
  }
}
.message {
  margin-bottom: 5px;
  position: absolute;
  bottom: 40px;
  left: 40px;
  max-width: 285px;
}
</style>
  