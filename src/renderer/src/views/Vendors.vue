<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <h1><i class="el-icon-pie-chart"></i> Tedarikçiler ({{ vendorList?.length }})</h1>
      <el-button type="primary" @click="isOpenDialog('add')" icon="el-icon-circle-plus">
        Yeni Tedarikçi Oluştur
      </el-button>
    </div>

    <div class="search">
      <el-input v-model="filter.search" placeholder="Tedarikçi arayın" clearable />
    </div>

    <el-table :data="paginatedData" border style="width: 100%" empty-text="Tedarikçi bulunamadı">
      <el-table-column prop="full_name" sortable label="Ad Soyad"></el-table-column>
      <el-table-column prop="phone" sortable label="Telefon Numarası"></el-table-column>
      <el-table-column prop="address" sortable label="Adres"></el-table-column>
      <el-table-column prop="total_purchase" sortable label="Toplam Alım">
        <template v-slot="scope">{{ scope.row.total_purchase | formatNumber }} ₺</template>
      </el-table-column>
      <el-table-column prop="total_paid" sortable label="Toplam Ödenen">
        <template v-slot="scope">{{ scope.row.total_paid | formatNumber }} ₺</template>
      </el-table-column>
      <el-table-column prop="debt" sortable label="Borç">
        <template v-slot="scope">
          <el-tag :type="scope.row.debt > 0 ? 'danger' : 'success'" effect="dark">
            {{ scope.row.debt | formatNumber }} ₺
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="İşlem" width="115">
        <template v-slot="scope">
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
            <el-form-item label="Ad Soyad" prop="full_name">
              <el-input v-model="formData.full_name"></el-input>
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
        <el-button type="primary" :disabled="isSaveDisabled" @click="saveVendor">Kaydet</el-button>
      </span>
    </el-dialog>
  </el-card>
</template>

<script>
import { supabase } from '../utils/supabase'
import globalMixin from '../mixin/global.mixin.js'

export default {
  name: 'Vendors',
  mixins: [globalMixin],
  data() {
    return {
      vendorList: [],
      vendors: [],
      dialogVisible: false,
      currentPage: 1,
      pageSize: 8,
      filter: { search: '' },
      editingVendor: false,
      originalFormData: null,
      formData: { id: '', full_name: '', phone: '', address: '' },
      rules: {
        full_name: [{ required: true, message: 'Ad Soyad zorunlu', trigger: 'blur' }],
        phone: [
          { required: true, message: 'Telefon numarası zorunlu', trigger: 'blur' },
          {
            pattern: /^\(\d{3}\) \d{3} \d{2} \d{2}$/,
            message: 'Geçersiz telefon numarası',
            trigger: 'blur'
          }
        ],
        address: [{ required: true, message: 'Adres zorunlu', trigger: 'blur' }]
      }
    }
  },
  async mounted() {
    await this.getAllVendor()
  },
  computed: {
    filteredData() {
      if (!this.filter.search) return this.vendorList
      return this.vendorList?.filter((item) =>
        item.full_name?.toLowerCase().includes(this.filter.search.toLowerCase())
      )
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredData?.slice(start, start + this.pageSize)
    },
    isSaveDisabled() {
      const { full_name, phone, address } = this.formData
      if (!full_name || !phone || !address) return true

      if (this.editingVendor && this.originalFormData) {
        return JSON.stringify(this.formData) === JSON.stringify(this.originalFormData)
      }
      return false
    }
  },
  methods: {
    async getAllVendor() {
      const { data, error } = await supabase
        .from('vendors')
        .select(
          `
          *,
          production_inputs (
            total_purchase_amount,
            paid_amount
          )
        `
        )
        .eq('tenant_id', this.currentTenantId)

      if (error) {
        console.error('Error fetching vendors:', error)
        this.$message.error('Tedarikçiler yüklenirken bir hata oluştu.')
      } else {
        this.vendorList = data.map((v) => {
          const total_purchase =
            v.production_inputs?.reduce((s, i) => s + (i.total_purchase_amount || 0), 0) || 0
          const total_paid = v.production_inputs?.reduce((s, i) => s + (i.paid_amount || 0), 0) || 0
          return {
            ...v,
            total_purchase,
            total_paid,
            debt: total_purchase - total_paid
          }
        })
      }
    },
    async addVendor(payload) {
      const { error } = await supabase.from('vendors').insert([
        {
          full_name: payload.full_name,
          phone: payload.phone,
          address: payload.address,
          tenant_id: this.currentTenantId
        }
      ])
      if (error) throw error
      await this.getAllVendor()
    },
    async updateVendor(payload) {
      const { error } = await supabase
        .from('vendors')
        .update({
          full_name: payload.full_name,
          phone: payload.phone,
          address: payload.address
        })
        .eq('id', payload.id)
      if (error) throw error
      await this.getAllVendor()
    },
    async deleteVendor(id) {
      const { error } = await supabase.from('vendors').delete().eq('id', id)
      if (error) throw error
      await this.getAllVendor()
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    isOpenDialog(type, vendor = null) {
      this.editingVendor = type === 'edit'
      if (vendor) {
        this.formData = { ...vendor }
        this.originalFormData = { ...vendor }
      } else {
        this.formData = { full_name: '', phone: '', address: '' }
        this.originalFormData = null
      }
      this.dialogVisible = true
    },
    saveVendor() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return

        if (this.editingVendor) {
          try {
            await this.updateVendor(this.formData)
            this.$notify({
              title: 'Başarılı',
              type: 'success',
              message: 'Tedarikçi bilgileri güncellendi!'
            })
          } catch (error) {
            this.$message.error('Tedarikçi güncellenirken hata oluştu.')
            console.error(error)
          }
        } else {
          try {
            await this.addVendor(this.formData)
            this.$notify({
              title: 'Başarılı',
              type: 'success',
              message: 'Tedarikçi oluşturuldu!'
            })
          } catch (error) {
            this.$message.error('Tedarikçi eklenirken hata oluştu.')
            console.error(error)
          }
        }
        this.dialogVisible = false
      })
    },
    open(vendor) {
      this.$confirm(
        `${vendor.full_name} adlı tedarikçiyi silmek istediğinden emin misiniz?`,
        'Tedarikçi Silme İşlemi',
        {
          confirmButtonText: 'Evet, Sil',
          cancelButtonText: 'İptal Et',
          type: 'warning'
        }
      )
        .then(async () => {
          try {
            await this.deleteVendor(vendor.id)
            this.$notify({
              title: 'Başarılı',
              type: 'success',
              message: 'Tedarikçi başarıyla silindi!'
            })
          } catch (error) {
            this.$message.error('Tedarikçi silinirken hata oluştu.')
            console.error(error)
          }
        })
        .catch(() => {
          this.$notify({
            title: 'Bilgi',
            type: 'info',
            message: 'İşlem iptal edildi'
          })
        })
    },
    formatPhone(value) {
      let digits = value.replace(/\D/g, '').substring(0, 10)
      if (digits.length <= 3) {
        this.formData.phone = `(${digits}`
      } else if (digits.length <= 6) {
        this.formData.phone = `(${digits.substring(0, 3)}) ${digits.substring(3)}`
      } else if (digits.length <= 8) {
        this.formData.phone = `(${digits.substring(0, 3)}) ${digits.substring(
          3,
          6
        )} ${digits.substring(6)}`
      } else {
        this.formData.phone = `(${digits.substring(0, 3)}) ${digits.substring(
          3,
          6
        )} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .no-resize-textarea {
    font-family: 'Poppins';
  }
}
</style>