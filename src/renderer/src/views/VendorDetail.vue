<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 6px">
        <el-button
          icon="el-icon-back"
          circle
          @click="$router.push({ name: 'Vendors' })"
        ></el-button>
        <h2 style="display: inline-block; margin-left: 10px">
          <i class="el-icon-user"></i> {{ vendor ? vendor.full_name : 'Yükleniyor...' }} — İşlem
          Geçmişi
        </h2>
      </div>
      <div style="display: flex; align-items: center; gap: 15px">
        <div v-if="totalDebt > 0" style="font-size: 16px; font-weight: bold">
          Toplam Borç:
          <el-tag
            type="danger"
            effect="dark"
            style="font-size: 16px; padding: 0 10px; height: 32px; line-height: 32px"
          >
            {{ totalDebt | formatNumber }} ₺
          </el-tag>
        </div>
        <div v-else-if="!loading && inputs.length > 0" style="font-size: 16px">
          <el-tag type="success" effect="dark" style="height: 32px; line-height: 32px">
            Borç Bulunmuyor
          </el-tag>
        </div>
        <el-button type="success" @click="openInputDialog()" icon="el-icon-circle-plus">
          Yeni Alım Ekle
        </el-button>
      </div>
    </div>

    <div v-if="loading" style="padding: 20px">
      <el-skeleton :rows="8" animated />
    </div>

    <el-table
      v-else
      :data="paginatedData"
      border
      style="width: 100%"
      empty-text="Henüz işlem yok"
      show-summary
      :summary-method="getSummary"
    >
      <el-table-column prop="received_at" sortable label="Tarih" width="130">
        <template v-slot="s">{{ s.row.received_at | formatDate }}</template>
      </el-table-column>
      <el-table-column prop="input_weight" sortable label="KG" width="110">
        <template v-slot="s">{{ s.row.input_weight | formatNumber }}</template>
      </el-table-column>
      <el-table-column prop="unit_price" sortable label="Birim Fiyat" width="130">
        <template v-slot="s">{{ s.row.unit_price | formatNumber }} ₺</template>
      </el-table-column>
      <el-table-column prop="total_purchase_amount" sortable label="Toplam Tutar" width="150">
        <template v-slot="s">{{ s.row.total_purchase_amount | formatNumber }} ₺</template>
      </el-table-column>
      <el-table-column prop="paid_amount" sortable label="Ödenen" width="130">
        <template v-slot="s">{{ s.row.paid_amount | formatNumber }} ₺</template>
      </el-table-column>
      <el-table-column label="Kalan Borç" sortable width="130">
        <template v-slot="s">
          <el-tag
            :type="s.row.total_purchase_amount - s.row.paid_amount > 0 ? 'danger' : 'success'"
            effect="dark"
          >
            {{ (s.row.total_purchase_amount - s.row.paid_amount) | formatNumber }} ₺
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="payment_type"
        sortable
        label="Ödeme Türü"
        width="140"
      ></el-table-column>
      <el-table-column prop="notes" label="Not">
        <template v-slot="s">{{ s.row.notes }}</template>
      </el-table-column>
      <el-table-column fixed="right" label="İşlem" width="115">
        <template v-slot="s">
          <el-tooltip content="Düzenle / Ödeme Yap" placement="top-start">
            <el-button
              type="primary"
              icon="el-icon-edit"
              circle
              @click="openInputDialog(s.row)"
            ></el-button>
          </el-tooltip>
          <el-tooltip content="Alımı Sil" placement="top-start">
            <el-button
              type="danger"
              icon="el-icon-delete"
              circle
              @click="deleteInput(s.row)"
            ></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      background
      layout="prev, pager, next"
      :total="inputs?.length"
      :page-size="pageSize"
      :current-page="currentPage"
      @current-change="handlePageChange"
      style="margin-top: 20px; text-align: center"
    />

    <!-- Dialog: Yeni Alım (Purchase) -->
    <el-dialog
      :title="inputForm.id ? 'Alımı Düzenle' : 'Yeni Alım Ekle'"
      :visible.sync="inputDialogVisible"
      width="35%"
      @close="resetInputForm"
    >
      <el-form label-position="top" :model="inputForm" ref="inputFormRef" :rules="inputRules">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Alım Tarihi" prop="receivedAt">
              <el-date-picker
                v-model="inputForm.receivedAt"
                type="date"
                format="dd.MM.yyyy"
                placeholder=""
                style="width: 100%"
              ></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Alınan KG" prop="inputWeight">
              <el-input-number
                v-model="inputForm.inputWeight"
                @change="calcTotal"
                style="width: 100%"
                :precision="2"
                :min="0"
              ></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Birim Fiyat (₺/kg)" prop="unitPrice">
              <price-input v-model="inputForm.unitPrice" @input="calcTotal" :decimals="2" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Toplam Tutar (₺)" prop="totalPurchaseAmount">
              <price-input v-model="inputForm.totalPurchaseAmount" disabled :decimals="2" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Ödeme Türü" prop="paymentType">
              <el-select v-model="inputForm.paymentType" style="width: 100%">
                <el-option v-for="t in paymentTypes" :key="t" :label="t" :value="t"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Ödenen Miktar (₺)" prop="paidAmount">
              <price-input
                v-model="inputForm.paidAmount"
                :disabled="!!inputForm.id"
                :decimals="2"
              />
              <div
                v-if="inputForm.totalPurchaseAmount - inputForm.paidAmount > 0"
                style="
                  margin-top: 5px;
                  color: #f56c6c;
                  font-weight: bold;
                  font-size: 14px;
                  text-align: right;
                "
              >
                Kalan Borç:
                {{ (inputForm.totalPurchaseAmount - inputForm.paidAmount) | formatNumber }} ₺
              </div>
              <div
                v-if="inputForm.id && inputForm.totalPurchaseAmount - inputForm.paidAmount > 0"
                style="margin-top: 15px"
              >
                <div style="font-size: 14px; margin-bottom: 5px">Ödenecek Tutar (₺)</div>
                <price-input v-model="inputForm.additionalPayment" :decimals="2" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="Not">
          <el-input type="textarea" v-model="inputForm.notes"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="inputDialogVisible = false">Vazgeç</el-button>
        <el-button type="primary" @click="saveInput">Kaydet</el-button>
      </span>
    </el-dialog>
  </el-card>
</template>

<script>
import { supabase } from '../utils/supabase'
import globalMixin from '../mixin/global.mixin.js'
import { formatDate, formatNumber, normalizeNumber } from '../utils/helpers'
import PriceInput from '../components/PriceInput.vue'

export default {
  name: 'VendorDetail',
  mixins: [globalMixin],
  components: {
    PriceInput
  },
  data() {
    return {
      loading: false,
      vendor: null,
      inputs: [],
      currentPage: 1,
      pageSize: 10,

      // Input form (Yeni Alım)
      inputDialogVisible: false,
      inputForm: {
        id: null,
        vendorId: '',
        receivedAt: '',
        inputWeight: 0,
        unitPrice: 0,
        totalPurchaseAmount: 0,
        paidAmount: 0,
        paymentType: 'Nakit',
        notes: ''
      },
      paymentTypes: ['Nakit', 'Havale/EFT', 'Kredi Kartı', 'Borç'],
      inputRules: {
        receivedAt: [{ required: true, message: 'Alım tarihi seçiniz', trigger: 'change' }],
        inputWeight: [{ required: true, message: 'KG giriniz', trigger: 'blur' }],
        totalPurchaseAmount: [{ required: true, message: 'Tutar giriniz', trigger: 'blur' }]
      },

      // Payment form (Ödeme Yap)
      paymentDialogVisible: false,
      paymentForm: {
        paymentDate: new Date(),
        paidAmount: 0,
        paymentType: 'Nakit',
        notes: ''
      },
      paymentRules: {
        paymentDate: [{ required: true, message: 'Tarih seçiniz', trigger: 'change' }],
        paidAmount: [{ required: true, message: 'Tutar giriniz', trigger: 'blur' }]
      }
    }
  },
  filters: { formatDate, formatNumber },
  computed: {
    vendorId() {
      return this.$route.params.id
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.inputs?.slice(start, start + this.pageSize)
    },
    totalDebt() {
      if (!this.inputs) return 0
      const totalPurchase = this.inputs.reduce((s, r) => s + (r.total_purchase_amount || 0), 0)
      const totalPaid = this.inputs.reduce((s, r) => s + (r.paid_amount || 0), 0)
      return totalPurchase - totalPaid
    }
  },
  async mounted() {
    if (this.vendorId) {
      await this.fetchVendorDetails()
    }
  },
  methods: {
    async fetchVendorDetails() {
      this.loading = true

      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', this.vendorId)
        .single()

      if (vendorError) {
        this.$message.error('Tedarikçi bilgileri alınamadı.')
        this.loading = false
        return
      }
      this.vendor = vendorData

      const { data: inputsData, error: inputsError } = await supabase
        .from('production_inputs')
        .select('*')
        .eq('vendor_id', this.vendorId)
        .order('received_at', { ascending: false })

      if (inputsError) {
        this.$message.error('İşlem geçmişi alınamadı.')
      } else {
        this.inputs = inputsData || []
      }

      this.loading = false
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    openInputDialog(input = null) {
      if (input) {
        this.inputForm = {
          id: input.id,
          vendorId: this.vendorId,
          receivedAt: input.received_at,
          inputWeight: input.input_weight,
          unitPrice: input.unit_price,
          totalPurchaseAmount: input.total_purchase_amount,
          paidAmount: input.paid_amount,
          additionalPayment: 0,
          paymentType: input.payment_type,
          notes: input.notes
        }
      } else {
        this.resetInputForm()
      }
      this.inputDialogVisible = true
    },
    resetInputForm() {
      this.inputForm = {
        id: null,
        vendorId: this.vendorId,
        receivedAt: '',
        inputWeight: 0,
        unitPrice: 0,
        totalPurchaseAmount: 0,
        paidAmount: 0,
        additionalPayment: 0,
        paymentType: 'Nakit',
        notes: ''
      }
    },
    calcTotal() {
      this.inputForm.totalPurchaseAmount = this.inputForm.inputWeight * this.inputForm.unitPrice
      this.inputForm.paidAmount = this.inputForm.totalPurchaseAmount
    },
    async saveInput() {
      this.$refs.inputFormRef.validate(async (valid) => {
        if (!valid) return
        try {
          const payload = {
            vendor_id: this.vendorId,
            received_at: this.inputForm.receivedAt,
            input_weight: this.inputForm.inputWeight,
            unit_price: normalizeNumber(this.inputForm.unitPrice),
            total_purchase_amount: normalizeNumber(this.inputForm.totalPurchaseAmount),
            paid_amount:
              normalizeNumber(this.inputForm.paidAmount) +
              normalizeNumber(this.inputForm.additionalPayment || 0),
            payment_type: this.inputForm.paymentType
          }
          // Remove batch_id logic here
          payload.batch_id = null
          if (this.inputForm.notes) payload.notes = this.inputForm.notes

          if (this.inputForm.id) {
            const { error } = await supabase
              .from('production_inputs')
              .update(payload)
              .eq('id', this.inputForm.id)
            if (error) throw error
            this.$notify({
              title: 'Başarılı',
              type: 'success',
              message: 'Alım güncellendi!',
              duration: 3000,
              position: 'top-right'
            })
          } else {
            const { error } = await supabase.from('production_inputs').insert([payload])
            if (error) throw error
            this.$notify({
              title: 'Başarılı',
              type: 'success',
              message: 'Yeni alım eklendi!',
              duration: 3000,
              position: 'top-right'
            })
          }
          this.inputDialogVisible = false
          await this.fetchVendorDetails()
        } catch (err) {
          console.error(err)
          this.$message.error('Alım kaydedilirken hata oluştu.')
        }
      })
    },
    openPaymentDialog() {
      this.resetPaymentForm()
      this.paymentDialogVisible = true
    },
    resetPaymentForm() {
      this.paymentForm = {
        paymentDate: new Date(),
        paidAmount: 0,
        paymentType: 'Nakit',
        notes: ''
      }
    },
    async savePayment() {
      this.$refs.paymentFormRef.validate(async (valid) => {
        if (!valid) return
        try {
          const payload = {
            vendor_id: this.vendorId,
            received_at: this.paymentForm.paymentDate,
            input_weight: 0,
            unit_price: 0,
            total_purchase_amount: 0,
            paid_amount: normalizeNumber(this.paymentForm.paidAmount),
            payment_type: this.paymentForm.paymentType,
            notes: this.paymentForm.notes || 'Ödeme',
            batch_id: null
          }

          const { error } = await supabase.from('production_inputs').insert([payload])
          if (error) throw error

          this.$notify({
            title: 'Başarılı',
            type: 'success',
            message: 'Ödeme kaydedildi!',
            duration: 3000,
            position: 'top-right'
          })
          this.paymentDialogVisible = false
          await this.fetchVendorDetails()
        } catch (err) {
          console.error(err)
          this.$message.error('Ödeme kaydedilirken hata oluştu.')
        }
      })
    },
    async deleteInput(input) {
      try {
        await this.$confirm(
          `${this.vendor.full_name} tedarikçisinden alınan ${input.input_weight} KG alımı silmek istiyor musunuz?`,
          'Alım Silme',
          {
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
            type: 'warning'
          }
        )
        const { error } = await supabase.from('production_inputs').delete().eq('id', input.id)
        if (error) throw error
        this.$notify({
          title: 'Başarılı',
          type: 'success',
          message: 'Alım silindi!',
          duration: 3000,
          position: 'top-right'
        })
        await this.fetchVendorDetails()
      } catch (e) {
        if (e !== 'cancel') {
          console.error(e)
          this.$message.error('Silme sırasında hata oluştu.')
        }
      }
    },
    getSummary({ columns }) {
      const data = this.inputs || []

      const totalInputKG = data.reduce((s, r) => s + (r.input_weight || 0), 0)
      const totalPurchase = data.reduce((s, r) => s + (r.total_purchase_amount || 0), 0)
      const totalPaid = data.reduce((s, r) => s + (r.paid_amount || 0), 0)
      const totalDebt = totalPurchase - totalPaid

      return columns.map((col, index) => {
        if (index === 0) return 'Toplam'
        if (col.property === 'input_weight')
          return `${this.$options.filters.formatNumber(totalInputKG)} KG`
        if (col.property === 'total_purchase_amount')
          return `${this.$options.filters.formatNumber(totalPurchase)} ₺`
        if (col.property === 'paid_amount')
          return `${this.$options.filters.formatNumber(totalPaid)} ₺`
        if (col.label === 'Kalan Borç') return `${this.$options.filters.formatNumber(totalDebt)} ₺`
        return ''
      })
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
