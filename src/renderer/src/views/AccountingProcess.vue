<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <div style="display: flex; align-items: center; gap: 6px">
        <el-button
          icon="el-icon-back"
          circle
          @click="$router.push({ name: 'Customers' })"
        ></el-button>
        <h1 style="display: inline-block; margin: 0 0 0 10px">
          <i class="el-icon-edit-outline"></i> {{ (routeUser?.name || 'Cari').toUpperCase() }} - Cari Ekstreleri
        </h1>
      </div>
      <div class="header-actions">
        <el-button
          v-if="!routeUser?.isRetail"
          type="info"
          plain
          icon="el-icon-refresh"
          @click="syncRemainingQuota"
          >Bakiyeyi Düzelt</el-button
        >
        <el-button 
          type="success" 
          icon="el-icon-notebook-2" 
          @click="newBuyProcess"
          :disabled="!routeUser?.isRetail && overallRemainingKg <= 0"
          >Yeni Alım İşlemi Oluştur</el-button
        >
      </div>
    </div>
    
    <br />

    <!-- filter -->
    <el-form label-position="top">
      <el-row type="flex" justify="start" align="center" :gutter="16">
        <el-col :span="5">
          <el-form-item label="Sezon" class="custom-width">
            <el-select
              v-model="filter.season"
              filterable
              clearable
              placeholder="Sezon seçin"
              @change="currentPage = 1"
            >
              <el-option
                v-for="item in getSeasonList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="İşlem Tarihi Aralığı" class="custom-width">
            <el-date-picker
              v-model="filter.dateRange"
              type="daterange"
              format="dd.MM.yyyy"
              range-separator="-"
              start-placeholder="Başlangıç"
              end-placeholder="Bitiş"
              @change="currentPage = 1"
            >
            </el-date-picker>
          </el-form-item>
        </el-col>
        <el-col
          :span="6"
          style="display: flex; align-items: flex-end; padding-bottom: 30px; width: 100%"
        >
          <div
            v-if="!routeUser?.isRetail"
            style="
              font-weight: bold;
              font-size: 16px;
              color: #409eff;
              border-left: 2px solid #ebeef5;
              padding-left: 20px;
              margin-left: auto;
            "
          >
            <i class="el-icon-info"></i> Kalan: {{ overallRemainingKg | formatNumber }} KG
          </div>
          <div
            v-else
            style="
              font-weight: bold;
              font-size: 16px;
              color: #67c23a;
              border-left: 2px solid #ebeef5;
              padding-left: 20px;
              margin-left: auto;
            "
          >
            <i class="el-icon-money"></i> Perakende | Toplam Satış:
            {{ retailTotalRevenue | formatNumber }} ₺
          </div>
        </el-col>
      </el-row>
    </el-form>

    <div v-if="loading" style="padding: 20px">
      <el-skeleton :rows="12" animated />
    </div>
    <el-table
      v-else
      :data="paginatedData"
      border
      show-summary
      :summary-method="getSummaries"
      style="width: 100%"
      empty-text="Cari işlemi bulunamadı"
    >
      <el-table-column type="expand">
        <template v-slot="scope">
          <div class="sub-detail">
            <fieldset
              v-if="scope.row.detailList?.some((d) => !d.isGrassy)"
              class="sub-detail__fieldset"
            >
              <legend>Sade</legend>
              <div
                v-for="(group, idx) in getGroupedDetails(scope.row.detailList).plain"
                :key="idx"
                class="sub-detail__content"
              >
                <p v-for="item in group" :key="item.productTypeId">
                  <i class="el-icon-info"></i>
                  <b>{{ item.productTypeName }}:</b> {{ item.quantity | formatCount }} adet
                  <b>x</b> {{ item.unitWeight }}kg
                </p>
              </div>
            </fieldset>

            <fieldset
              v-if="scope.row.detailList?.some((d) => d.isGrassy)"
              class="sub-detail__fieldset"
            >
              <legend>Otlu</legend>
              <div
                v-for="(group, idx) in getGroupedDetails(scope.row.detailList).herb"
                :key="idx"
                class="sub-detail__content"
              >
                <p v-for="item in group" :key="item.productTypeId">
                  <i class="el-icon-info"></i>
                  <b>{{ item.productTypeName }}:</b> {{ item.quantity | formatCount }} adet
                  <b>x</b> {{ item.unitWeight }}kg
                </p>
              </div>
            </fieldset>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="season" sortable label="Sezon" width="170px"></el-table-column>
      <el-table-column prop="createdAt" sortable label="İşlem Tarihi" width="170px">
        <template v-slot="scope">
          <div>{{ scope.row.createdAt | formatDate }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="receivedKg" sortable label="Teslim Edilen(kg)"></el-table-column>
      <el-table-column prop="remainingKg" sortable label="İşlem Sonrası Kalan(kg)" width="240px">
        <template v-slot="scope">
          <template v-if="scope.row.remainingKg > 0">
            <p style="font-weight: bold">{{ scope.row.remainingKg }} kg</p>
          </template>
          <el-tag v-else-if="scope.row.remainingKg == 0" type="success">
            Tamamı Teslim Edildi
          </el-tag>
          <el-tag v-else type="danger"> Kota Aşımı: {{ scope.row.remainingKg }} kg </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="İşlem" width="63">
        <template v-slot="scope">
          <!-- <el-button type="success" size="small" icon="el-icon-notebook-2" @click="handleClick">Cari Detayı</el-button> -->
          <el-button
            type="primary"
            icon="el-icon-edit"
            circle
            @click="isOpenDialog('edit', scope.row)"
            :disabled="scope.row.remaining == 0"
          ></el-button>
          <!-- <el-button type="danger" icon="el-icon-delete" circle @click="open"></el-button> -->
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
    <el-dialog :title="getPopupTitle" :visible.sync="dialogVisible" width="40%" @close="closePopup">
      <el-form label-position="top" :model="formData" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Ad Soyad">
              <el-input v-model="formData.fullName" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Sezon">
              <el-input v-model="formData.seasonName" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" v-if="!formData.isRetail">
          <el-col :span="12">
            <el-form-item label="Bakiye(KG)" class="totalkg">
              <el-input-number
                v-model="formData.totalKg"
                size="medium"
                :min="0"
                :step="1"
                disabled
              ></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Kalan(KG)">
              <el-input :value="calcRemainingKG" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="tab-wrapper">
          <el-tabs type="card" class="tab-custom">
            <el-tab-pane :label="`Tulum (${calcTotalPlainTulumKG}kg)`">
              <div style="overflow-x: auto; padding-bottom: 10px">
                <el-row :gutter="16" type="flex" style="flex-wrap: nowrap; min-width: 800px">
                  <el-col :span="4" style="min-width: 120px">
                    <el-form-item label="1KG">
                      <el-input-number
                        v-model="formData.productTypePayload.plainTulum.kg1"
                        size="small"
                        :min="0"
                        :step="1"
                        :disabled="isShowDetail"
                      ></el-input-number>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4" style="min-width: 120px">
                    <el-form-item label="2KG">
                      <el-input-number
                        v-model="formData.productTypePayload.plainTulum.kg2"
                        size="small"
                        :min="0"
                        :step="1"
                        :disabled="isShowDetail"
                      ></el-input-number>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4" style="min-width: 120px">
                    <el-form-item label="3KG">
                      <el-input-number
                        v-model="formData.productTypePayload.plainTulum.kg3"
                        size="small"
                        :min="0"
                        :step="1"
                        :disabled="isShowDetail"
                      ></el-input-number>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4" style="min-width: 120px">
                    <el-form-item label="5KG">
                      <el-input-number
                        v-model="formData.productTypePayload.plainTulum.kg5"
                        size="small"
                        :min="0"
                        :step="1"
                        :disabled="isShowDetail"
                      ></el-input-number>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4" style="min-width: 120px">
                    <el-form-item label="10KG">
                      <el-input-number
                        v-model="formData.productTypePayload.plainTulum.kg10"
                        size="small"
                        :min="0"
                        :step="1"
                        :disabled="isShowDetail"
                      ></el-input-number>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4" style="min-width: 120px">
                    <el-form-item label="25KG">
                      <el-input-number
                        v-model="formData.productTypePayload.plainTulum.kg25"
                        size="small"
                        :min="0"
                        :step="1"
                        :disabled="isShowDetail"
                      ></el-input-number>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
            <el-tab-pane :label="`Otlu Tulum (${calcTotalHerbyTulum}kg)`">
              <el-row :gutter="16">
                <el-col :span="5">
                  <el-form-item label="1KG">
                    <el-input-number
                      v-model="formData.productTypePayload.herbTulum.kg1"
                      size="small"
                      :min="0"
                      :step="1"
                      :disabled="isShowDetail"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="5">
                  <el-form-item label="2KG">
                    <el-input-number
                      v-model="formData.productTypePayload.herbTulum.kg2"
                      size="small"
                      :min="0"
                      :step="1"
                      :disabled="isShowDetail"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="5">
                  <el-form-item label="3KG">
                    <el-input-number
                      v-model="formData.productTypePayload.herbTulum.kg3"
                      size="small"
                      :min="0"
                      :step="1"
                      :disabled="isShowDetail"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="5">
                  <el-form-item label="5KG">
                    <el-input-number
                      v-model="formData.productTypePayload.herbTulum.kg5"
                      size="small"
                      :min="0"
                      :step="1"
                      :disabled="isShowDetail"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>
            <el-tab-pane :label="`Salamura (${calcTotalPlainBrineKG}kg)`">
              <el-row :gutter="16">
                <el-col :span="5">
                  <el-form-item label="2KG">
                    <el-input-number
                      v-model="formData.productTypePayload.plainBrine.kg2"
                      size="small"
                      :min="0"
                      :step="1"
                      :disabled="isShowDetail"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="5">
                  <el-form-item label="3KG">
                    <el-input-number
                      v-model="formData.productTypePayload.plainBrine.kg3"
                      size="small"
                      :min="0"
                      :step="1"
                      :disabled="isShowDetail"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="5">
                  <el-form-item label="5KG">
                    <el-input-number
                      v-model="formData.productTypePayload.plainBrine.kg5"
                      size="small"
                      :min="0"
                      :step="1"
                      :disabled="isShowDetail"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>
            <el-tab-pane :label="`Otlu Salamura (${calcTotalHerbBrineKG}kg)`">
              <el-row :gutter="16">
                <el-col :span="5">
                  <el-form-item label="2KG">
                    <el-input-number
                      v-model="formData.productTypePayload.herbBrine.kg2"
                      size="small"
                      :min="0"
                      :step="1"
                      :disabled="isShowDetail"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="5">
                  <el-form-item label="3KG">
                    <el-input-number
                      v-model="formData.productTypePayload.herbBrine.kg3"
                      size="small"
                      :min="0"
                      :step="1"
                      :disabled="isShowDetail"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="5">
                  <el-form-item label="5KG">
                    <el-input-number
                      v-model="formData.productTypePayload.herbBrine.kg5"
                      size="small"
                      :min="0"
                      :step="1"
                      :disabled="isShowDetail"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>
          </el-tabs>
          <p class="total-balance" :class="{ red: !formData.isRetail && calcRemainingKG < 0 }">
            Toplam : {{ sumTotalKG }} KG
          </p>
        </div>

        <div class="alert-group" v-if="!formData.isRetail">
          <el-alert
            v-if="calcRemainingKG < 0"
            title="Not: Müşteri için ayrılan kg değerini aştınız."
            type="error"
          >
          </el-alert>
          <el-alert
            v-if="originalData.totalKg > 0 && calcRemainingKG == 0"
            title="Not: Müşteri için ayrılmış olan tüm kg teslim edilmiş olacaktır."
            type="success"
          >
          </el-alert>
        </div>

        <template v-if="formData.isRetail">
          <el-divider content-position="left">Ödeme Bilgileri</el-divider>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="Toplam Satış Tutarı (₺)">
                <price-input v-model="formData.totalAmount" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Ödenen Tutar (₺)">
                <price-input v-model="formData.paidAmount" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="Ödeme Tipi">
                <el-select v-model="formData.paymentType" style="width: 100%">
                  <el-option label="Nakit" value="0"></el-option>
                  <el-option label="Havale / EFT" value="1"></el-option>
                  <el-option label="Kredi Kartı" value="2"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </template>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Vazgeç</el-button>
        <el-button
          v-if="!isShowDetail"
          type="primary"
          @click="saveAccounting"
          :disabled="isValidation"
          >Kaydet</el-button
        >
        <el-button v-else type="primary" @click="closePopup">Kapat</el-button>
      </span>
    </el-dialog>
  </el-card>
</template>

<script>
import moment from 'moment'
import { formatNumber } from '../utils/helpers'
import { supabase } from '../utils/supabase'
import globalMixin from '../mixin/global.mixin.js'
import PriceInput from '../components/PriceInput.vue'

export default {
  name: 'AccountingProcess',
  mixins: [globalMixin],
  components: { PriceInput },
  data() {
    return {
      loading: false,
      dialogVisible: false,
      editingAccounting: false,
      isShowDetail: false,
      currentPage: 1,
      pageSize: 9,
      customerBalanceExtractList: [],
      customerBalanceList: [],
      productList: [],
      originalData: {
        totalKg: 0,
        purchasedAmount: 0,
        remainingKg: 0,
        plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0, kg10: 0, kg25: 0 },
        herbyTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
        plainSalamura: { kg2: 0, kg3: 0, kg5: 0 },
        herbySalamura: { kg2: 0, kg3: 0, kg5: 0 }
      },
      isNewExtract: false,
      routeUser: null,
      retailTotalRevenue: 0,
      filter: {
        season: '',
        dateRange: [],
        isClosing: 'Tümü'
      },
      formData: {
        fullName: '',
        seasonName: '',
        totalKg: 0,
        remainingKg: 0,
        balanceId: null,
        deliveryType: 'wholesale',
        isRetail: false,
        totalAmount: 0,
        paidAmount: 0,
        paymentType: '0',
        productTypePayload: {
          herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 }, // otlu tulum
          plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0, kg10: 0, kg25: 0 }, // sade tulum
          plainBrine: { kg2: 0, kg3: 0, kg5: 0 }, // salamura
          herbBrine: { kg2: 0, kg3: 0, kg5: 0 } // otlu salamura
        }
      },
      pickerOptions: {
        /* disabledDate(time) {
          return time.getTime() < Date.now();
        }, */
      }
    }
  },
  async mounted() {
    // Sadece Accounting ekranından gelebilir
    const user = this.$route.params?.user

    this.routeUser = user
    await this.fetchAllProducts()
    await this.getAllCustomerBalance()
    await this.getAllCustomerBalanceExtract()

    // Set active season
    const currentYear = new Date().getFullYear().toString()
    const activeSeason = this.getSeasonList?.find((s) => s.label.includes(currentYear))
    if (activeSeason) {
      this.filter.season = activeSeason.value
    }

    // Yeni işlem popup'ını aç
    if (this.$route.params?.type === 'add') {
      await this.isOpenDialog('add', user)
    }
  },
  watch: {
    '$route.params.user': {
      handler: async function (newVal) {
        if (newVal) {
          this.routeUser = newVal
          await this.fetchAllProducts()
          await this.getAllCustomerBalance()
          await this.getAllCustomerBalanceExtract()
          if (this.$route.params?.type === 'add') {
            await this.isOpenDialog('add', newVal)
          }
        }
      },
      deep: true
    }
  },
  computed: {
    overallRemainingKg() {
      const balance = this.customerBalanceList.find((b) => b.id === this.routeUser?.id)
      return balance ? balance.remaining_kg_quota : this.routeUser?.remainingKg || 0
    },
    getCurrentBalanceDetail() {
      return (
        this.customerBalanceList?.find((balance) => balance.id === this.formData.balanceId) || 0
      )
    },
    filteredData() {
      const filtered = this.customerBalanceExtractList.filter((item) => {
        let matchesSeason = true
        let matchesDate = true

        if (this.filter.season) {
          matchesSeason = item.seasonId === this.filter.season
        }

        if (this.filter.dateRange && this.filter.dateRange.length === 2) {
          const start = moment(this.filter.dateRange[0]).startOf('day')
          const end = moment(this.filter.dateRange[1]).endOf('day')
          const current = moment(item.createdAt)
          matchesDate = current.isBetween(start, end, null, '[]')
        }

        return matchesSeason && matchesDate
      })

      return filtered?.sort((a, b) => {
        const dateA = new Date(a.createdAt)
        const dateB = new Date(b.createdAt)
        return dateB - dateA
      })
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredData?.slice(start, end)
    },
    calcTotalHerbyTulum() {
      const h = this.formData.productTypePayload.herbTulum
      return h.kg1 * 1 + h.kg2 * 2 + h.kg3 * 3 + h.kg5 * 5
    },
    calcTotalPlainTulumKG() {
      const p = this.formData.productTypePayload.plainTulum
      return p.kg1 * 1 + p.kg2 * 2 + p.kg3 * 3 + p.kg5 * 5 + p.kg10 * 10 + p.kg25 * 25
    },
    calcTotalPlainBrineKG() {
      const b = this.formData.productTypePayload.plainBrine
      return b.kg2 * 2 + b.kg3 * 3 + b.kg5 * 5
    },
    calcTotalHerbBrineKG() {
      const b = this.formData.productTypePayload.herbBrine
      return b.kg2 * 2 + b.kg3 * 3 + b.kg5 * 5
    },
    sumOtherTotalKG() {
      return this.getCustomerBalanceExtractList
        ?.filter(
          (extract) =>
            extract.customerId ==
              (this.getCurrentBalanceDetail.customerId ||
                this.$route.params?.user?.customerId ||
                this.outputDetail?.customerId) && extract.id !== this.outputDetail?.id
        )
        ?.reduce((sum, extract) => sum + (extract.totalWeight || 0), 0)
    },
    sumTotalKG() {
      return (
        this.calcTotalHerbyTulum +
        this.calcTotalPlainTulumKG +
        this.calcTotalPlainBrineKG +
        this.calcTotalHerbBrineKG
      )
    },
    calcRemainingKG() {
      if (!this.editingAccounting) return this.originalData.remainingKg - this.sumTotalKG || 0

      const total = Number(this.originalData.totalKg || 0)
      const used = this.sumTotalKG
      const remaining = total - used
      return Math.max(remaining, 0)
    },
    getPopupTitle() {
      let title
      if (this.isShowDetail) {
        title = `Ender İmen - Cari Detayı`
        return title
      }

      return this.editingAccounting
        ? 'Müşterinin Alım İşlemini Düzenle'
        : 'Yeni Alım İşlemi Oluştur'
    },
    isValidation() {
      if (this.formData.isRetail) {
        // Perakende için en az bir ürün girilmiş olmalı
        return this.sumTotalKG <= 0
      }
      const rules =
        this.calcRemainingKG < 0 || (this.originalData.remainingKg <= 0 && this.sumTotalKG > 0)
      return rules
    }
  },
  methods: {
    async syncRemainingQuota() {
      try {
        const balanceId = this.routeUser?.id
        if (!balanceId) return

        // 1. Güncel bakiye kaydını çek
        const { data: balance } = await supabase
          .from('customer_balances')
          .select('*')
          .eq('id', balanceId)
          .single()

        if (!balance) return

        // 2. Bu müşterinin bu sezonki tüm teslimatlarını topla
        const { data: deliveries } = await supabase
          .from('customer_deliveries')
          .select('total_weight_delivered')
          .eq('customer_id', balance.customer_id)
          .eq('season_id', balance.season_id)

        const totalDelivered =
          deliveries?.reduce((s, d) => s + (d.total_weight_delivered || 0), 0) || 0
        const correctedRemaining = (balance.total_kg_quota || 0) - totalDelivered

        // 3. Veritabanını güncelle
        await supabase
          .from('customer_balances')
          .update({ remaining_kg_quota: correctedRemaining })
          .eq('id', balanceId)

        this.$notify({
          title: 'Başarılı',
          message: 'Müşteri bakiyesi teslimatlara göre yeniden hesaplandı ve düzeltildi.',
          type: 'success'
        })

        await this.getAllCustomerBalance()
        await this.getAllCustomerBalanceExtract()
      } catch (err) {
        console.error(err)
        this.$message.error('Bakiye düzeltme sırasında hata oluştu.')
      }
    },
    async fetchAllProducts() {
      const { data } = await supabase
        .from('product_types')
        .select('*')
        .eq('tenant_id', this.currentTenantId)
      this.productList = data || []
    },
    async getAllCustomerBalance() {
      const { data } = await supabase
        .from('customer_balances')
        .select('*, customer:customers(full_name), season:seasons(name)')
        .eq('is_closed', false)
      this.customerBalanceList = data || []
    },
    async getAllCustomerBalanceExtract() {
      const customerId = this.routeUser?.customerId
      if (!customerId) return

      this.loading = true
      try {
        // 1. Sadece bu müşterinin teslimatlarını çek
        const { data: deliveries, error: dErr } = await supabase
          .from('customer_deliveries')
          .select(
            `
            *,
            customer:customers(full_name, is_closed),
            season:seasons(name),
            items:customer_delivery_items(
              *,
              product:product_types(*)
            )
          `
          )
          .eq('tenant_id', this.currentTenantId)
          .eq('customer_id', customerId)
          .order('delivery_date', { ascending: false })

        if (dErr) {
          console.error(dErr)
          return
        }

        // 2. Bu müşterinin güncel bakiyesini çek
        const { data: balances } = await supabase
          .from('customer_balances')
          .select('id, customer_id, season_id, total_kg_quota, remaining_kg_quota')
          .eq('customer_id', customerId)

        // 3. Müşteri+Sezon bazında güncel kalan kotaları al
        const currentRemainingMap = {}
        balances?.forEach((b) => {
          const key = `${b.customer_id}_${b.season_id}`
          // Eğer bu sezon için mükerrer kayıt varsa, sadece tıkladığımız ID ile eşleşen bakiyeyi başlangıç noktası alalım
          if (b.id === this.routeUser?.id) {
            currentRemainingMap[key] = b.remaining_kg_quota || 0
          } else if (!currentRemainingMap[key]) {
            // Henüz atanmamışsa (diğer sezonlar için) ata
            currentRemainingMap[key] = b.remaining_kg_quota || 0
          }
        })

        // 4. Geriye doğru hesaplama: En yeni teslimattan başlayarak kalan kotayı hesapla
        const mappedList = deliveries.map((d) => {
          // Eğer mükerrer kayıt varsa, doğrudan route'tan gelen bakiye ID'sini (veya eşleşen sezonu) baz alalım
          const userBalance =
            balances?.find((b) => b.id === this.routeUser?.id) ||
            balances?.find((b) => b.customer_id === d.customer_id && b.season_id === d.season_id)

          const mapKey = `${d.customer_id}_${d.season_id}`
          const totalQuota = userBalance?.total_kg_quota || 0
          const deliveredKg = d.total_weight_delivered || 0

          // Bu teslimattan sonraki kalan kota
          // Eğer bu teslimat bizim baktığımız bakiye kaydına aitse, o bakiyenin güncel değerini kullan
          const isCurrentBalance =
            userBalance?.id === d.balance_id || userBalance?.season_id === d.season_id
          const remainingAfterThis = isCurrentBalance ? currentRemainingMap[mapKey] || 0 : 0

          // Bir önceki (daha eski) teslimatın kalanını bulmak için teslim edilen miktarı geri ekle
          if (isCurrentBalance) {
            currentRemainingMap[mapKey] = (currentRemainingMap[mapKey] || 0) + deliveredKg
          }

          return {
            id: d.id,
            balanceId: userBalance?.id,
            customerId: d.customer_id,
            name: d.customer?.full_name,
            seasonId: d.season_id,
            season: d.season?.name,
            createdAt: d.delivery_date,
            receivedKg: deliveredKg,
            totalKg: totalQuota,
            remainingKg: remainingAfterThis,
            isClosing: d.customer?.is_closed,
            isRetail: d.customer?.is_retail,
            deliveryType: d.delivery_type || 'wholesale',
            detailList: d.items?.map((i) => ({
              productTypeId: i.product_type_id,
              productTypeName: i.product?.category,
              unitWeight: i.product?.unit_weight,
              quantity: i.quantity,
              isGrassy: i.product?.is_grassy
            }))
          }
        })

        // Zaten en yenisi üstte, reverse yapmaya gerek yok
        this.customerBalanceExtractList = mappedList

        // 5. Perakende ise toplam satış tutarını hesapla
        if (this.routeUser?.isRetail) {
          const { data: transactions } = await supabase
            .from('customer_transactions')
            .select('paid_amount')
            .eq('customer_id', customerId)
            .eq('transaction_type', 'retail_sale')

          this.retailTotalRevenue =
            transactions?.reduce((sum, t) => sum + (t.paid_amount || 0), 0) || 0
        }
      } catch (err) {
        console.error('Data fetch error:', err)
      } finally {
        this.loading = false
      }
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    async newBuyProcess() {
      await this.getAllCustomerBalance()
      this.resetFormData()

      let rowData = { ...this.routeUser }
      if (this.routeUser?.id && this.customerBalanceList) {
        const latestBalance = this.customerBalanceList.find((b) => b.id === this.routeUser.id)
        if (latestBalance) {
          rowData.totalKg = latestBalance.total_kg_quota
          rowData.remainingKg = latestBalance.remaining_kg_quota
        }
      }

      this.isOpenDialog('add', rowData)
      this.isNewExtract = true
    },
    handleClick() {
      this.isOpenDialog('edit')
      this.isShowDetail = true
    },
    async isOpenDialog(type, row = {}) {
      this.editingAccounting = type === 'edit'
      this.outputDetail = row

      if (this.editingAccounting) {
        await this.fillForm()
      } else if (row && Object.keys(row).length > 0) {
        // Route'tan veya butondan gelen müşteri bilgisi var, formu doldur
        await this.fillForm()
      } else {
        this.resetFormData()
      }

      this.dialogVisible = true
    },
    async fillForm() {
      const source = this.outputDetail
      if (!source) return

      this.formData.fullName = source.name
      this.formData.isRetail = source.isRetail || false
      const defaultSeason = this.getSeasonList?.[this.getSeasonList.length - 1]
      this.formData.seasonName = source.season || defaultSeason?.label || ''
      this.formData.totalKg = source.totalKg || 0
      this.formData.remainingKg = source.remainingKg || 0
      this.formData.deliveryType = source.isRetail ? 'retail' : 'wholesale'
      this.originalData.totalKg = source.totalKg || 0
      this.originalData.remainingKg = source.remainingKg || 0
      this.formData.balanceId = source.balanceId || source.id
      this.formData.deliveryType = source.deliveryType || 'wholesale'

      if (this.editingAccounting) {
        this.formData.productTypePayload = this.mapOutputToForm(source.detailList)
      }
    },
    getGroupedDetails(detailList) {
      const grouped = {
        plain: [],
        herb: []
      }

      const plainItems = detailList?.filter((d) => !d.isGrassy) || []
      const herbItems = detailList?.filter((d) => d.isGrassy) || []

      // 2'şerli gruplara bölmek için (template yapısına uygunsa)
      for (let i = 0; i < plainItems.length; i += 2) {
        grouped.plain.push(plainItems.slice(i, i + 2))
      }
      for (let i = 0; i < herbItems.length; i += 2) {
        grouped.herb.push(herbItems.slice(i, i + 2))
      }

      return grouped
    },
    resetFormData() {
      this.formData = {
        fullName: '',
        totalKg: 0,
        balanceId: null,
        remainingKg: 0,
        deliveryType: 'wholesale',
        isRetail: false,
        totalAmount: 0,
        paidAmount: 0,
        paymentType: '0',
        productTypePayload: {
          herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
          plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0, kg10: 0, kg25: 0 },
          plainBrine: { kg2: 0, kg3: 0, kg5: 0 },
          herbBrine: { kg2: 0, kg3: 0, kg5: 0 }
        }
      }
      this.originalData.totalKg = 0
      this.originalData.remainingKg = 0
    },
    mapFormToOutputs(productTypePayload) {
      const outputs = []

      // Tulum
      Object.entries(productTypePayload?.plainTulum).forEach(([kgKey, quantity]) => {
        if (quantity >= 0) {
          outputs.push({
            productTypeId: this.getProductTypeId('Tulum', false, kgKey),
            type: 'Tulum',
            weightKg: Number(kgKey.replace('kg', '')),
            quantity,
            isGrassy: false
          })
        }
      })

      Object.entries(productTypePayload?.herbTulum).forEach(([kgKey, quantity]) => {
        if (quantity >= 0) {
          outputs.push({
            productTypeId: this.getProductTypeId('Tulum', true, kgKey),
            type: 'Tulum',
            weightKg: Number(kgKey.replace('kg', '')),
            quantity,
            isGrassy: true
          })
        }
      })

      // Salamura
      Object.entries(productTypePayload?.plainBrine).forEach(([kgKey, quantity]) => {
        if (quantity >= 0) {
          outputs.push({
            productTypeId: this.getProductTypeId('Salamura', false, kgKey),
            type: 'Salamura',
            weightKg: Number(kgKey.replace('kg', '')),
            quantity,
            isGrassy: false
          })
        }
      })

      Object.entries(productTypePayload?.herbBrine).forEach(([kgKey, quantity]) => {
        if (quantity >= 0) {
          outputs.push({
            productTypeId: this.getProductTypeId('Salamura', true, kgKey),
            type: 'Salamura',
            weightKg: Number(kgKey.replace('kg', '')),
            quantity,
            isGrassy: true
          })
        }
      })

      return outputs
    },
    getProductTypeId(category, isGrassy, weight) {
      const w = weight.replace('kg', '')
      return (
        this.productList?.find(
          (p) =>
            p.category === category &&
            p.is_grassy === isGrassy &&
            Number(p.unit_weight) === Number(w)
        )?.id || null
      )
    },
    mapOutputToForm(detailList) {
      const payload = {
        herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
        plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0, kg10: 0, kg25: 0 },
        plainBrine: { kg2: 0, kg3: 0, kg5: 0 },
        herbBrine: { kg2: 0, kg3: 0, kg5: 0 }
      }

      detailList?.forEach((item) => {
        const { productTypeName, unitWeight, quantity, isGrassy } = item
        const key = `kg${unitWeight}`
        if (productTypeName === 'Tulum' && isGrassy && key in payload.herbTulum)
          payload.herbTulum[key] = quantity
        else if (productTypeName === 'Tulum' && !isGrassy && key in payload.plainTulum)
          payload.plainTulum[key] = quantity
        else if (productTypeName === 'Salamura' && isGrassy && key in payload.herbBrine)
          payload.herbBrine[key] = quantity
        else if (productTypeName === 'Salamura' && !isGrassy && key in payload.plainBrine)
          payload.plainBrine[key] = quantity
      })

      return payload
    },
    checkValidation() {
      const payload = this.formData.productTypePayload

      const sumKg = (obj) => Object.values(obj || {}).reduce((acc, v) => acc + (v || 0), 0)

      // Formdaki toplam KG
      const sumTotalKG =
        sumKg(payload.herbTulum) +
        sumKg(payload.plainTulum) +
        sumKg(payload.plainBrine) +
        sumKg(payload.herbBrine)

      // Original data
      const originalTotal = this.originalData.totalKg || 0
      const originalRemaining = this.originalData.remainingKg || 0

      // Edit durumunda, önceki kaydın miktarı
      const previousUsedInRecord = this.outputDetail ? this.outputDetail.totalKg || 0 : 0

      // Düzenlenen kaydın dışındaki kullanımlar
      const usedOutside = originalTotal - originalRemaining - previousUsedInRecord

      // Kalan KG
      const remainingKg = originalTotal - usedOutside - sumTotalKG

      // Negatif olursa 0 göster
      this.remainingKg = remainingKg >= 0 ? remainingKg : 0

      // İstersen burada validation da yapabilirsin
      if (this.remainingKg < 0) {
        console.warn('Seçilen toplam miktar, kalan miktarı aşıyor!')
      }
    },
    async saveAccounting() {
      try {
        let balanceId = this.formData.balanceId || this.$route.params?.user?.id
        const items = this.mapFormToOutputs(this.formData.productTypePayload).filter(
          (i) => i.quantity > 0
        )
        const totalWeight = items.reduce((s, i) => s + i.quantity * i.weightKg, 0)

        // === STOK KONTROLÜ BAŞLANGICI ===
        const productIds = items.map((i) => i.productTypeId)
        if (productIds.length > 0) {
          // Bu ürünlerin toplam üretimini al
          const { data: prodData } = await supabase
            .from('production_outputs')
            .select('product_type_id, quantity')
            .in('product_type_id', productIds)

          // Bu ürünlerin toplam önceki teslimatlarını al
          const { data: delData } = await supabase
            .from('customer_delivery_items')
            .select('product_type_id, quantity, delivery_id')
            .in('product_type_id', productIds)

          for (const item of items) {
            const totalProduced =
              prodData
                ?.filter((p) => p.product_type_id === item.productTypeId)
                .reduce((s, p) => s + (p.quantity || 0), 0) || 0

            let totalDelivered =
              delData
                ?.filter((d) => d.product_type_id === item.productTypeId)
                .reduce((s, d) => s + (d.quantity || 0), 0) || 0

            // Eğer işlemi DÜZENLİYORSAK, bu işlemin eski miktarını teslim edilmiş saymamalıyız ki
            // stoğu yanıltmasın (üzerine yazacağız).
            if (this.editingAccounting && this.outputDetail?.id) {
              const oldDelivered =
                delData
                  ?.filter(
                    (d) =>
                      d.product_type_id === item.productTypeId &&
                      d.delivery_id === this.outputDetail.id
                  )
                  .reduce((s, d) => s + (d.quantity || 0), 0) || 0
              totalDelivered -= oldDelivered
            }

            const currentStock = totalProduced - totalDelivered

            // İstenen miktar stoktan büyükse kaydetmeyi reddet
            if (item.quantity > currentStock) {
              const product = this.productList?.find((p) => p.id === item.productTypeId)
              const typeLabel = product
                ? (product.is_grassy ? 'Otlu ' : 'Sade ') + (product.category || 'Ürün')
                : 'Ürün'
              const productName = product
                ? `${typeLabel} (${product.unit_weight}KG)`
                : 'Seçilen ürün'
              throw new Error(
                `${productName} için yeterli stok bulunmuyor! Mevcut stok: ${currentStock} adet, İstenen: ${item.quantity} adet.`
              )
            }
          }
        }
        // === STOK KONTROLÜ BİTİŞİ ===

        let balance = null
        let bErr = null

        // balanceId geçerli bir UUID mi kontrol et (basit kontrol)
        if (balanceId && balanceId !== 'undefined' && balanceId.length > 20) {
          const { data, error } = await supabase
            .from('customer_balances')
            .select('*')
            .eq('id', balanceId)
            .maybeSingle()
          balance = data
          bErr = error
        }

        // Eğer bakiye bulunamadıysa (ID eşleşmediyse veya ID yoksa), müşteri ve sezon üzerinden arayalım
        if (!balance && !bErr) {
          const searchCustomerId =
            this.outputDetail?.customerId || this.$route.params?.user?.customerId
          const searchSeasonId = this.outputDetail?.seasonId || this.$route.params?.user?.seasonId

          if (searchCustomerId && searchSeasonId) {
            const { data: recoveredBalance } = await supabase
              .from('customer_balances')
              .select('*')
              .eq('customer_id', searchCustomerId)
              .eq('season_id', searchSeasonId)
              .maybeSingle()

            if (recoveredBalance) {
              balance = recoveredBalance
              balanceId = recoveredBalance.id
            }
          }
        }

        if (!balance && !this.formData.isRetail) {
          throw new Error(
            'Müşteriye ait cari bakiye kaydı bulunamadı. Lütfen önce müşteriye bu sezon için cari tanımlayın.'
          )
        }

        if (this.editingAccounting) {
          // Edit durumunda kota iadesi ve tekrar düşüş hesabı
          const oldWeight =
            this.outputDetail.deliveryType === 'retail' ? 0 : this.outputDetail.receivedKg || 0
          const newWeight = this.formData.deliveryType === 'retail' ? 0 : totalWeight
          const diff = oldWeight - newWeight
          const newRemaining = balance ? Number(balance.remaining_kg_quota || 0) + diff : 0

          if (totalWeight === 0) {
            // Tüm ürünler çıkarılmış, işlemi tamamen iptal et (sil)
            await supabase
              .from('customer_delivery_items')
              .delete()
              .eq('delivery_id', this.outputDetail.id)

            await supabase.from('customer_deliveries').delete().eq('id', this.outputDetail.id)
          } else {
            // 1. Deliveries güncelle
            await supabase
              .from('customer_deliveries')
              .update({
                total_weight_delivered: totalWeight,
                delivery_type: this.formData.deliveryType
              })
              .eq('id', this.outputDetail.id)

            // 2. Items sil ve ekle
            await supabase
              .from('customer_delivery_items')
              .delete()
              .eq('delivery_id', this.outputDetail.id)

            if (items.length > 0) {
              await supabase.from('customer_delivery_items').insert(
                items.map((i) => ({
                  delivery_id: this.outputDetail.id,
                  product_type_id: i.productTypeId,
                  quantity: i.quantity,
                  calculated_weight: i.quantity * i.weightKg
                }))
              )
            }
          }

          // 3. Balance güncelle (Sadece bakiye varsa)
          if (balance) {
            await supabase
              .from('customer_balances')
              .update({ remaining_kg_quota: newRemaining })
              .eq('id', balanceId)
          }
        } else {
          // Yeni kayıt
          if (totalWeight === 0) {
            throw new Error('Lütfen teslim edilecek en az bir ürün seçiniz.')
          }
          // Toptan satışsa kotadan düş, perakendeyse düşme
          const newRemaining =
            this.formData.deliveryType === 'retail'
              ? Number(balance?.remaining_kg_quota || 0)
              : Number(balance?.remaining_kg_quota || 0) - totalWeight

          // 1. Deliveries ekle
          const { data: delivery, error: dErr } = await supabase
            .from('customer_deliveries')
            .insert([
              {
                tenant_id: this.currentTenantId,
                customer_id: balance ? balance.customer_id : this.routeUser.customerId,
                season_id: balance
                  ? balance.season_id
                  : this.filter.season ||
                    this.getSeasonList?.[this.getSeasonList.length - 1]?.value,
                total_weight_delivered: totalWeight,
                delivery_date: new Date(),
                delivery_type: this.formData.deliveryType
              }
            ])
            .select()
            .single()
          if (dErr) throw dErr

          // 2. Items ekle
          await supabase.from('customer_delivery_items').insert(
            items.map((i) => ({
              delivery_id: delivery.id,
              product_type_id: i.productTypeId,
              quantity: i.quantity,
              calculated_weight: i.quantity * i.weightKg
            }))
          )

          // 3. Retail ise Transaction ekle
          if (this.formData.isRetail) {
            const { error: tErr } = await supabase.from('customer_transactions').insert([
              {
                tenant_id: this.currentTenantId,
                customer_id: this.routeUser.customerId,
                season_id:
                  this.filter.season || this.getSeasonList?.[this.getSeasonList.length - 1]?.value,
                amount_kg: totalWeight,
                paid_amount: this.formData.paidAmount,
                payment_type: this.formData.paymentType,
                transaction_type: 'retail_sale',
                notes: 'Dükkan Perakende Satışı'
              }
            ])
            if (tErr) throw tErr
          }

          // 4. Balance güncelle (Sadece perakende değilse ve bakiye varsa)
          if (balance && this.formData.deliveryType !== 'retail') {
            await supabase
              .from('customer_balances')
              .update({ remaining_kg_quota: newRemaining })
              .eq('id', balanceId)
          }
        }

        this.$notify({
          title: 'Başarılı',
          type: 'success',
          message: 'İşlem başarıyla tamamlandı!'
        })
        await this.getAllCustomerBalanceExtract()
        await this.getAllCustomerBalance()
        this.closePopup()
      } catch (err) {
        console.error(err)
        this.$message.error('Hata oluştu: ' + err.message)
      }
    },
    open() {
      this.$confirm(
        'Ender İmen adlı müşterinin carisini silmek istediğinden emin misiniz?',
        'Cari Silme İşlemi',
        {
          distinguishCancelAndClose: true,
          confirmButtonText: 'Evet, Sil',
          cancelButtonText: 'İptal Et'
        }
      )
        .then(() => {
          this.$notify({
            title: 'Başarılı',
            type: 'success',
            message: 'Cari başarıyla silindi!',
            duration: 3000,
            position: 'top-right'
          })
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
    },
    getSummaries(param) {
      const { columns, data } = param
      const sums = []

      columns.forEach((column, index) => {
        // sadece 'kg' içeren kolonlar için toplam hesapla
        const isKgColumn =
          column?.property &&
          column.property.toLowerCase().includes('kg') &&
          column.property !== 'isClosing' &&
          column.property !== 'remainingKg'

        if (isKgColumn) {
          const values = this.filteredData?.map((item) => Number(item[column.property]))
          const total = values?.reduce((prev, curr) => {
            const value = Number(curr)
            return !isNaN(value) ? prev + value : prev
          }, 0)

          sums[index] = formatNumber(total) + ' KG'
        } else {
          sums[index] = '' // diğer kolonlara boş yaz
        }
      })

      return sums
    },
    getGroupedDetails(details) {
      if (!details || details.length === 0) return { plain: [], herb: [] }

      // isGrassy false => Sade (plain), true => Otlu (herb)
      const sade = details.filter((d) => !d.isGrassy)
      const otlu = details.filter((d) => d.isGrassy)

      const chunk = (arr) => {
        const result = []
        for (let i = 0; i < arr.length; i += 3) {
          result.push(arr.slice(i, i + 3))
        }
        return result
      }

      return {
        plain: chunk(sade),
        herb: chunk(otlu)
      }
    },
    closePopup() {
      this.dialogVisible = false
      this.isNewExtract = false
      this.outputDetail = null
      setTimeout(() => {
        this.isShowDetail = false
      }, 100)
    }
  },
  watch: {
    'formData.balanceId': {
      deep: true,
      handler(newValue) {
        // Düzenleme modundaysak veya yeni bir ID yoksa (sıfırlanmamışsa) izleyici veriyi ezmemeli
        if (this.editingAccounting || !newValue) {
          if (!newValue) {
            this.formData.seasonName = ''
            this.originalData.totalKg = 0
            this.originalData.remainingKg = 0
            this.formData.totalKg = 0
            this.formData.remainingKg = 0
          }
          return
        }

        if (this.customerBalanceList.length > 0) {
          const balance = this.customerBalanceList.find((b) => b.id === newValue)
          if (balance) {
            this.formData.seasonName = balance.season?.name || ''
            this.originalData.totalKg = balance.total_kg_quota || 0
            this.originalData.remainingKg = balance.remaining_kg_quota || 0
            this.formData.totalKg = balance.total_kg_quota || 0
            this.formData.remainingKg = balance.remaining_kg_quota || 0

            if (this.outputDetail) {
              this.outputDetail.totalKg = balance.total_kg_quota || 0
              this.outputDetail.seasonId = balance.season_id
            }
          }
        }
      }
    }
  },
  filters: {
    formatCount(val) {
      return val ? val.toLocaleString('tr-TR') : '0'
    }
  }
}
</script>

<style lang="scss" scoped>
.totalkg div {
  width: 100% !important;
}
.tab-wrapper {
  position: relative;
}
.tab-custom {
  margin-bottom: 20px;
}
.total-balance {
  position: absolute;
  bottom: -25px;
  right: 0;
  z-index: 10;
  font-weight: bold;
  font-size: 18px;

  &.red {
    color: red;
  }
}
.summary-total {
  padding: 0 16px;
  margin-top: 20px;
  font-size: 18px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.alert-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 40px;
}
.sub-detail {
  display: flex;
  gap: 40px;
  padding: 0 50px 10px 50px;
  $space: 10px;

  &__content {
    display: flex;
    flex-direction: column;
    gap: 8px;

    &:not(:last-child) {
      border-right: 1px dashed gray;
      padding-right: $space;
    }
  }

  &__fieldset {
    display: flex;
    align-items: flex-start;
    gap: $space;
  }
}
fieldset {
  padding: 8px 10px;
  border-radius: 5px;
  border: 1px dashed gray;
  width: max-content;
  p {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
legend {
  background-color: gray;
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
}
</style>