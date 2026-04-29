<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <h1><i class="el-icon-s-unfold"></i> Müşteri Listesi ({{ customerList?.length }})</h1>
      <el-button type="primary" @click="isOpenDialog('add')" icon="el-icon-circle-plus"
        >Yeni Müşteri Oluştur</el-button
      >
    </div>

    <div class="search" style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px">
      <el-input
        v-model="filter.search"
        placeholder="Müşteri adıyla arayın..."
        clearable
        style="width: 300px; flex-shrink: 0"
      />
      <el-select
        v-model="filter.seasonId"
        placeholder="Sezona Göre Filtrele"
        clearable
        style="width: 250px; flex-shrink: 0"
        @change="currentPage = 1"
      >
        <el-option label="Tüm Sezonlar" value=""></el-option>
        <el-option
          v-for="item in getSeasonList"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        ></el-option>
      </el-select>

      <div class="filter-info" style="margin-left: auto; flex-shrink: 0">
        <el-tag
          v-if="filter.seasonId"
          type="primary"
          effect="plain"
          style="font-size: 14px; font-weight: bold; height: 40px; line-height: 40px"
        >
          <i class="el-icon-user"></i> Bu Sezonda Kaydolan Müşteri Sayısı: {{ filteredData.length }}
        </el-tag>
      </div>
    </div>

    <div v-if="loading" style="padding: 20px">
      <el-skeleton :rows="10" animated />
    </div>
    <el-table
      v-else
      :data="paginatedData"
      border
      style="width: 100%"
      empty-text="Müşteri bulunamadı"
    >
      <el-table-column label="Kayıt Tarihi" width="130" sortable prop="createdAt">
        <template v-slot="scope">
          {{ scope.row.createdAt | formatDate }}
        </template>
      </el-table-column>
      <el-table-column prop="fullName" sortable label="Ad Soyad">
        <template v-slot="scope">
          <span class="upper-text">{{ scope.row.fullName }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="phone" sortable label="Telefon Numarası"></el-table-column>
      <el-table-column prop="address" sortable label="Adres" width="90">
        <template v-slot="scope">
          <div style="display: flex; align-items: center; gap: 8px">
            <el-tooltip
              effect="dark"
              :content="scope.row.address || 'Adres bilgisi yok'"
              placement="top"
            >
              <span><i class="el-icon-info"></i></span>
            </el-tooltip>
            <el-button
              title="Kopyala"
              v-if="scope.row.address"
              type="text"
              icon="el-icon-document-copy"
              @click="copyAddress(scope.row.address)"
              style="padding: 0; font-size: 16px"
            ></el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Toplam Hak" width="120">
        <template v-slot="scope">
          <span v-if="scope.row.hasBalance">{{ scope.row.balanceInfo.totalKg }} KG</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="Kalan (KG)" width="120">
        <template v-slot="scope">
          <b v-if="scope.row.hasBalance">{{ scope.row.balanceInfo.remainingKg }} KG</b>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="Cari Durumu" width="120">
        <template v-slot="scope">
          <el-tag :type="scope.row.balanceInfo.isClosed ? 'danger' : 'success'" size="small">
            {{ scope.row.balanceInfo.isClosed ? 'Pasif' : 'Aktif' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="İşlem" width="325">
        <template v-slot="scope">
          <el-button type="info" size="small" icon="el-icon-search" @click="handleClick(scope.row)"
            >Detay</el-button
          >

          <el-button
            v-if="scope.row.hasBalance"
            type="success"
            size="small"
            style="width: 112px"
            icon="el-icon-circle-plus"
            @click="useBalance(scope.row)"
            :disabled="scope.row.balanceInfo.remainingKg == 0"
            >Yeni İşlem</el-button
          >

          <el-tooltip
            v-if="!scope.row.hasBalance"
            class="item"
            effect="dark"
            content="Carisi Bulunmuyor"
            placement="top-start"
          >
            <el-button
              type="warning"
              size="small"
              icon="el-icon-circle-plus"
              @click="createBalance(scope.row)"
              >Cari Oluştur</el-button
            >
          </el-tooltip>

          <el-button
            type="primary"
            icon="el-icon-edit"
            circle
            @click="isOpenDialog('edit', scope.row)"
          ></el-button>

          <el-button
            type="danger"
            icon="el-icon-delete"
            circle
            @click="open(scope.row)"
          ></el-button>
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

    <el-dialog
      :title="editingCustomer ? 'Müşteri Bilgileri & Cari Yönetimi' : 'Yeni Müşteri Oluştur'"
      :visible.sync="dialogVisible"
      width="55%"
      top="5vh"
    >
      <el-form
        label-position="top"
        :model="formData"
        label-width="100px"
        :rules="rules"
        ref="formRef"
      >
        <el-divider content-position="left">Temel Bilgiler</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Ad Soyad" prop="fullName">
              <el-input v-model="formData.fullName"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Telefon" prop="phone">
              <el-input
                v-model="formData.phone"
                placeholder="(555) 555-5555"
                @input="formatPhone"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Adres" prop="address">
              <el-input v-model="formData.address"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">Cari Durumu</el-divider>
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="Sezon">
              <el-select v-model="formData.seasonId" placeholder="Sezon Seçin" style="width: 100%">
                <el-option
                  v-for="item in getSeasonList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="Toplam Kota">
              <el-input-number
                v-model="formData.totalKgQuota"
                :min="formData.totalDelivered || 0"
                controls-position="right"
                style="width: 100%"
                :disabled="!editingCustomer"
                @change="updateRemainingQuota"
              ></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="Kalan Kota">
              <el-tag
                :type="formData.remainingKgQuota > 0 ? 'success' : 'danger'"
                style="
                  width: 100%;
                  text-align: center;
                  height: 40px;
                  line-height: 40px;
                  font-size: 14px;
                "
              >
                {{ formatCount(formData.remainingKgQuota) }} KG
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="Toplam Ödenen">
              <price-input
                v-model="formData.totalPaidAmount"
                :disabled="!editingCustomer"
              />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="Cari Aktif Mi?">
              <el-switch
                v-model="formData.isClosed"
                :active-value="false"
                :inactive-value="true"
                active-text="Aktif"
                inactive-text="Pasif"
              ></el-switch>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">Yeni Kota Alımı / Ödeme</el-divider>
        <el-row :gutter="16" :class="['transaction-form', { disabled: formData.isClosed }]">
          <el-col :span="6">
            <el-form-item label="İşlem Tarihi">
              <el-date-picker
                v-model="formData.newTransaction.transactionDate"
                type="date"
                placeholder="Tarih Seçin"
                style="width: 100%"
                :disabled="formData.isClosed"
              ></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="Eklenecek KG">
              <el-input-number
                v-model="formData.newTransaction.amountKg"
                :min="0"
                :precision="2"
                style="width: 100%"
                :disabled="formData.isClosed"
              ></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="Ödenen Tutar">
              <price-input
                v-model="formData.newTransaction.paidAmount"
                :disabled="formData.isClosed"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="Ödeme Tipi">
              <el-select
                v-model="formData.newTransaction.paymentType"
                style="width: 100%"
                :disabled="formData.isClosed"
              >
                <el-option label="Nakit" value="0"></el-option>
                <el-option label="Havale / EFT" value="1"></el-option>
                <el-option label="Kredi Kartı" value="2"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider v-if="transactionHistory.length > 0" content-position="left"
          >İşlem Geçmişi</el-divider
        >
        <el-table
          v-if="transactionHistory.length > 0"
          :data="paginatedTransactions"
          size="mini"
          border
          style="width: 100%; margin-top: 10px"
          show-summary
          :summary-method="getTransactionSummaries"
        >
          <el-table-column label="Tarih" width="200">
            <template v-slot="scope">
              {{ scope.row.created_at | formatDate }}
            </template>
          </el-table-column>
          <el-table-column prop="amount_kg" label="Alınan (KG)" width="150"></el-table-column>
          <el-table-column prop="paid_amount" label="Tutar (₺)" width="150"></el-table-column>
          <el-table-column label="Birim Fiyat" width="150">
            <template v-slot="scope">
              <span v-if="scope.row.amount_kg > 0">
                {{ (scope.row.paid_amount / scope.row.amount_kg) | formatNumber }} ₺
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="Ödeme Tipi">
            <template v-slot="scope">
              <el-tag size="mini" type="info">
                {{
                  scope.row.payment_type === '0'
                    ? 'Nakit'
                    : scope.row.payment_type === '1'
                    ? 'Havale'
                    : 'Kredi Kartı'
                }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-if="transactionHistory.length > 5"
          small
          layout="prev, pager, next"
          :total="transactionHistory.length"
          :page-size="5"
          :current-page.sync="transactionPage"
          style="margin-top: 10px; text-align: right"
        />
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
import { formatNumber, formatCount } from '../utils/helpers'
import PriceInput from '../components/PriceInput.vue'

export default {
  name: 'Customers',
  mixins: [globalMixin],
  components: { PriceInput },
  data() {
    return {
      loading: false,
      customerList: [],
      dialogVisible: false,
      currentPage: 1,
      pageSize: 9,
      editingCustomer: false,
      originalFormData: null,
      filter: {
        search: '',
        seasonId: ''
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
      formData: {
        id: '',
        fullName: '',
        phone: '',
        address: '',
        // Accounting fields
        hasBalance: false,
        balanceId: null,
        seasonId: '',
        totalKgQuota: 0,
        remainingKgQuota: 0,
        totalDelivered: 0,
        totalPaidAmount: 0,
        paymentType: '0',
        isClosed: false,
        // New transaction fields
        newTransaction: {
          amountKg: 0,
          paidAmount: 0,
          paymentType: '0',
          transactionDate: new Date(),
          hasTransaction: true
        }
      },
      transactionHistory: [],
      loadingHistory: false,
      transactionPage: 1
    }
  },
  async mounted() {
    await this.getAllCustomer()

    if (this.$route.params?.customerId) {
      const customer = this.customerList.find((c) => c.id === this.$route.params.customerId)
      if (customer) {
        this.isOpenDialog('edit', customer)
      }
    }
  },
  computed: {
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredData?.slice(start, end)
    },
    filteredData() {
      let filtered = [...this.customerList]

      // 1. Arama Filtresi
      if (this.filter.search) {
        filtered = filtered.filter((item) =>
          item.fullName.toLowerCase().includes(this.filter.search.toLowerCase())
        )
      }

      // 2. Sezon Filtresi
      if (this.filter.seasonId) {
        filtered = filtered.filter((item) =>
          item.balances?.some((b) => b.season_id === this.filter.seasonId)
        )
      }

      // 3. Alfabetik Sıralama
      return filtered.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'tr'))
    },
    isSaveDisabled() {
      const { phone, fullName, address } = this.formData
      if (!phone || !fullName || !address === null) return true

      if (this.editingCustomer) {
        return JSON.stringify(this.formData) === JSON.stringify(this.originalFormData)
      }

      return false
    },
    paginatedTransactions() {
      const start = (this.transactionPage - 1) * 5
      const end = start + 5
      return this.transactionHistory.slice(start, end)
    }
  },
  methods: {
    getTransactionSummaries(param) {
      const { columns, data } = param
      const sums = []
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = 'Toplam'
          return
        }
        if (column.property === 'amount_kg' || column.property === 'paid_amount') {
          const values = this.transactionHistory.map((item) => Number(item[column.property]))
          if (!values.every((value) => isNaN(value))) {
            const total = values.reduce((prev, curr) => {
              const value = Number(curr)
              if (!isNaN(value)) {
                return prev + curr
              } else {
                return prev
              }
            }, 0)
            if (column.property === 'amount_kg') sums[index] = formatCount(total) + ' KG'
            if (column.property === 'paid_amount') sums[index] = formatNumber(total) + ' ₺'
          }
        } else {
          sums[index] = ''
        }
      })
      return sums
    },
    formatNumber(val) {
      return formatNumber(val)
    },
    formatCount(val) {
      return formatCount(val)
    },
    async getAllCustomer() {
      this.loading = true
      // Müşterileri ve onlara ait carileri çekelim
      const { data: customers, error: cErr } = await supabase
        .from('customers')
        .select(
          `
          *,
          customer_balances (
            id,
            total_kg_quota,
            remaining_kg_quota,
            total_paid_amount,
            is_closed,
            season_id,
            season:seasons(name)
          )
        `
        )
        .eq('tenant_id', this.currentTenantId)

      if (cErr) {
        console.error('Error fetching customers:', cErr)
        this.$message.error('Müşteriler yüklenirken bir hata oluştu.')
        this.loading = false
        return
      }

      this.customerList = customers.map((item) => {
        const balances = item.customer_balances || []
        const currentBalance = balances[0] // Varsayılan olarak ilkini alalım (UI detayları için)
        return {
          id: item.id,
          fullName: item.full_name,
          phone: item.phone,
          address: item.address || '',
          hasBalance: balances.length > 0,
          balances: balances,
          balanceInfo: currentBalance
            ? {
                id: currentBalance.id,
                totalKg: currentBalance.total_kg_quota,
                remainingKg: currentBalance.remaining_kg_quota,
                totalPaid: currentBalance.total_paid_amount,
                isClosed: currentBalance.is_closed,
                seasonId: currentBalance.season_id,
                seasonName: currentBalance.season?.name
              }
            : null,
          tenant_id: item.tenant_id,
          createdAt: item.created_at,
          isClosed: item.is_closed
        }
      })
      this.loading = false
    },
    async getAllCustomerBalance() {
      this.loading = true
      try {
        await this.getAllCustomer()
      } finally {
        this.loading = false
      }
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
      this.isOpenDialog('edit', row)
    },
    seeBalance(row) {
      this.isOpenDialog('edit', row)
    },
    copyAddress(address) {
      if (!address) return
      navigator.clipboard
        .writeText(address)
        .then(() => {
          this.$message.success('Adres kopyalandı')
        })
        .catch(() => {
          this.$message.error('Adres kopyalanamadı')
        })
    },
    handleClick(row) {
      if (!row.hasBalance) return
      const user = {
        id: row.balanceInfo.id,
        customerId: row.id,
        name: row.fullName,
        season: row.balanceInfo.seasonName,
        totalKg: row.balanceInfo.totalKg,
        remainingKg: row.balanceInfo.remainingKg
      }
      this.$router.push({ name: 'AccountingProcess', params: { user } })
    },
    useBalance(row) {
      if (!row.hasBalance) return
      const user = {
        id: row.balanceInfo.id,
        customerId: row.id,
        name: row.fullName,
        season: row.balanceInfo.seasonName,
        totalKg: row.balanceInfo.totalKg,
        remainingKg: row.balanceInfo.remainingKg
      }
      this.$router.push({ name: 'AccountingProcess', params: { type: 'add', user } })
    },
    async fetchTransactionHistory(customerId) {
      this.loadingHistory = true
      try {
        const { data, error } = await supabase
          .from('customer_transactions')
          .select(
            `
            *,
            season:seasons(name)
          `
          )
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })

        if (error) throw error
        this.transactionHistory = data
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        this.loadingHistory = false
      }
    },
    async isOpenDialog(type, row) {
      this.editingCustomer = type === 'edit'

      const currentYear = new Date().getFullYear().toString()
      const foundSeason = this.getSeasonList?.find((s) => s.label.includes(currentYear))
      const defaultSeasonId = foundSeason ? foundSeason.value : ''

      if (this.editingCustomer && row) {
        this.formData = {
          id: row.id,
          fullName: row.fullName,
          phone: row.phone,
          address: row.address,
          hasBalance: row.hasBalance,
          balanceId: row.balanceInfo?.id || null,
          seasonId: row.balanceInfo?.seasonId || defaultSeasonId,
          totalKgQuota: row.balanceInfo?.totalKg || 0,
          remainingKgQuota: row.balanceInfo?.remainingKg || 0,
          totalDelivered: (row.balanceInfo?.totalKg || 0) - (row.balanceInfo?.remainingKg || 0),
          totalPaidAmount: row.balanceInfo?.totalPaid || 0,
          paymentType: '0',
          isClosed: row.balanceInfo?.isClosed || false,
          newTransaction: {
            amountKg: 0,
            paidAmount: 0,
            paymentType: '0',
            transactionDate: new Date(),
            hasTransaction: true
          }
        }
        if (row.hasBalance) {
          await this.fetchTransactionHistory(row.id)
        } else {
          this.transactionHistory = []
        }
        this.transactionPage = 1
        this.originalFormData = JSON.parse(JSON.stringify(this.formData))
      } else {
        this.formData = {
          id: '',
          fullName: '',
          phone: '',
          address: '',
          hasBalance: false,
          balanceId: null,
          seasonId: defaultSeasonId,
          totalKgQuota: 0,
          remainingKgQuota: 0,
          totalPaidAmount: 0,
          paymentType: '0',
          isClosed: false,
          newTransaction: {
            amountKg: 0,
            paidAmount: 0,
            paymentType: '0',
            transactionDate: new Date(),
            hasTransaction: true
          }
        }
        this.transactionHistory = []
        this.transactionPage = 1
        this.originalFormData = null
      }
      this.dialogVisible = true
    },
    updateRemainingQuota() {
      this.formData.remainingKgQuota =
        this.formData.totalKgQuota - (this.formData.totalDelivered || 0)
    },
    saveCustomer() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return

        try {
          let customerId = this.formData.id

          const { data: existingCust, error: checkError } = await supabase
            .from('customers')
            .select('id')
            .eq('full_name', this.formData.fullName)
            .eq('tenant_id', this.currentTenantId)
            .maybeSingle()

          if (checkError) throw checkError

          if (existingCust && existingCust.id !== this.formData.id) {
            this.$message.error('Bu isimde bir müşteri zaten kayıtlı!')
            return
          }

          if (this.editingCustomer) {
            const { error } = await supabase
              .from('customers')
              .update({
                full_name: this.formData.fullName,
                phone: this.formData.phone,
                address: this.formData.address
              })
              .eq('id', customerId)
            if (error) throw error
          } else {
            const { data, error } = await supabase
              .from('customers')
              .insert([
                {
                  full_name: this.formData.fullName,
                  phone: this.formData.phone,
                  address: this.formData.address,
                  tenant_id: this.currentTenantId
                }
              ])
              .select()
            if (error) throw error
            customerId = data[0].id
          }

          // 2. Yeni İşlem veya Kota Değişikliği Varsa Kaydet
          const nt = this.formData.newTransaction
          const quotaChanged =
            this.editingCustomer &&
            this.formData.totalKgQuota !== this.originalFormData?.totalKgQuota
          const paidChanged =
            this.editingCustomer &&
            this.formData.totalPaidAmount !== this.originalFormData?.totalPaidAmount

          if (nt.amountKg > 0 || nt.paidAmount > 0 || quotaChanged || paidChanged) {
            if (!this.formData.seasonId) {
              this.$message.warning('Yeni işlem için lütfen bir sezon seçin.')
              return
            }

            // Transaction kaydı
            const { error: tErr } = await supabase.from('customer_transactions').insert([
              {
                customer_id: customerId,
                season_id: this.formData.seasonId,
                tenant_id: this.currentTenantId,
                amount_kg: nt.amountKg,
                paid_amount: nt.paidAmount,
                payment_type: nt.paymentType,
                transaction_type: 'quota_purchase'
              }
            ])
            if (tErr) throw tErr

            // Bakiye güncelleme/oluşturma (Upsert)
            // Önce mevcut bakiyeyi çekelim (varsa)
            const { data: existingBalance } = await supabase
              .from('customer_balances')
              .select('*')
              .eq('customer_id', customerId)
              .eq('season_id', this.formData.seasonId)
              .maybeSingle()

            const newTotalQuota = this.formData.totalKgQuota + nt.amountKg
            const newTotalPaid = this.formData.totalPaidAmount + nt.paidAmount

            // Gerçek teslimatları çekip kalanı hesaplayalım (Sync)
            const { data: deliveries } = await supabase
              .from('customer_deliveries')
              .select('total_weight_delivered')
              .eq('customer_id', customerId)
              .eq('season_id', this.formData.seasonId)

            const totalDelivered =
              deliveries?.reduce((s, d) => s + (d.total_weight_delivered || 0), 0) || 0
            const newRemaining = newTotalQuota - totalDelivered

            const balancePayload = {
              customer_id: customerId,
              season_id: this.formData.seasonId,
              tenant_id: this.currentTenantId,
              total_kg_quota: newTotalQuota,
              remaining_kg_quota: newRemaining,
              total_paid_amount: newTotalPaid,
              payment_type: nt.paymentType,
              is_closed: this.formData.isClosed
            }

            if (existingBalance) {
              const { error: bErr } = await supabase
                .from('customer_balances')
                .update(balancePayload)
                .eq('id', existingBalance.id)
              if (bErr) throw bErr
            } else {
              const { error: bErr } = await supabase
                .from('customer_balances')
                .insert([balancePayload])
              if (bErr) throw bErr
            }
          } else if (this.editingCustomer && this.formData.hasBalance) {
            // Sadece bakiye durumunu (is_closed) güncellemek gerekebilir
            const { error: bErr } = await supabase
              .from('customer_balances')
              .update({ is_closed: this.formData.isClosed })
              .eq('id', this.formData.balanceId)
            if (bErr) throw bErr
          }

          this.$notify({
            title: 'Başarılı',
            type: 'success',
            message: this.editingCustomer
              ? 'Müşteri bilgileri güncellendi!'
              : 'Müşteri oluşturuldu!',
            duration: 3000,
            position: 'top-right'
          })

          await this.getAllCustomer()
          this.dialogVisible = false
        } catch (error) {
          console.error(error)
          this.$message.error('İşlem sırasında bir hata oluştu.')
        }
      })
    },
    open(row) {
      this.$confirm(
        `${row.fullName} adlı müşteriyi, silmek istediğinden emin misiniz? İlişkili tüm verileri silinecektir.`,
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
.transaction-form {
  background: #f9f9f9;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.3s ease;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
    background: #f0f2f5;
  }
}
</style>