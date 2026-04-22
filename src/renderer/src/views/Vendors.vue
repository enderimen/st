<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <h1><i class="el-icon-pie-chart"></i> Tedarikçiler ({{ getDetailVendorInfo?.length }})</h1>
      <el-button
        type="primary"
        @click="isOpenDialog('add')"
        icon="el-icon-circle-plus"
      >
        Yeni Tedarikçi Oluştur
      </el-button>
    </div>

    <div class="search">
      <el-input
        v-model="filter.search"
        placeholder="Tedarikçi arayın"
        clearable
      />
    </div>

    <el-table
      :data="paginatedData"
      border
      style="width: 100%"
      empty-text="Tedarikçi bulunamadı"
    >
      <el-table-column prop="name" sortable label="Ad Soyad"></el-table-column>
      <el-table-column prop="phone" sortable label="Telefon Numarası"></el-table-column>
      <el-table-column prop="address" sortable label="Adres"></el-table-column>
      <el-table-column fixed="right" label="İşlem" width="281">
        <template v-slot="scope">
          <el-button
            type="success"
            size="small"
            icon="el-icon-notebook-2"
            @click="handleClick(scope.row)"
          >Üretilen Partileri Gör</el-button>

          <el-tooltip content="Tedarikçiyi Düzenle" placement="top-start">
            <el-button
              type="primary"
              icon="el-icon-edit"
              circle
              @click="isOpenDialog('edit', scope.row)"
            ></el-button>
          </el-tooltip>

          <el-tooltip content="Tedarikçiyi Sil" placement="top-start">
            <el-button
              type="danger"
              icon="el-icon-delete"
              circle
              @click="open(scope.row)"
            ></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      background
      layout="prev, pager, next"
      :total="filteredData?.length"
      :page-size="pageSize"
      :current-page="currentPage"
      @current-change="handlePageChange"
      style="margin-top: 20px; text-align: center"
    />

    <!-- Dialog -->
    <el-dialog
      :title="editingVendor ? 'Tedarikçi Bilgilerini Düzenle' : 'Yeni Tedarikçi Oluştur'"
      :visible.sync="dialogVisible"
      width="30%"
    >
      <el-form
        label-position="top"
        :model="formData"
        :rules="rules"
        ref="formRef"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Ad Soyad" prop="name">
              <el-input v-model="formData.name"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Telefon" prop="phone">
              <el-input
                v-model="formData.phone"
                placeholder="(555) 555 55 55"
                @input="formatPhone"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Adres" prop="address">
          <el-input
            type="textarea"
            class="no-resize-textarea"
            v-model="formData.address"
          ></el-input>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Vazgeç</el-button>
        <el-button
          type="primary"
          :disabled="isSaveDisabled"
          @click="saveVendor"
        >Kaydet</el-button>
      </span>
    </el-dialog>
  </el-card>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  name: "Vendors",
  data() {
    return {
      dialogVisible: false,
      currentPage: 1,
      pageSize: 8,
      filter: { search: "" },
      editingVendor: false,
      originalFormData: null,
      formData: { id: "", name: "", phone: "", address: "" },
      rules: {
        name: [
          { required: true, message: "Ad Soyad zorunlu", trigger: "blur" }
        ],
        phone: [
          { required: true, message: "Telefon numarası zorunlu", trigger: "blur" },
          {
            pattern: /^\(\d{3}\) \d{3} \d{2} \d{2}$/,
            message: "Geçersiz telefon numarası",
            trigger: "blur"
          }
        ],
        address: [
          { required: true, message: "Adres zorunlu", trigger: "blur" }
        ]
      },
    };
  },
  async mounted () {
    await this.getAllVendor();
  },
  computed: {
    ...mapGetters({
      getDetailVendorInfo: 'vendor/getDetailVendorInfo'
    }),
    filteredData() {
      if (!this.filter.search) return this.getDetailVendorInfo;
      return this.getDetailVendorInfo?.filter((item) =>
        item.name.toLowerCase().includes(this.filter.search.toLowerCase())
      );
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredData?.slice(start, start + this.pageSize);
    },
    isSaveDisabled() {
      const { name, phone, address } = this.formData;
      if (!name || !phone || !address) return true;

      if (this.editingVendor && this.originalFormData) {
        return JSON.stringify(this.formData) === JSON.stringify(this.originalFormData);
      }
      return false;
    }
  },
  methods: {
    ...mapActions({
      getAllVendor: 'vendor/getAllVendor',
      deleteVendor: 'vendor/deleteVendor',
      addVendor: 'vendor/addVendor',
      updateVendor: 'vendor/updateVendor'
    }),
    handlePageChange(page) {
      this.currentPage = page;
    },
    handleClick(row) {
      this.$router.push({
        name: "Manufacture",
        params: { vendorName: row.name },
      });
    },
    isOpenDialog(type, vendor = null) {
      this.editingVendor = type === "edit";
      if (vendor) {
        this.formData = { ...vendor };
        this.originalFormData = { ...vendor };
      } else {
        this.formData = { name: "", phone: "", address: "" };
        this.originalFormData = null;
      }
      this.dialogVisible = true;
    },
    saveVendor() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return;

        if (this.editingVendor) {
          await this.updateVendor(this.formData);
          this.$notify({
            title: "Başarılı",
            type: "success",
            message: "Tedarikçi bilgileri güncellendi!",
          });
        } else {
          await this.addVendor(this.formData);
          this.$notify({
            title: "Başarılı",
            type: "success",
            message: "Tedarikçi oluşturuldu!",
          });
        }
        this.dialogVisible = false;
      });
    },
    open(vendor) {
      this.$confirm(
        `${vendor.name} adlı tedarikçiyi silmek istediğinden emin misiniz?`,
        "Tedarikçi Silme İşlemi",
        {
          confirmButtonText: "Evet, Sil",
          cancelButtonText: "İptal Et",
          type: "warning",
        })
        .then(async () => {
          await this.deleteVendor(vendor.id);
          this.$notify({
            title: "Başarılı",
            type: "success",
            message: "Tedarikçi başarıyla silindi!",
          });
        })
        .catch(() => {
          this.$notify({
            title: "Bilgi",
            type: "info",
            message: "İşlem iptal edildi",
          });
        });
    },
    formatPhone(value) {
      let digits = value.replace(/\D/g, "").substring(0, 10);
      if (digits.length <= 3) {
        this.formData.phone = `(${digits}`;
      } else if (digits.length <= 6) {
        this.formData.phone = `(${digits.substring(0, 3)}) ${digits.substring(3)}`;
      } else if (digits.length <= 8) {
        this.formData.phone = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)} ${digits.substring(6)}`;
      } else {
        this.formData.phone = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep {
  .no-resize-textarea {
    font-family: 'Poppins';
  }
}
</style>