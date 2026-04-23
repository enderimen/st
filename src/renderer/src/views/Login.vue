<template>
  <div class="login-page">
    <el-card class="login-card">
      <div class="login-header">
        <h2 class="title">Hoş Geldiniz!</h2>
        <p class="desc">Stok Takip Programı</p>
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
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="E-posta adresinizi girin"
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
            @keyup.enter.native="handleLogin"
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
import { supabase } from '../utils/supabase'

export default {
  name: 'Login',
  data() {
    return {
      loading: false,
      isOnline: navigator.onLine,
      showOnlineMessage: false,
      loginForm: {
        email: '',
        password: ''
      },
      rules: {
        email: [
          { required: true, message: 'E-posta adresi gerekli', trigger: 'blur' },
          {
            type: 'email',
            message: 'Geçerli bir e-posta adresi girin',
            trigger: ['blur', 'change']
          }
        ],
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
  methods: {
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
            const { data, error } = await supabase.auth.signInWithPassword({
              email: this.loginForm.email,
              password: this.loginForm.password
            })

            if (error) throw error

            if (data?.user) {
              // Profil bilgilerini çek
              const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)

              if (profileError) throw profileError

              if (!profiles || profiles.length === 0) {
                this.$notify({
                  title: 'Profil Eksik',
                  type: 'warning',
                  message: 'Kullanıcı profiliniz bulunamadı. Lütfen yöneticiye başvurun.',
                  duration: 5000
                })
                this.loading = false
                return
              }

              const profile = profiles[0]

              // Şirket bilgisini çek
              const { data: tenants, error: tenantError } = await supabase
                .from('tenants')
                .select('name, logo_url')
                .eq('id', profile.tenant_id)

              if (tenantError) throw tenantError

              const tenant = tenants?.[0]

              // Bilgileri sakla
              localStorage.setItem('tenant_id', profile.tenant_id)
              localStorage.setItem('tenant_name', tenant ? tenant.name : 'Tanımsız Şirket')
              localStorage.setItem('tenant_logo_url', tenant?.logo_url || '')
              localStorage.setItem('user_full_name', profile.full_name)
              localStorage.setItem('user_role', profile.role)
              localStorage.setItem('user_id', profile.id)

              this.$notify({
                title: 'Başarılı',
                type: 'success',
                message: `Hoş geldiniz, ${profile.full_name}`,
                duration: 2000
              })

              window.api.send('login-success')
              this.$router.push({ name: 'Home' })
            }
          } catch (error) {
            console.error('Login error:', error)
            this.$notify({
              title: 'Hata',
              type: 'error',
              message: error.message || 'Giriş yapılamadı, bilgilerinizi kontrol edin.',
              duration: 3000
            })
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
  