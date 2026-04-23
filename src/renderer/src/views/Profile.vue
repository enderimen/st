<template>
  <el-card class="card-view">
    <div class="card-header">
      <h1><i class="el-icon-user"></i> Profil Bilgilerim</h1>
    </div>

    <el-upload
      class="avatar-uploader"
      :show-file-list="false"
      :before-upload="beforeAvatarUpload"
      :on-change="handleFileChange"
      :auto-upload="false"
      action=" "
    >
      <img v-if="profile.imageUrl" :src="profile.imageUrl" class="avatar" />
      <i v-else class="el-icon-plus avatar-uploader-icon"></i>
    </el-upload>

    <el-form class="form-size" label-position="top">
      <el-form-item label="Ad Soyad" class="custom-width">
        <el-input v-model="profile.full_name" placeholder="Adınızı ve soyadınızı girin" />
      </el-form-item>
      <el-form-item label="Şirket" class="custom-width">
        <el-input v-model="profile.tenant_name" disabled />
      </el-form-item>
      <el-form-item label="E-posta" class="custom-width">
        <el-input v-model="profile.email" disabled />
      </el-form-item>
      <el-form-item label="Yetki / Rol" class="custom-width">
        <el-input v-model="profile.role" disabled />
      </el-form-item>
      <el-button type="success" @click="saveProfile" :loading="loading">Kaydet</el-button>
    </el-form>
  </el-card>
</template>

<script>
import { supabase } from '../utils/supabase'
import globalMixin from '../mixin/global.mixin.js'

export default {
  name: 'Profile',
  mixins: [globalMixin],
  data() {
    return {
      profile: {
        full_name: '',
        tenant_name: '',
        email: '',
        role: '',
        imageUrl: ''
      },
      loading: false,
      selectedFile: null
    }
  },
  async mounted() {
    await this.fetchProfile()
  },
  methods: {
    async fetchProfile() {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (user) {
        this.profile.email = user.email

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          this.profile.full_name = profile.full_name
          this.profile.role = profile.role

          // Şirket adını çek
          const { data: tenant } = await supabase
            .from('tenants')
            .select('name')
            .eq('id', profile.tenant_id)
            .single()

          if (tenant) {
            this.profile.tenant_name = tenant.name
            localStorage.setItem('tenant_name', tenant.name)
          }

          localStorage.setItem('user_full_name', profile.full_name)
        }
      }
    },
    beforeAvatarUpload(file) {
      const isImage = ['image/jpeg', 'image/png'].includes(file.type)
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isImage) this.$message.error('Yalnızca JPG/PNG dosyaları yükleyebilirsiniz!')
      if (!isLt2M) this.$message.error("Resim boyutu 2MB'den küçük olmalıdır!")

      return isImage && isLt2M
    },
    handleFileChange(file) {
      this.selectedFile = file.raw
      this.profile.imageUrl = URL.createObjectURL(file.raw)
    },
    async saveProfile() {
      try {
        this.loading = true
        const {
          data: { user }
        } = await supabase.auth.getUser()

        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: this.profile.full_name
          })
          .eq('id', user.id)

        if (error) throw error

        localStorage.setItem('user_full_name', this.profile.full_name)

        this.$message.success('Profil bilgileri başarıyla güncellendi!')
      } catch (err) {
        console.error(err)
        this.$message.error('Profil güncellenirken bir hata oluştu!')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.form-size {
  width: 200px;
}
.custom-width div {
  width: 290px !important;
}
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
}
.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}
.avatar {
  width: 178px;
  height: 178px;
  display: block;
  border-radius: 6px;
}
</style>
