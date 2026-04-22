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
      <el-form-item label="Kullanıcı adı" class="custom-width">
        <el-input v-model="profile.username" placeholder="Kullanıcı adınızı girin" />
      </el-form-item>
      <el-form-item label="Şirket adı" class="custom-width">
        <el-input v-model="profile.companyName" placeholder="Şirket adınızı girin" />
      </el-form-item>
      <el-button type="success" @click="saveProfile" :loading="isCompleted">Kaydet</el-button>
    </el-form>
  </el-card>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Profile',
  data() {
    return {
      profile: {
        username: '',
        companyName: '',
        imageUrl: ''
      },
      isCompleted: false,
      selectedFile: null
    }
  },
  mounted() {
    this.profile.username = this.getProfileDetail.username;
    this.profile.companyName = this.getProfileDetail.companyName;
    this.profile.imageUrl = this.getProfileDetail.imageUrl;
  },
  computed: {
    ...mapGetters({
      getUser: 'auth/getUser',
      getProfileDetail: 'user/getProfileDetail',
    })
  },
  methods: {
    ...mapActions({
      updateProfile: 'user/updateProfile'
    }),
    beforeAvatarUpload(file) {
      const isImage = ['image/jpeg', 'image/png'].includes(file.type);
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isImage) this.$message.error('Yalnızca JPG/PNG dosyaları yükleyebilirsiniz!');
      if (!isLt2M) this.$message.error('Resim boyutu 2MB\'den küçük olmalıdır!');

      return isImage && isLt2M;
    },
    handleFileChange(file) {
      this.selectedFile = file.raw;
      this.profile.imageUrl = URL.createObjectURL(file.raw);
    },
    async saveProfile() {
      const userId = this.getUser.id;

      try {
        this.isCompleted = true;
        const formData = new FormData();
        if (this.selectedFile) formData.append('file', this.selectedFile);
        if (this.profile.companyName) formData.append('companyName', this.profile.companyName);
        if (this.profile.username) formData.append('username', this.profile.username);

        const response = await this.updateProfile({ userId, formData });
        const { profileImageUrl, companyName, username } = response.data;

        if (response.isSuccess) {
          this.profile.imageUrl = profileImageUrl;
          this.profile.companyName = companyName;
          this.profile.username = username;
          this.$message.success(response.message || 'Profil bilgileri başarıyla güncellendi!');
        } else {
          this.$message.error(response.message || 'Profil güncellenirken bir hata oluştu!');
        }
        this.isCompleted = false;
      } catch (err) {
        console.error(err);
        this.$message.error('Profil güncellenirken bir hata oluştu!');
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
