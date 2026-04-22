<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <h1><i class="el-icon-edit-outline"></i> Tüm Cari Ekstreleri</h1>
      <el-button type="success" icon="el-icon-notebook-2" @click="newBuyProcess">Yeni Alım İşlemi Oluştur</el-button>
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
            <fieldset v-if="scope.row.detailList?.some(d => !d.isGrassy)" class="sub-detail__fieldset">
              <legend> Sade </legend>
              <div v-for="(group, idx) in getGroupedDetails(scope.row.detailList).plain" :key="idx" class="sub-detail__content">
                <p v-for="item in group" :key="item.productTypeId">
                  <i class="el-icon-info"></i>
                  <b>{{ item.productTypeName }}:</b> {{ item.quantity | formatCount }} adet 
                  <b>x</b> {{ item.unitWeight }}kg
                </p>
              </div>
            </fieldset>

            <fieldset v-if="scope.row.detailList?.some(d => d.isGrassy)" class="sub-detail__fieldset">
              <legend> Otlu </legend>
              <div v-for="(group, idx) in getGroupedDetails(scope.row.detailList).herb" :key="idx" class="sub-detail__content">
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
          <el-tag
            v-else
            type="success">
            Tamamı Teslim Edildi
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isClosing" sortable label="Cari Aktif Mi?" width="154px">
        <template v-slot="scope">
          <el-tag
            style="margin-left: 30px; width: 50px;"
            :type="scope.row.isClosing ? 'danger' : 'success'"
            effect="dark">
            {{ scope.row.isClosing ? 'Hayır' : 'Evet' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="İşlem" width="63">
        <template v-slot="scope">
          <!-- <el-button type="success" size="small" icon="el-icon-notebook-2" @click="handleClick">Cari Detayı</el-button> -->
          <el-button type="primary" icon="el-icon-edit" circle @click="isOpenDialog('edit', scope.row)" :disabled="scope.row.remaining == 0"></el-button>
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
    <el-dialog
      :title="getPopupTitle"
      :visible.sync="dialogVisible"
      width="40%"
      @close="closePopup"
    >
      <el-form label-position="top" :model="formData" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item v-if="isNewExtract" label="Müşteri Seçin" class="custom-width">
              <el-select v-model="formData.balanceId" filterable clearable placeholder="Müşteri ara" style="width: 100%;">
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
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Bakiye(KG)" class="totalkg">
              <el-input-number v-model="formData.totalKg" size="medium" :min="0" :step="1" disabled></el-input-number>
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
            <el-tab-pane :label="`Otlu Tulum (${calcTotalHerbyTulum}kg)`">
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
            <el-tab-pane :label="`Otlu Salamura (${calcTotalHerbBrineKG}kg)`">
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
          <p class="total-balance" :class="{'red' : calcRemainingKG < 0}">Toplam : {{ sumTotalKG }} KG</p>
        </div>

        <div class="alert-group">
          <el-alert
            v-if="calcRemainingKG < 0"
            title="Not: Müşteri için ayrılan kg değerini aştınız."
            type="error">
          </el-alert>
          <el-alert
            v-if="originalData.totalKg > 0 && calcRemainingKG == 0"
            title="Not: Müşteri için ayrılmış olan tüm kg teslim edilmiş olacaktır."
            type="success">
          </el-alert>
        </div>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Vazgeç</el-button>
        <el-button v-if="!isShowDetail" type="primary" @click="saveAccounting" :disabled="isValidation">Kaydet</el-button>
        <el-button v-else type="primary" @click="closePopup">Kapat</el-button>
      </span>
    </el-dialog>
  </el-card>
</template>

<script>
import moment from 'moment';
import { formatNumber } from '../utils/helpers';
import { mapActions, mapGetters } from 'vuex';
import globalMixin from '../mixin/global.mixin.js';

export default {
  name: 'Accounting',
  mixins: [globalMixin],
  data() {
    return {
      dialogVisible: false,
      editingAccounting: false,
      isShowDetail: false,
      currentPage: 1,
      pageSize: 9,
      outputDetail: null,
      filter: {
        search: "",
        season: "",
        receivedDate: "",
        isClosing: null
      },
      originalData: {   // servisten gelen
        totalKg: 0,
        remainingKg: 0,
      },
      isNewExtract: false,
      formData: {
        fullName: "", 
        totalKg: 0,
        remainingKg: 0,
        balanceId: null,
        productTypePayload: {
          herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 }, // otlu tulum 
          plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 }, // sade tulum
          plainBrine: { kg2: 0, kg3: 0, kg5: 0 }, // salamura 
          herbBrine: { kg2: 0, kg3: 0, kg5: 0 } // otlu salamura 
        },
      },
      pickerOptions: {
        /* disabledDate(time) {
          return time.getTime() < Date.now();
        }, */
      }
    }
  },
  async mounted () {
    setTimeout(() => {
      if (this.$route.params?.type == 'add') {
        this.fillForm(this.$route.params);
        this.isOpenDialog('add', this.$route.params?.user);
      }
    }, 500);

    const { customerName, season, user } = this.$route.params || {};
    this.filter.search = customerName || '';
    this.filter.season = season || '';
    this.formData.fullName = user?.name || '';
    await this.getAllCustomerBalanceExtract();
  },
  computed: {
    ...mapGetters({
      getCustomerBalanceExtractList: 'customer/getCustomerBalanceExtractList',
      getProductList: 'product/getProductList',
      getCustomerSpecialList: 'customer/getCustomerSpecialList',
      getCustomerBalanceList: 'customer/getCustomerBalanceList'
    }),
    getCurrentBalanceDetail() {
      return this.getCustomerBalanceList?.find(balance => balance.id == this.formData.balanceId) || 0;
    },
    filteredData() {
      // Filtreleme
      const filtered = this.getCustomerBalanceExtractList?.filter(item => {
        let matchesSearch = true
        let matchesSeason = true
        let matchesDate = true

        // Search filtresi
        if (this.filter.search) {
          matchesSearch = item.name
            ?.toLowerCase()
            .includes(this.filter.search.toLowerCase())
        }

        // Sezon filtresi
        if (this.filter.season) {
          matchesSeason = item.seasonId == this.filter.season
        }

        // Tarih filtresi
        matchesDate = this.filter.receivedDate
          ? moment(item.createdAt, 'DD.MM.YYYY').isSame(moment(this.filter.receivedDate), 'day')
          : true;
        
        const matchesState = this.filter.isClosing === 'Tümü' || this.filter.isClosing === null || this.filter.isClosing === undefined
          ? true
          : item.isClosing !== this.filter.isClosing;

        return matchesSearch && matchesSeason && matchesDate && matchesState;
      });

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
    calcTotalHerbyTulum() {
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
      const b = this.formData.productTypePayload.herbBrine;
      return (
        (b.kg2 * 2) +
        (b.kg3 * 3) +
        (b.kg5 * 5)
      );
    },
    sumOtherTotalKG() {
      return this.getCustomerBalanceExtractList
        ?.filter(extract => (extract.customerId == (this.getCurrentBalanceDetail.customerId || this.$route.params?.user?.customerId || this.outputDetail?.customerId)) && extract.id !== this.outputDetail?.id)
        ?.reduce((sum, extract) => sum + (extract.totalWeight || 0), 0);
    },
    sumTotalKG() {
      return (
        this.calcTotalHerbyTulum +
        this.calcTotalPlainTulumKG +
        this.calcTotalPlainBrineKG +
        this.calcTotalHerbBrineKG
      );
    },
    calcRemainingKG() {
      if(!this.editingAccounting) return this.originalData.remainingKg - this.sumTotalKG || 0;

      const total = Number(this.originalData.totalKg || 0);
      const used = this.sumTotalKG;
      const remaining = total - used;
      return Math.max(remaining, 0);
    },
    getPopupTitle() {
      let title;
      if (this.isShowDetail) {
        title = `Ender İmen - Cari Detayı`;
        return title;
      }

      return this.editingAccounting ? 'Müşterinin Alım İşlemini Düzenle' : 'Yeni Alım İşlemi Oluştur';
    },
    isValidation() {
      const rules = this.calcRemainingKG < 0 || (this.originalData.remainingKg <= 0 && this.sumTotalKG >= 0);
      return rules;
    }
  },
  methods: {
    ...mapActions({
      getAllCustomerBalanceExtract: 'customer/getAllCustomerBalanceExtract',
      updateCustomerBalanceExtract: 'customer/updateCustomerBalanceExtract',
      addCustomerBalanceExtract: 'customer/addCustomerBalanceExtract',
      fetchAllProducts: 'product/fetchAllProducts',
      getAllCustomerBalance: 'customer/getAllCustomerBalance'
    }),
    handlePageChange(page) {
      this.currentPage = page;
    },
    newBuyProcess() {
      this.getAllCustomerBalance();
      this.isOpenDialog('add');
      this.resetFormData();
      this.isNewExtract = true;
    },
    handleClick() {
      this.isOpenDialog('edit');
      this.isShowDetail = true;
    },
    isOpenDialog(type, row = {}) {
      this.editingAccounting = type === 'edit';
      
      this.outputDetail = row;

      if (this.editingAccounting) {
        this.fillForm();
      } else if(!this.$route.params) {
        this.resetFormData();
      }

      this.dialogVisible = true;
    },
    fillForm(row = null) {
      this.fetchAllProducts();

      this.formData.fullName = row ? row.user.name : this.outputDetail.name;
      this.formData.totalKg = row ? row.user.totalKg : this.outputDetail.totalKg;
      this.formData.remainingKg = row ? row.user.remainingKg : this.outputDetail.remainingKg;
      this.originalData.totalKg = row ? row.user.totalKg : this.outputDetail.totalKg;
      this.originalData.remainingKg = row ? row.user.remainingKg : this.outputDetail.remainingKg;
      
      if (!row) {
        this.formData.productTypePayload = this.editingAccounting ? this.mapOutputToForm(this.outputDetail?.detailList) : this.mapFormToOutputs(this.formData.productTypePayload);
      }
    },
    resetFormData() {
      this.formData = {
        fullName: '',
        totalKg: 0,
        balanceId: null,
        remainingKg: 0,
        productTypePayload: {
          herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
          plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
          plainBrine: { kg2: 0, kg3: 0, kg5: 0 },
          herbBrine: { kg2: 0, kg3: 0, kg5: 0 }
        },
      };
      this.originalData.totalKg = 0;
      this.originalData.remainingKg = 0;
    },
    mapFormToOutputs(productTypePayload) {
      const outputs = [];

      // Tulum
      Object.entries(productTypePayload?.plainTulum).forEach(([kgKey, quantity]) => {
        if (quantity >= 0) {
          outputs.push({
            productTypeId: this.getProductTypeId('Tulum', false, kgKey),
            type: 'Tulum',
            weightKg: Number(kgKey.replace('kg', '')),
            quantity,
            isGrassy: false
          });
        }
      });

      Object.entries(productTypePayload?.herbTulum).forEach(([kgKey, quantity]) => {
        if (quantity >= 0) {
          outputs.push({
            productTypeId: this.getProductTypeId('Tulum', true, kgKey),
            type: 'Tulum',
            weightKg: Number(kgKey.replace('kg', '')),
            quantity,
            isGrassy: true
          });
        }
      });

      // Salamura
      Object.entries(productTypePayload?.plainBrine).forEach(([kgKey, quantity]) => {
        if (quantity >= 0) {
          outputs.push({
            productTypeId: this.getProductTypeId('Salamura', false, kgKey),
            type: 'Salamura',
            weightKg: Number(kgKey.replace('kg', '')),
            quantity,
            isGrassy: false
          });
        }
      });

      Object.entries(productTypePayload?.herbBrine).forEach(([kgKey, quantity]) => {
        if (quantity >= 0) {
          outputs.push({
            productTypeId: this.getProductTypeId('Salamura', true, kgKey),
            type: 'Salamura',
            weightKg: Number(kgKey.replace('kg', '')),
            quantity,
            isGrassy: true
          });
        }
      });

      return outputs;
    },
    getProductTypeId(name, isGrassy, weight) {
      return this.getProductList?.find(p => 
        p.name === name &&
        p.isGrass === isGrassy &&
        p.unitWeight === `${weight.replace('kg', '')}KG`
      )?.id || null;
    },
    mapOutputToForm(detailList) {
      const payload = {
        herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
        plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
        plainBrine: { kg2: 0, kg3: 0, kg5: 0 },
        herbBrine: { kg2: 0, kg3: 0, kg5: 0 }
      };

      detailList?.forEach(item => {
        const { productTypeName, unitWeight, quantity, isGrassy } = item;
        const key = `kg${unitWeight}`;
        if (productTypeName === 'Tulum' && isGrassy && key in payload.herbTulum)
          payload.herbTulum[key] = quantity;
        else if (productTypeName === 'Tulum' && !isGrassy && key in payload.plainTulum)
          payload.plainTulum[key] = quantity;
        else if (productTypeName === 'Salamura' && isGrassy && key in payload.herbBrine)
          payload.herbBrine[key] = quantity;
        else if (productTypeName === 'Salamura' && !isGrassy && key in payload.plainBrine)
          payload.plainBrine[key] = quantity;
      });

      return payload;
    },
    checkValidation() {
      const payload = this.formData.productTypePayload;

      const sumKg = (obj) => Object.values(obj || {}).reduce((acc, v) => acc + (v || 0), 0);

      // Formdaki toplam KG
      const sumTotalKG =
        sumKg(payload.herbTulum) +
        sumKg(payload.plainTulum) +
        sumKg(payload.plainBrine) +
        sumKg(payload.herbBrine);

      // Original data
      const originalTotal = this.originalData.totalKg || 0;
      const originalRemaining = this.originalData.remainingKg || 0;

      // Edit durumunda, önceki kaydın miktarı
      const previousUsedInRecord = this.outputDetail ? (this.outputDetail.totalKg || 0) : 0;

      // Düzenlenen kaydın dışındaki kullanımlar
      const usedOutside = originalTotal - originalRemaining - previousUsedInRecord;

      // Kalan KG
      const remainingKg = originalTotal - usedOutside - sumTotalKG;

      // Negatif olursa 0 göster
      this.remainingKg = remainingKg >= 0 ? remainingKg : 0;

      // İstersen burada validation da yapabilirsin
      if (this.remainingKg < 0) {
        console.warn("Seçilen toplam miktar, kalan miktarı aşıyor!");
      }
    },
    async saveAccounting() {
      /* this.$refs.productionForm.validate(async (valid) => { */
        /* if (!valid) return; */

        if (this.editingAccounting) {
          this.checkValidation();

          const payload = {
            "id": this.outputDetail.id,
            "details": this.mapFormToOutputs(this.formData.productTypePayload)
          };
          
          const result = await this.updateCustomerBalanceExtract(payload);
          console.log(result);
          
          if (result.isSuccess) {
            this.$notify({
              title: 'Başarılı',
              type: 'success',
              message: 'Alım işlemi düzenlendi!',
              duration: 3000,
              position: 'top-right'
            });
          } else {
            this.$notify({
              title: 'Başarısız',
              type: 'error',
              message: result.message,
              duration: 3000,
              position: 'top-right'
            });
          }
        } else {
          const payload = {
            "customerBalanceId": this.getCurrentBalanceDetail.id || this.$route.params?.user.id,
            "transactionDateUtc": new Date().toISOString(),
            "details": this.mapFormToOutputs(this.formData.productTypePayload)
          };

          const result = await this.addCustomerBalanceExtract(payload);

          if (result.isSuccess) {
            this.$notify({
              title: 'Başarılı',
              type: 'success',
              message: 'Alım işlemi oluşturuldu!',
              duration: 3000,
              position: 'top-right'
            });
          } else {
            this.$notify({
              title: 'Başarısız',
              type: 'error',
              message: result.message,
              duration: 5000,
              position: 'top-right'
            });
          }
        }
        
        this.closePopup();
      /* }); */
    },
    open() {
      this.$confirm('Ender İmen adlı müşterinin carisini silmek istediğinden emin misiniz?', 'Cari Silme İşlemi', {
        distinguishCancelAndClose: true,
        confirmButtonText: 'Evet, Sil',
        cancelButtonText: 'İptal Et',
      })
      .then(() => {
        this.$notify({
          title: 'Başarılı',
          type: 'success',
          message: 'Cari başarıyla silindi!',
          duration: 3000,
          position: 'top-right',
        });
      })
      .catch(action => {
        this.$notify({
          title: 'Bilgi',
          type: 'info',
          message: 'İşlem iptal edildi',
          duration: 3000,
          position: 'top-right',
        })
      });
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];

      columns.forEach((column, index) => {
        // sadece 'kg' içeren kolonlar için toplam hesapla
        const isKgColumn =
          column?.property &&
          column.property.toLowerCase().includes('kg') &&
          column.property !== 'isClosing' &&
          column.property !== 'remainingKg';

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
    getGroupedDetails(details) {
      if (!details) return { sade: [], otlu: [] };

      // isGrassy false => Sade, true => Otlu
      const sade = details.filter(d => !d.isGrassy);
      const otlu = details.filter(d => d.isGrassy);

      // 3’erli bloklar
      const chunk = (arr) => {
        const result = [];
        for (let i = 0; i < arr.length; i += 3) {
          result.push(arr.slice(i, i + 3));
        }
        return result;
      };

      return {
        plain: chunk(sade),
        herb: chunk(otlu)
      };
    },
    closePopup() {
      this.dialogVisible = false;
      this.isNewExtract = false;
      this.outputDetail = null;
      setTimeout(() => {
        this.isShowDetail = false;
      }, 100);
    },
  },
  watch: {
    "formData.balanceId": {
      deep: true,
      handler(newValue) {
        if (newValue) {          
          this.outputDetail.totalKg = this.getCurrentBalanceDetail.totalKg;
          this.originalData.totalKg = this.getCurrentBalanceDetail.totalKg;
          this.originalData.remainingKg = this.getCurrentBalanceDetail.remainingKg;
          this.formData.totalKg = this.getCurrentBalanceDetail.totalKg;
          this.formData.remainingKg = this.getCurrentBalanceDetail.remainingKg;
        } else {
          this.outputDetail.totalKg = 0;
          this.originalData.totalKg = 0;
          this.originalData.remainingKg = 0;
        }
      }
    }
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