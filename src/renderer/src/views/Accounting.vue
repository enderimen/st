<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <h1><i class="el-icon-tickets"></i> Tüm Müşteri Carileri</h1>
    </div>

    <!-- 
    
    SERVICE FORMAT
    GET (tüm cariler)
    {
      "id": 0,
      "customerId": 1,
      "customerName": "Ender İmen",
      "createdDate": "2025-08-08T15:38:58.892Z",
      "totalKg": 110,
      "isClosed": false,
      "remainingKg": 70,
      "seasonId": 1,
      "seasonName": "2025 Sezonu",
      "hasTransaction": true

      POST (yeni cari oluştur)
      {
        "customerId": 2,
        "createdDate": "2025-09-06T17:11:25.319Z",
        "totalKg": 100,
        "isClosed": false,
        "remainingKg": 100,
        "seasonId": 1,
        "hasTransaction": false
      }
    },
    -->

    <!-- 
      NOT
      <ul>
        <li>Müşteri Bilglieri</li>
        <li>hangi tarihte</li>
        <li>transaction ekranı ile birleştirilip işlem detayları da görünmeli / farklı ekranda da olabilir</li>
        <li>anasayfadan gelindiğinde o sezonda müşterilerin yaptıığı işlemler görüntülenmeli. (season ile eşleştirilebilir ama db cariler içinde season bilgilsi tutmuyoruz. ve oluşturulma tarihine göre olursa yanıltıcı olabilir.)</li>
        <li>yukarıdaki madde ile ilgili olarak db'e müşteri carilerine sezon bilgisi de geçilmeli. </li>
        <li>müşteri carisi oluşturulma için var olan düzenleme popupındaki detay bilgiler gizlenerek gösterilir.</li>
      </ul>
      <p>Müşteri ürün talebinde bulunduğunda carisinden, dolaylı yoldan ana stoktan düş.</p>
     -->
    <br />

    <!-- filtre -->
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
            <el-select v-model="filter.season" filterable clearable placeholder="Sezon seçin" @change="currentPage = 1">
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
          <el-form-item label="Oluşturulma Tarihi" class="custom-width">
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
      empty-text="Cari bulunamadı"
    >
      <!-- <el-table-column prop="id" label="ID" width="140"> </el-table-column> -->
      <el-table-column prop="season" sortable label="Sezon"> </el-table-column>
      <el-table-column prop="name" sortable label="Ad Soyad"> </el-table-column>
      <el-table-column prop="totalKg" sortable label="Toplam(kg)">
        <template v-slot="scope">
          <template v-if="scope.row.totalKg">
            <p style="font-weight: bold">{{ scope.row.totalKg }}</p>
          </template>
          <el-tag
            v-else
            type="success">
            Tamamı Teslim Edildi
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remainingKg" sortable label="Kalan(kg)">
        <template v-slot="scope">
          <template v-if="scope.row.remainingKg">
            <p style="font-weight: bold">{{ scope.row.remainingKg }}</p>
          </template>
          <el-tag
            v-else
            type="success">
            Tamamı Teslim Edildi
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isClosing" sortable label="Cari Aktif Mi?" width="140">
        <template v-slot="scope">
          <el-tag
            style="margin-left: 30px; width: 50px;"
            :type="scope.row.isClosing ? 'danger' : 'success'"
            effect="dark">
            {{ scope.row.isClosing ? 'Hayır' : 'Evet' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" sortable label="Oluşturulma Tarihi" width="185px">
        <template v-slot="scope">
          {{ scope.row.createdAt | formatDate }}
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="İşlem" width="318px">
        <template v-slot="scope">
          <el-tooltip class="item" effect="dark" content="Cari İşlemlerini Gör" placement="top-start">
            <el-button type="info" size="small" icon="el-icon-search" @click="handleClick(scope.row)" :disabled="!scope.row.hasTransaction">Detay</el-button>
          </el-tooltip>
          <el-button type="success" size="small" icon="el-icon-circle-plus" @click="useBalance(scope.row)" :disabled="scope.row.remainingKg == 0">Yeni İşlem</el-button>
          <el-tooltip class="item" effect="dark" content="Cariyi Düzenle" placement="top-start">
            <el-button type="primary" icon="el-icon-edit" circle @click="isOpenDialog('edit', scope.row)"></el-button>
          </el-tooltip>
          <span class="close-account" v-if="scope.row.remainingKg == 0">
            <el-tooltip v-if="scope.row.isClosing" class="item" effect="dark" content="Cariyi Aktifleştir" placement="top-start">
              <el-button type="warning" icon="el-icon-video-play" circle @click="open(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip v-else class="item" effect="dark" content="Cariyi Kapat" placement="top-start">
              <el-button type="danger" icon="el-icon-switch-button" circle @click="open(scope.row, 'close')"></el-button>
            </el-tooltip>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      background
      layout="prev, pager, next"
      :total="filteredData.length"
      :page-size="pageSize"
      :current-page="currentPage"
      @current-change="currentPage = $event"
      style="margin-top: 20px; text-align: center"
    />

    <el-dialog
      :title="getPopupTitle"
      :visible.sync="dialogVisible"
      width="37%"
      @close="closePopup"
    >
      <el-form label-position="top" :model="formData" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Ad Soyad">
              <el-input v-model="formData.fullName" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Telefon">
              <el-input v-model="formData.phone" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Sezon" class="custom-width">
              <el-select v-model="formData.season" filterable clearable placeholder="Sezon seçin">
                <el-option
                v-for="item in getSeasonList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="Ayrılan KG" class="totalkg">
                  <el-input-number v-model="formData.totalKg" size="medium" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Kalan KG">
                  <el-input :value="calcRemainingKG" disabled></el-input>
                </el-form-item>
              </el-col>
            </el-row>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Toplam Alım Tutarı" prop="purchasedAmount">
              <price-input v-model="formData.purchasedAmount" :decimals="2" :min="0" :disabled="isShowDetail" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Ödeme Tipi" class="custom-width">
              <el-radio-group v-model="formData.paymentType" size="small">
                <el-radio label="0">Nakit</el-radio>
                <el-radio label="1">Havale / EFT</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item v-if="editingAccounting">
          <el-switch
            style="display: block"
            v-model="formData.isClosing"
            active-color="#13ce66"
            inactive-color="#ff4949"
            :active-text="`Cari ${formData.isClosing ? 'Aktif' : 'Pasif'}`">
          </el-switch>
        </el-form-item>

        <div class="alert-group" v-if="editingAccounting">
          <el-alert
            v-if="!formData.isClosing && calcRemainingKG == 0"
            title="Not: Carisi kapatılan müşterinin kg hakkı rezerve durumundan çıkarılacaktır."
            type="error">
          </el-alert>
          <el-alert
            v-if="calcRemainingKG < 0"
            title="Not: Müşteri için ayrılan kg değerini aştınız."
            type="error">
          </el-alert>
          <el-alert
            v-if="calcRemainingKG == 0 && originalData.remainingKg != 0"
            title="Not: Müşteri için ayrılmış olan tüm kg teslim edilmiş olacaktır."
            type="success">
          </el-alert>
          <el-alert
            v-if="!formData.isClosing && calcRemainingKG > 0"
            title="Not: Müşterinin kg hakkı tamamen teslim edilmeden cari kapaması yapılamaz."
            type="error">
          </el-alert>
        </div>
        
        <!-- <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item>
              <el-switch
                style="display: block"
                v-model="formData.isClosing"
                active-color="#13ce66"
                inactive-color="#ff4949"
                active-text="Cari Pasif"
                inactive-text="Cari Aktif">
              </el-switch>
            </el-form-item>
          </el-col>
        </el-row> -->

        <el-alert
          v-if="formData.purchasedAmount && formData.purchasedAmount > 0 && formData.paymentType"
          :title="getPaymentNote"
          type="info"
          :closable="false"
          show-icon>
        </el-alert>

        <br>
        
        <!-- <div v-if="!editingAccounting" class="tab-wrapper">
          <el-tabs type="card" class="tab-custom">
            <el-tab-pane :label="`Sade Tulum (${calcTotalHerbyTulumKG}kg)`">
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-form-item label="1KG">
                    <el-input-number v-model="formData.productTypePayload.herbTulum.kg1" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="2KG">
                    <el-input-number v-model="formData.productTypePayload.herbTulum.kg2" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="3KG">
                    <el-input-number v-model="formData.productTypePayload.herbTulum.kg3" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="5KG">
                    <el-input-number v-model="formData.productTypePayload.herbTulum.kg5" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>
            <el-tab-pane :label="`Otlu Tulum (${calcTotalPlainTulumKG}kg)`">
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-form-item label="1KG">
                    <el-input-number v-model="formData.productTypePayload.plainTulum.kg1" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="2KG">
                    <el-input-number v-model="formData.productTypePayload.plainTulum.kg2" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="3KG">
                    <el-input-number v-model="formData.productTypePayload.plainTulum.kg3" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="5KG">
                    <el-input-number v-model="formData.productTypePayload.plainTulum.kg5" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>
            <el-tab-pane :label="`Salamura (${calcTotalPlainBrineKG}kg)`">
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-form-item label="2KG">
                    <el-input-number v-model="formData.productTypePayload.plainBrine.kg2" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="3KG">
                    <el-input-number v-model="formData.productTypePayload.plainBrine.kg3" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="5KG">
                    <el-input-number v-model="formData.productTypePayload.plainBrine.kg5" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>
            <el-tab-pane :label="`Salamura (${calcTotalHerbBrineKG}kg)`">
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-form-item label="2KG">
                    <el-input-number v-model="formData.productTypePayload.herbBrine.kg2" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="3KG">
                    <el-input-number v-model="formData.productTypePayload.herbBrine.kg3" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="5KG">
                    <el-input-number v-model="formData.productTypePayload.herbBrine.kg5" size="small" :min="0" :step="1" :disabled="isShowDetail"></el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>
          </el-tabs>
          <p class="total-balance">Toplam: {{ sumTotalKG }} KG</p>
        </div> -->

        <!-- <div class="alert-group" v-if="editingAccounting">
          <el-alert
            v-if="!formData.isClosing && calcRemainingKG == 0"
            title="Not: Carisi kapatılan müşterinin kg hakkı rezerve durumundan çıkarılacaktır."
            type="error">
          </el-alert>
          <el-alert
            v-if="calcRemainingKG < 0"
            title="Not: Müşteri için ayrılan kg değerini aştınız."
            type="error">
          </el-alert>
          <el-alert
            v-if="calcRemainingKG == 0"
            title="Not: Müşteri için ayrılmış olan tüm kg teslim edilmiş olacaktır."
            type="success">
          </el-alert>
          <el-alert
            v-if="!formData.isClosing && calcRemainingKG > 0"
            title="Not: Müşterinin kg hakkı tamamen teslim edilmeden cari kapaması yapılamaz."
            type="error">
          </el-alert>
        </div> -->
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Vazgeç</el-button>
        <el-button v-if="!isShowDetail" type="primary" @click="saveAccounting" :disabled="checkValidation">Kaydet</el-button>
        <el-button v-else type="primary" @click="closePopup">Kapat</el-button>
      </span>
    </el-dialog>
  </el-card>
</template>

<script>
import moment from 'moment'
import { formatNumber } from '../utils/helpers'
import PriceInput from './../components/PriceInput.vue'
import { supabase } from '../utils/supabase'
import globalMixin from '../mixin/global.mixin.js'

export default {
  name: 'Accounting',
  components: { PriceInput },
  mixins: [globalMixin],
  data() {
    return {
      dialogVisible: false,
      editingAccounting: false,
      isShowDetail: false,
      currentPage: 1,
      pageSize: 8,
      outputDetail: null,
      filter: {
        search: '',
        season: '',
        receivedDate: '',
        isClosing: 'Tümü'
      },
      customerBalanceList: [],
      seasonList: [],
      search: '',
      customerDetail: null,
      originalData: {
        totalKg: 0,
        remainingKg: 0,
      },
      formData: {
        fullName: "", 
        phone: "", 
        address: "",
        season: "",
        totalKg: 0,
        remainingKg: 0,
        isClosing: false,
        purchasedAmount: 0,
        paymentType: "Nakit",
        productTypePayload: {
          herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 }, 
          plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 }, 
          plainBrine: {  kg2: 0, kg3: 0, kg5: 0 }, 
          herbBrine: {  kg2: 0, kg3: 0, kg5: 0 } 
        },
      },
    }
  },
  async mounted() {
    await this.fetchSeasons()
    await this.getAllCustomerBalance()

    // Eğer bir yönlendirme ile gelindiyse (Cari Oluştur gibi)
    if (this.$route.params?.type === 'add' || this.$route.params?.customerId) {
      await this.isOpenDialog('add')
    }

    this.filter.season = this.$route.params?.season || ''
    this.filter.search = this.$route.params?.customerName || ''
  },
  computed: {
    getSeasonList() {
      return this.seasonList.map((s) => ({
        label: s.name,
        value: s.id
      }))
    },
    getPaymentNote() {
      return `${this.formData.fullName}, ${this.formData.totalKg} KG ürün karşılığında ${ this.formData.paymentType == "1" ? 'Havale / EFT' : 'Nakit' } yoluyla ${this.getFormatedPurchasedAmount}₺ ödeme yapmıştır.`;
    },
    checkValidation() {
      return this.editingAccounting ? (this.originalData.remainingKg != 0 && !this.formData.isClosing) || this.calcRemainingKG < 0 : this.calcRemainingKG < 0;
    },
    filteredData() {
      const filtered = this.customerBalanceList.filter((item) => {
        const matchesSearch = this.filter.search
          ? item.name?.toLowerCase().includes(this.filter.search.toLowerCase())
          : true

        const matchesSeason = this.filter.season ? item.seasonId === this.filter.season : true

        const matchesDate = this.filter.receivedDate
          ? moment(item.createdAt).isSame(moment(this.filter.receivedDate), 'day')
          : true

        const matchesState =
          this.filter.isClosing === 'Tümü' ? true : item.isClosing === !this.filter.isClosing

        return matchesSearch && matchesSeason && matchesDate && matchesState
      })

      // Oluşturulma tarihine göre azalan sıralama (en yenisi en üstte)
      return filtered?.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA; // büyükten küçüğe
      });
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredData?.slice(start, end);
    },
    calcTotalHerbyTulumKG() {
      const h = this.formData.productTypePayload.herbTulum;
      return (
        (h.kg1 * 1) + 
        (h.kg2 * 2) + 
        (h.kg3 * 3) + 
        (h.kg5 * 5)
      );
    },
    calcTotalPlainTulumKG() {
      const p = this.formData.productTypePayload.plainTulum;
      return ( 
        (p.kg1 * 1) + 
        (p.kg2 * 2) + 
        (p.kg3 * 3) + 
        (p.kg5 * 5)
      );
    },
    calcTotalPlainBrineKG() {
      const b = this.formData.productTypePayload.plainBrine;
      return (
        (b.kg2 * 2) +
        (b.kg3 * 3) +
        (b.kg5 * 5)
      );
    },
    calcTotalHerbBrineKG() {
      const b = this.formData.productTypePayload.herbBrine
      return b.kg2 * 2 + b.kg3 * 3 + b.kg5 * 5
    },
    sumTotalKG() {
      return (
        this.calcTotalHerbyTulumKG +
        this.calcTotalPlainTulumKG +
        this.calcTotalPlainBrineKG +
        this.calcTotalHerbBrineKG
      );
    },
    calcRemainingKG() {
      // Servisten gelen remaining ile formdaki yeni total'i birleştir
      const alreadyUsed = this.originalData.totalKg - this.originalData.remainingKg; // geçmiş teslimatlar
      return this.formData.totalKg - alreadyUsed - this.sumTotalKG;
    },
    getPopupTitle() {
      let title;
      if (this.isShowDetail) {
        title = `Ender İmen - Cari Detayı`;
        return title;
      }

      return this.editingAccounting ? 'Müşteri Carisini Düzenle' : 'Yeni Cari Oluştur';
    },
    getFormatedPurchasedAmount() {
      return this.formData.purchasedAmount ? formatNumber(this.formData.purchasedAmount) : '';
    }
  },
  methods: {
    handleClick(row) {
      this.$router.push({ name: 'AccountingProcess', params: { customerName: row.name } })
    },
    useBalance(row) {
      this.$router.push({ name: 'AccountingProcess', params: { type: 'add', user: row } })
    },
    async fetchSeasons() {
      const { data } = await supabase.from('seasons').select('*').eq('tenant_id', this.currentTenantId)
      this.seasonList = data || []
    },
    async getAllCustomerBalance() {
      const { data, error } = await supabase
        .from('customer_balances')
        .select(`
          *,
          customer:customers(full_name, phone, address),
          season:seasons(name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        this.$message.error('Cariler yüklenirken hata oluştu.')
        return
      }

      this.customerBalanceList = data.map((item) => ({
        id: item.id,
        customerId: item.customer_id,
        name: item.customer?.full_name,
        phone: item.customer?.phone,
        address: item.customer?.address,
        seasonId: item.season_id,
        season: item.season?.name,
        totalKg: item.total_kg_quota,
        remainingKg: item.remaining_kg_quota,
        purchasedAmount: item.total_paid_amount,
        paymentType: item.payment_type,
        isClosing: item.customer?.is_closed, // Müşteri bazlı mı yoksa bakiye bazlı mı kapanıyor? Tabloda bakiye bazlı bir is_closed yoktu, müşteriden aldım.
        createdAt: item.created_at,
        hasTransaction: true // Detay ekranı için
      }))
    },
    async isOpenDialog(type, row = {}) {
      this.editingAccounting = type === 'edit'
      this.outputDetail = row
      if (this.editingAccounting) {
        this.fillForm()
      } else {
        const customerId = row.customerId || this.$route.params?.customerId
        if (customerId) {
          const { data } = await supabase
            .from('customers')
            .select('*')
            .eq('id', customerId)
            .single()
          this.customerDetail = data
        }
        this.resetFormData()
      }
      this.dialogVisible = true
    },
    resetFormData() {
      this.formData = {
        fullName: this.customerDetail?.full_name || '',
        phone: this.customerDetail?.phone || '',
        address: this.customerDetail?.address || '',
        season: '',
        totalKg: 0,
        remainingKg: 0,
        isClosing: false,
        purchasedAmount: 0,
        paymentType: 'Nakit',
        productTypePayload: {
          herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
          plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
          plainBrine: { kg2: 0, kg3: 0, kg5: 0 },
          herbBrine: { kg2: 0, kg3: 0, kg5: 0 }
        }
      }

      this.originalData.totalKg = 0
      this.originalData.remainingKg = 0

      // Mevcut yılı sezon listesinden bulalım
      const currentYear = new Date().getFullYear().toString()
      const foundSeason = this.getSeasonList?.find((s) => s.label.includes(currentYear))
      if (foundSeason) this.formData.season = foundSeason.value
    },
    fillForm() {
      if (!this.outputDetail) return

      this.formData.fullName = this.outputDetail.name
      this.formData.phone = this.outputDetail.phone
      this.formData.season = this.outputDetail.seasonId?.toString()
      this.formData.isClosing = !this.outputDetail.isClosing
      this.formData.paymentType = this.outputDetail.paymentType?.toString() || 'Nakit'
      this.formData.totalKg = this.outputDetail.totalKg || 0

      this.originalData.totalKg = this.outputDetail.totalKg || 0
      this.originalData.remainingKg = this.outputDetail.remainingKg || 0
      this.formData.purchasedAmount = this.outputDetail.purchasedAmount || 0
    },
    async saveAccounting() {
      if (!this.formData.season) {
        this.$message.warning('Lütfen bir sezon seçin.')
        return
      }

      const payload = {
        customer_id: this.editingAccounting
          ? this.outputDetail.customerId
          : (this.$route.params?.customerId || this.customerDetail?.id),
        season_id: this.formData.season,
        total_kg_quota: this.formData.totalKg,
        remaining_kg_quota: this.editingAccounting
          ? this.formData.totalKg - (this.outputDetail.totalKg - this.outputDetail.remainingKg)
          : this.formData.totalKg,
        total_paid_amount: this.formData.purchasedAmount,
        payment_type: this.formData.paymentType,
        tenant_id: this.currentTenantId
      }

      try {
        if (this.editingAccounting) {
          const { error } = await supabase
            .from('customer_balances')
            .update(payload)
            .eq('id', this.outputDetail.id)
          if (error) throw error
          this.$notify({
            title: 'Başarılı',
            type: 'success',
            message: 'Müşteri carisi güncellendi!'
          })
        } else {
          const { error } = await supabase.from('customer_balances').insert([payload])
          if (error) throw error
          this.$notify({
            title: 'Başarılı',
            type: 'success',
            message: 'Müşteri carisi oluşturuldu!'
          })
        }
        await this.getAllCustomerBalance()
        this.closePopup()
      } catch (err) {
        console.error(err)
        this.$message.error('İşlem sırasında hata oluştu.')
      }
    },
    async open(row, type) {
      const status = type === 'close' ? 'kapatmak' : 'aktifleştirmek'
      this.$confirm(
        `${row.name} adlı müşterinin carisini ${status} istediğinden emin misiniz?`,
        'Cari Düzenleme İşlemi',
        {
          distinguishCancelAndClose: true,
          confirmButtonText: 'Onayla',
          cancelButtonText: 'İptal Et'
        }
      )
        .then(async () => {
          const { error } = await supabase
            .from('customers')
            .update({ is_closed: type === 'close' })
            .eq('id', row.customerId)

          if (error) throw error

          this.$notify({
            title: 'Başarılı',
            type: 'success',
            message: 'Cari başarıyla düzenlendi!'
          })
          await this.getAllCustomerBalance()
        })
        .catch(() => {
          this.$notify({
            title: 'Bilgi',
            type: 'info',
            message: 'İşlem iptal edildi'
          })
        })
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];

      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = 'Toplam';
          return;
        }

        // sadece 'kg' içeren kolonlar için toplam hesapla
        const isKgColumn =
          column?.property &&
          column.property.toLowerCase().includes('kg') &&
          column.property !== 'isClosing';

        if (isKgColumn) {
          const values = this.filteredData?.map(item => Number(item[column.property]));
          const total = values?.reduce((prev, curr) => {
            const value = Number(curr);
            return !isNaN(value) ? prev + value : prev;
          }, 0);

          sums[index] = formatNumber(total) + ' KG';
        } else {
          sums[index] = ''; // diğer kolonlara boş yaz
        }
      });

      return sums;
    },
    closePopup() {
      this.dialogVisible = false;
      setTimeout(() => {
        this.isShowDetail = false;
      }, 100);
    },
  },
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
  top: 8px;
  right: 0;
  z-index: 10;
  font-weight: bold;
  font-size: 18px;
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
  margin-bottom: 16px;
}
.close-account {
  margin-left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
</style>