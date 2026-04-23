<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <h1><i class="el-icon-edit-outline"></i> Tüm Cari Ekstreleri</h1>
      <el-button type="success" icon="el-icon-notebook-2" @click="newBuyProcess"
        >Yeni Alım İşlemi Oluştur</el-button
      >
    </div>

    <!-- 

      POST (Yeni alım işlemi oluştur) payload 

      {
        "customerBalanceId": 12,
        "transactionDateUtc": "2025-09-06T19:04:04.773Z",
        "details": [
          {
            "productTypeId": 1,
            "quantity": 10,
            "weightKg": 2,
            "isGrassy": false,
            "type": "Salamura"
          },
          {
            "productTypeId": 2,
            "quantity": 5,
            "weightKg": 1,
            "isGrassy": true,
            "type": "Tulum"
          }
        ]
      }
      
      NOT
      <ul>
        <li>Müşteri Bilglieri</li>
        <li>hangi tarihte</li>
        <li>transaction ekranı ile birleştirilip işlem detayları da görünmeli / farklı ekranda da olabilir</li>
        <li>anasayfadan gelindiğinde o sezonda müşterilerin yaptıığı işlemler görüntülenmeli. (season ile eşleştirilebilir ama db cariler içinde season bilgilsi tutmuyoruz. ve oluşturulma tarihine göre olursa yanıltıcı olabilir.)</li>
        <li>yukarıdaki madde ile ilgili olarak db'e müşteri carilerine sezon bilgisi de geçilmeli. </li>
        <li>müşteri carisi oluşturma için var olan düzenleme popupındaki detay bilgiler gizlenerek gösterilir.</li>
      </ul>
      <p>Müşteri ürün talebinde bulunduğunda carisinden, dolaylı yoldan ana stoktan düş.</p>
     -->
    <br />

    <!-- filter -->
    <el-form label-position="top">
      <el-row type="flex" justify="start" align="center" :gutter="16">
        <el-col :span="5">
          <el-form-item label="Arama" class="custom-width">
            <el-input
              v-model="filter.search"
              placeholder="Müşteri arayın"
              clearable
              @input="currentPage = 1"
            />
          </el-form-item>
        </el-col>
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
        <el-col :span="5">
          <el-form-item label="İşlem Tarihi" class="custom-width">
            <el-date-picker
              v-model="filter.receivedDate"
              type="date"
              format="dd.MM.yyyy"
              placeholder=""
              @change="currentPage = 1"
            >
            </el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="Cari Durumu" class="custom-width">
            <el-radio-group v-model="filter.isClosing" size="small" @change="currentPage = 1">
              <el-radio :label="true">Aktif</el-radio>
              <el-radio :label="false">Pasif</el-radio>
              <el-radio label="Tümü">Tümü</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-table
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
          {{ scope.row.createdAt | formatDate }}
        </template>
      </el-table-column>
      <el-table-column prop="name" sortable label="Ad Soyad"></el-table-column>
      <el-table-column prop="receivedKg" sortable label="Alınan(kg)"></el-table-column>
      <el-table-column prop="remainingKg" sortable label="Kalan(kg)" width="200px">
        <template v-slot="scope">
          <template v-if="scope.row.remainingKg">
            <p style="font-weight: bold">{{ scope.row.remainingKg }} kg</p>
          </template>
          <el-tag v-else type="success"> Tamamı Teslim Edildi </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isClosing" sortable label="Cari Aktif Mi?" width="154px">
        <template v-slot="scope">
          <el-tag
            style="margin-left: 30px; width: 50px"
            :type="scope.row.isClosing ? 'danger' : 'success'"
            effect="dark"
          >
            {{ scope.row.isClosing ? 'Hayır' : 'Evet' }}
          </el-tag>
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
            <el-form-item v-if="isNewExtract" label="Müşteri Seçin" class="custom-width">
              <el-select
                v-model="formData.balanceId"
                filterable
                clearable
                placeholder="Müşteri ara"
                style="width: 100%"
              >
                <el-option
                  v-for="item in getCustomerSpecialList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-else label="Ad Soyad">
              <el-input v-model="formData.fullName" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Sezon">
              <el-input v-model="formData.seasonName" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
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
              <div style="overflow-x: auto; padding-bottom: 10px;">
                <el-row :gutter="16" type="flex" style="flex-wrap: nowrap; min-width: 800px;">
                  <el-col :span="4" style="min-width: 120px;">
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
                  <el-col :span="4" style="min-width: 120px;">
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
                  <el-col :span="4" style="min-width: 120px;">
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
                  <el-col :span="4" style="min-width: 120px;">
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
                  <el-col :span="4" style="min-width: 120px;">
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
                  <el-col :span="4" style="min-width: 120px;">
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
          <p class="total-balance" :class="{ red: calcRemainingKG < 0 }">
            Toplam : {{ sumTotalKG }} KG
          </p>
        </div>

        <div class="alert-group">
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

export default {
  name: 'AccountingProcess',
  mixins: [globalMixin],
  data() {
    return {
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
        plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0, kg10: 0, kg25: 0 },
        herbyTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
        plainSalamura: { kg2: 0, kg3: 0, kg5: 0 },
        herbySalamura: { kg2: 0, kg3: 0, kg5: 0 }
      },
      filter: {
        search: '',
        season: '',
        receivedDate: '',
        isClosing: 'Tümü'
      },
      originalData: {
        totalKg: 0,
        remainingKg: 0
      },
      isNewExtract: false,
      formData: {
        fullName: '',
        seasonName: '',
        totalKg: 0,
        remainingKg: 0,
        balanceId: null,
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
    await this.fetchAllProducts()
    await this.getAllCustomerBalance()
    await this.getAllCustomerBalanceExtract()

    setTimeout(() => {
      if (this.$route.params?.type === 'add') {
        this.fillForm(this.$route.params)
        this.isOpenDialog('add', this.$route.params?.user)
      }
    }, 500)

    const { customerName, season, user } = this.$route.params || {}
    this.filter.search = customerName || ''
    this.filter.season = season || ''
    this.formData.fullName = user?.name || ''
  },
  computed: {
    getSeasonList() {
      return this.$store.getters['season/getSeasonList'] || []
    },
    getCurrentBalanceDetail() {
      return (
        this.customerBalanceList?.find((balance) => balance.id === this.formData.balanceId) || 0
      )
    },
    getCustomerSpecialList() {
      return this.customerBalanceList?.map((b) => ({
        label: `${b.customer?.full_name} (${b.season?.name}) - Kalan: ${b.remaining_kg_quota}kg`,
        value: b.id
      }))
    },
    filteredData() {
      const filtered = this.customerBalanceExtractList.filter((item) => {
        let matchesSearch = true
        let matchesSeason = true
        let matchesDate = true

        if (this.filter.search) {
          matchesSearch = item.name?.toLowerCase().includes(this.filter.search.toLowerCase())
        }
        if (this.filter.season) {
          matchesSeason = item.seasonId === this.filter.season
        }
        matchesDate = this.filter.receivedDate
          ? moment(item.createdAt).isSame(moment(this.filter.receivedDate), 'day')
          : true

        const matchesState =
          this.filter.isClosing === 'Tümü' ||
          this.filter.isClosing === null ||
          this.filter.isClosing === undefined
            ? true
            : item.isClosing !== this.filter.isClosing

        return matchesSearch && matchesSeason && matchesDate && matchesState
      })

      // Oluşturulma tarihine göre azalan sıralama (en yenisi en üstte)
      return filtered?.sort((a, b) => {
        const dateA = new Date(a.createdAt)
        const dateB = new Date(b.createdAt)
        return dateB - dateA // büyükten küçüğe
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
      const rules =
        this.calcRemainingKG < 0 || (this.originalData.remainingKg <= 0 && this.sumTotalKG > 0)
      return rules
    }
  },
  methods: {
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
      // 1. Teslimatları çek
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
        .order('delivery_date', { ascending: false })

      if (dErr) {
        console.error(dErr)
        return
      }

      // 2. Güncel bakiyeleri çek (Eşleştirmek için)
      const { data: balances } = await supabase
        .from('customer_balances')
        .select('customer_id, season_id, total_kg_quota, remaining_kg_quota')

      // 3. Eşleştir ve Map'le
      this.customerBalanceExtractList = deliveries.map((d) => {
        const userBalance = balances?.find(
          (b) => b.customer_id === d.customer_id && b.season_id === d.season_id
        )

        return {
          id: d.id, // Delivery ID
          balanceId: userBalance?.id, // Ana Cari (Balance) ID
          customerId: d.customer_id,
          name: d.customer?.full_name,
          seasonId: d.season_id,
          season: d.season?.name,
          createdAt: d.delivery_date,
          receivedKg: d.total_weight_delivered,
          totalKg: userBalance?.total_kg_quota || 0,
          remainingKg: userBalance?.remaining_kg_quota || 0,
          isClosing: d.customer?.is_closed,
          detailList: d.items?.map((i) => ({
            productTypeId: i.product_type_id,
            productTypeName: i.product?.category,
            unitWeight: i.product?.unit_weight,
            quantity: i.quantity,
            isGrassy: i.product?.is_grassy
          }))
        }
      })
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    newBuyProcess() {
      this.getAllCustomerBalance()
      this.isOpenDialog('add')
      this.resetFormData()
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
      } else if (!this.$route.params?.type) {
        this.resetFormData()
      }

      this.dialogVisible = true
    },
    async fillForm() {
      const source = this.outputDetail
      if (!source) return

      this.formData.fullName = source.name
      this.formData.seasonName = source.season
      this.formData.totalKg = source.totalKg || 0
      this.formData.remainingKg = source.remainingKg || 0
      this.originalData.totalKg = source.totalKg || 0
      this.originalData.remainingKg = source.remainingKg || 0
      this.formData.balanceId = source.balanceId

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

        if (!balance) {
          throw new Error(
            'Müşteriye ait cari bakiye kaydı bulunamadı. Lütfen önce müşteriye bu sezon için cari tanımlayın.'
          )
        }

        if (this.editingAccounting) {
          // İade ve yeni düşüş hesabı
          const oldWeight = this.outputDetail.receivedKg || 0
          const diff = oldWeight - totalWeight
          const newRemaining = Number(balance.remaining_kg_quota || 0) + diff

          // 1. Deliveries güncelle
          await supabase
            .from('customer_deliveries')
            .update({ total_weight_delivered: totalWeight })
            .eq('id', this.outputDetail.id)

          // 2. Items sil ve ekle
          await supabase
            .from('customer_delivery_items')
            .delete()
            .eq('delivery_id', this.outputDetail.id)
          await supabase.from('customer_delivery_items').insert(
            items.map((i) => ({
              delivery_id: this.outputDetail.id,
              product_type_id: i.productTypeId,
              quantity: i.quantity,
              calculated_weight: i.quantity * i.weightKg
            }))
          )

          // 3. Balance güncelle
          await supabase
            .from('customer_balances')
            .update({ remaining_kg_quota: newRemaining })
            .eq('id', balanceId)
        } else {
          // Yeni kayıt
          const newRemaining = Number(balance.remaining_kg_quota || 0) - totalWeight

          // 1. Deliveries ekle
          const { data: delivery, error: dErr } = await supabase
            .from('customer_deliveries')
            .insert([
              {
                tenant_id: this.currentTenantId,
                customer_id: balance.customer_id,
                season_id: balance.season_id,
                total_weight_delivered: totalWeight,
                delivery_date: new Date()
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

          // 3. Balance güncelle
          await supabase
            .from('customer_balances')
            .update({ remaining_kg_quota: newRemaining })
            .eq('id', balanceId)
        }

        this.$notify({
          title: 'Başarılı',
          type: 'success',
          message: 'İşlem başarıyla tamamlandı!'
        })
        await this.getAllCustomerBalanceExtract()
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
        // Düzenleme modundaysak izleyici veriyi ezmemeli
        if (this.editingAccounting) return

        if (newValue && this.customerBalanceList.length > 0) {
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
        } else {
          this.formData.seasonName = ''
          this.originalData.totalKg = 0
          this.originalData.remainingKg = 0
          this.formData.totalKg = 0
          this.formData.remainingKg = 0
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