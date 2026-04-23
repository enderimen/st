<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <h1><i class="el-icon-s-unfold"></i> Müşteri Listesi ({{ customerList?.length }})</h1>
      <el-button type="primary" @click="isOpenDialog('add')" icon="el-icon-circle-plus"
        >Yeni Müşteri Oluştur</el-button
      >
    </div>

    <div class="search">
      <el-input v-model="filter.search" placeholder="Müşteri arayın" clearable />
    </div>

    <el-table :data="paginatedData" border style="width: 100%" empty-text="Müşteri bulunamadı">
      <el-table-column prop="fullName" sortable label="Ad Soyad">
        <template v-slot="scope">
          <span class="upper-text">{{ scope.row.fullName }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="phone" sortable label="Telefon Numarası"></el-table-column>
      <el-table-column prop="address" sortable label="Adres"></el-table-column>
      <el-table-column fixed="right" label="İşlem" width="235">
        <template v-slot="scope">
          <el-button
            v-if="scope.row.hasBalance"
            type="info"
            size="small"
            icon="el-icon-search"
            @click="seeBalance(scope.row)"
            >Carisini Gör</el-button
          >

          <el-tooltip
            v-else
            class="item"
            effect="dark"
            content="Carisi Bulunmuyor"
            placement="top-start"
          >
            <el-button
              type="success"
              size="small"
              icon="el-icon-circle-plus"
              @click="createBalance(scope.row)"
              >Cari Oluştur</el-button
            >
          </el-tooltip>

          <el-tooltip
            class="item"
            effect="dark"
            content="Bilgilerini Düzenle"
            placement="top-start"
          >
            <el-button
              type="primary"
              icon="el-icon-edit"
              circle
              @click="isOpenDialog('edit', scope.row)"
            ></el-button>
          </el-tooltip>

          <el-tooltip class="item" effect="dark" content="Müşteriyi Sil" placement="top-start">
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

    <!-- müşteri düzenleme/ekleme işlemi -->
    <el-dialog
      :title="editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri Oluştur'"
      :visible.sync="dialogVisible"
      width="30%"
    >
      <el-form
        label-position="top"
        :model="formData"
        label-width="100px"
        :rules="rules"
        ref="formRef"
      >
        <el-row type="flex" justify="start" align="center" :gutter="16">
          <el-col :span="12">
            <el-form-item label="Ad Soyad" prop="fullName">
              <el-input v-model="formData.fullName"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Telefon" prop="phone">
              <el-input
                v-model="formData.phone"
                placeholder="(555) 555-5555"
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
            :autosize="false"
          ></el-input>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Vazgeç</el-button>
        <el-button type="primary" @click="saveCustomer" :disabled="isSaveDisabled"
          >Kaydet</el-button
        >
      </span>
    </el-dialog>
  </el-card>
</template>

<script>
import { supabase } from '../utils/supabase'
import globalMixin from '../mixin/global.mixin.js'

export default {
  name: 'Customers',
  mixins: [globalMixin],
  data() {
    return {
      customerList: [],
      customerList: [],
      dialogVisible: false,
      currentPage: 1,
      pageSize: 9,
      editingCustomer: false,
      originalFormData: null,
      filter: {
        search: ''
      },
      rules: {
        fullName: [{ required: true, message: 'Ad Soyad zorunlu', trigger: 'blur' }],
        phone: [
          { required: true, message: 'Telefon numarası zorunlu', trigger: 'blur' },
          {
            pattern: /^\(\d{3}\) \d{3} \d{2} \d{2}$/,
            message: 'Geçersiz telefon numarası',
            trigger: 'blur'
          }
        ],
        address: [{ required: true, message: 'Adres zorunlu', trigger: 'blur' }]
      },
      formData: { id: '', fullName: '', phone: '', address: '' }
    }
  },
  async mounted() {
    await this.getAllCustomer()
  },
  computed: {
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredData?.slice(start, end)
    },
    filteredData() {
      if (!this.filter.search) return this.customerList
      return this.customerList?.filter((item) =>
        item.fullName.toLowerCase().includes(this.filter.search.toLowerCase())
      )
    },
    isSaveDisabled() {
      const { phone, fullName, address } = this.formData
      if (!phone || !fullName || !address === null) return true

      if (this.editingCustomer) {
        return JSON.stringify(this.formData) === JSON.stringify(this.originalFormData)
      }

      return false
    }
  },
  methods: {
    async getAllCustomer() {
      // Müşterileri ve onlara ait carileri çekelim
      const { data: customers, error: cErr } = await supabase
        .from('customers')
        .select('*, customer_balances(id)')
        .eq('tenant_id', this.currentTenantId)

      if (cErr) {
        console.error('Error fetching customers:', cErr)
        this.$message.error('Müşteriler yüklenirken bir hata oluştu.')
        return
      }

      this.customerList = customers.map((item) => ({
        id: item.id,
        fullName: item.full_name,
        phone: item.phone,
        address: item.address || '',
        hasBalance: item.customer_balances && item.customer_balances.length > 0,
        tenant_id: item.tenant_id
      }))
    },
    async addCustomer(payload) {
      const { error } = await supabase.from('customers').insert([
        {
          full_name: payload.fullName,
          phone: payload.phone,
          address: payload.address,
          tenant_id: this.currentTenantId
        }
      ])
      if (error) throw error
      await this.getAllCustomer()
    },
    async updateCustomer(payload) {
      const { error } = await supabase
        .from('customers')
        .update({
          full_name: payload.fullName,
          phone: payload.phone,
          address: payload.address
        })
        .eq('id', payload.id)
      if (error) throw error
      await this.getAllCustomer()
    },
    async deleteCustomer(id) {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) throw error
      await this.getAllCustomer()
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    formatPhone(value) {
      let digits = value.replace(/\D/g, '')
      digits = digits.substring(0, 10)
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
    },
    createBalance(row) {
      this.$router.push({
        name: 'Accounting',
        params: {
          customerId: row.id,
          type: 'add'
        }
      })
    },
    seeBalance(row) {
      this.$router.push({
        name: 'Accounting',
        params: {
          customerName: row.fullName
        }
      })
    },
    isOpenDialog(type, row) {
      this.editingCustomer = type === 'edit'
      if (this.editingCustomer && row) {
        this.formData = {
          id: row.id,
          fullName: row.fullName,
          phone: row.phone,
          address: row.address
        }

        this.originalFormData = JSON.parse(JSON.stringify(this.formData))
      } else {
        this.formData = { id: '', fullName: '', phone: '', address: '' }
        this.originalFormData = null
      }
      this.dialogVisible = true
    },
    saveCustomer() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return

        if (this.editingCustomer) {
          try {
            await this.updateCustomer(this.formData)
            this.$notify({
              title: 'Başarılı',
              type: 'success',
              message: 'Müşteri bilgileri güncellendi!',
              duration: 3000,
              position: 'top-right'
            })
          } catch (error) {
            this.$message.error('Müşteri güncellenirken hata oluştu.')
            console.error(error)
          }
        } else {
          try {
            await this.addCustomer(this.formData)
            this.$notify({
              title: 'Başarılı',
              type: 'success',
              message: 'Müşteri oluşturuldu!',
              duration: 3000,
              position: 'top-right'
            })
          } catch (error) {
            this.$message.error('Müşteri eklenirken hata oluştu.')
            console.error(error)
          }
        }

        this.dialogVisible = false
      })
    },
    open(row) {
      this.$confirm(
        `${row.fullName} adlı müşteriyi, silmek istediğinden emin misiniz?`,
        'Müşteri Silme İşlemi',
        {
          distinguishCancelAndClose: true,
          confirmButtonText: 'Evet, Sil',
          cancelButtonText: 'İptal Et'
        }
      )
        .then(async () => {
          try {
            await this.deleteCustomer(row.id)
            this.$notify({
              title: 'Başarılı',
              type: 'success',
              message: 'Müşteri başarıyla silindi!',
              duration: 3000,
              position: 'top-right'
            })
          } catch (error) {
            this.$message.error('Müşteri silinirken hata oluştu.')
            console.error(error)
          }
        })
        .catch((action) => {
          this.$notify({
            title: 'Bilgi',
            type: 'info',
            message: 'İşlem iptal edildi',
            duration: 3000,
            position: 'top-right'
          })
        })
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .no-resize-textarea textarea {
    resize: none !important;
    font-family: Arial, Helvetica, sans-serif;
  }
}
.upper-text {
  text-transform: uppercase;
}
</style>