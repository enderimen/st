<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <h1><i class="el-icon-coin"></i> Üretimler</h1>
      <el-button
        type="primary"
        @click="isOpenDialog('add')"
        icon="el-icon-circle-plus">Yeni Üretim</el-button>
    </div>

    <!-- 
    
      :row-class-name="tableRowClassName" 
     
    
    -->
    <!-- 
    
    PAYLOAD
    FE tarafında productTypeId'ler match edilip elde edilebilir.
    {
      "customerBalanceId": 6,
      "transactionDateUtc": "2025-09-06T19:04:04.773Z",
      "details": [
        {
          "productTypeId": 1,
          "quantity": 4,
          "weightKg": 2,
          "isGrassy": true,
          "type": "Salamura"
        },
    {
          "productTypeId": 3,
          "quantity": 10,
          "weightKg": 3,
          "isGrassy": false,
          "type": "Tulum"
        }
      ]
    }

    PUT

    { "id": 25,
      "transactionDateUtc": "2025-09-06T19:04:04.773Z",
      "totalWeight": 100,
      "isSuccess": true,
      "message": "Transaction güncelleme başarılı",
      "details": [ 
        { 
          "productTypeId": 4,
          "productTypeName": "Tulum",
          "unitWeight": 1,
          "quantity": 100,
          "totalKg": 100,
          "isGrassy": true
        }
      ]
    }

    -->

    <!-- 
    NOT:

    <ul>
      <li>Yeni Üretim</li>
      <li>Tedarikçiden alınan bilgileri gir</li>
      <li>O sezona bağlı oluşturulan yeni partilerin bilgilerini göster.</li>
      <li>*Üretim sonrası çıkan parti(1kg, 2kg vb.) adetlerini güncelle</li>
      <li>*Anasayfadan gelindiğinde filtreli şekilde gelinebilinir.</li>
      <li>*üretim detaylarını görmek için tıklandığında o partide üretilenleri göstermeli. yeni üretimdeki ekran açılabilir.</li>
    </ul> -->

    <br />

    <!-- filtre -->
    <el-form label-position="top" :model="formData">
      <el-row type="flex" justify="start" :gutter="16">
        <el-col :span="5">
          <el-form-item label="Arama" class="custom-width">
            <el-input
              v-model="filter.search"
              placeholder="Tedarikçi Ara..."
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="Sezon" class="custom-width">
            <el-select v-model="filter.season" filterable clearable placeholder="Sezon seçin">
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
          <el-form-item label="Üretim Tarihi(Başlangıç)" class="custom-width">
            <el-date-picker
              v-model="filter.startDate"
              type="date"
              format="dd.MM.yyyy"
              placeholder=""
            >
            </el-date-picker>
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item label="Üretim Tarihi(Bitiş)" class="custom-width">
            <el-date-picker
              v-model="filter.endDate"
              type="date"
              format="dd.MM.yyyy"
              placeholder=""
            >
            </el-date-picker>
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
      empty-text="Üretim bulunamadı"
      :row-class-name="tableRowClassName"
    >
      <!-- <el-table-column prop="id" label="ID" width="100"></el-table-column> -->
      <el-table-column prop="season" sortable label="Sezon" width="115"></el-table-column>
      <el-table-column prop="vendor" sortable label="Tedarikçi" width="140">
        <template v-slot="scope">
          {{ truncateVendor(scope.row.vendor) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="receivedDate"
        sortable
        label="Alınma Trh."
        width="130"
      >
        <template v-slot="scope">
          {{ scope.row.receivedDate | formatDate }}
        </template>
      </el-table-column>
      <el-table-column
        prop="completedDate"
        sortable
        label="Üretim Trh."
        width="125"
      >
        <template v-slot="scope">
          {{ scope.row.completedDate | formatDate }}
        </template>
      </el-table-column>
      <el-table-column prop="cost" sortable label="Toplam Maliyet" width="160">
        <template v-slot="scope">
          {{ scope.row.cost | formatNumber }}
        </template>
      </el-table-column>
      <el-table-column prop="purchasedKG" sortable label="Alınan(kg)" width="135">
        <template v-slot="scope">
          {{ scope.row.purchasedKG | formatNumber }}
        </template>
      </el-table-column>
      <el-table-column
        prop="producedKG"
        sortable
        label="Topl. Üretilen(kg)"
        width="172"
      >
        <template v-slot="scope">
          <span v-if="scope.row.producedKG">
            {{ scope.row.producedKG | formatNumber }}
          </span>
          <el-tag v-else type="warning" effect="dark">Devam Ediyor</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lossKG" sortable label="Fire" width="100">
        <template v-slot="scope">
          {{ scope.row.lossKG | formatNumber }}
        </template>
      </el-table-column>
      <el-table-column prop="unitAmount" sortable label="₺/kg" width="85">
        <template v-slot="scope">
          {{ getUnitAmountPrice(scope.row.unitAmount) | formatNumber }} {{ scope.row.unitAmount ? '₺' : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="desc" sortable label="Not" width="75">
        <template v-slot="scope">
          <el-tooltip class="item" effect="dark" :content="scope.row.desc ? scope.row.desc : 'Henüz not belirtilmedi'" placement="left">
            <div class="cursor gap">
              <i class="el-icon-info"></i>
              <span>Bilgi</span>
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="İşlem" width="152">
        <template v-slot="scope">
          <el-tooltip class="item" effect="dark" :content="`${scope.row.season} Üretimlerini Gör`" placement="top-start">
            <el-button type="success" size="small" icon="el-icon-notebook-2" @click="showDetail(scope.row)">Detay</el-button>
          </el-tooltip>
          <el-tooltip class="item" effect="dark" content="Üretimi Düzenle" placement="top-start">
            <el-button
              type="primary"
              icon="el-icon-edit"
              circle
              @click="isOpenDialog('edit', scope.row)"
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

    <el-dialog
      :title="getPopupTitle"
      :visible.sync="dialogVisible"
      width="43%"
      @close="closePopup">
      <el-form label-position="top" :model="formData" label-width="100px" :rules="rules" ref="productionForm">
        <el-row v-if="!isShowDetail" :gutter="16">
          <el-col :span="12">
            <el-form-item label="Sezon" class="custom-width" prop="currentSeason">
              <el-select v-model="formData.currentSeason" filterable placeholder="Sezon seçin">
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
          <el-col :span="12">
            <el-form-item label="Tedarikçi" class="custom-width" prop="currentVendor">
              <el-select v-model="formData.currentVendor" filterable placeholder="Tedarikçi seçin">
                <el-option
                  v-for="item in vendorList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Alınan KG" class="custom-width" prop="purchasedKG">
              <el-input v-model="formData.purchasedKG" :disabled="isShowDetail"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Toplam Alım Tutarı" style="width: 290px;" prop="purchasedAmount">
              <price-input v-model="formData.purchasedAmount" :decimals="2" :min="0" :disabled="isShowDetail" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="!isShowDetail" :gutter="16">
          <el-col :span="12">
            <el-form-item label="Teslim Alınma Tarihi" class="custom-width" prop="receivedDate">
              <el-date-picker
                v-model="formData.receivedDate"
                type="date"
                format="dd.MM.yyyy"
                placeholder=""
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Tamamlanma Tarihi" class="custom-width" prop="completedDate">
              <el-date-picker
                v-model="formData.completedDate"
                type="date"
                placeholder=""
                format="dd.MM.yyyy"
                :picker-options="pickerOptions"
                :disabled="!editingProduction"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <div v-if="editingProduction" class="tab-wrapper">
          <el-tabs type="card" class="tab-custom"> <!-- @tab-click="handleClick" -->
            <el-tab-pane :label="`Tulum (${calcTotalHerbyTulumKG}kg)`">
              <el-row :gutter="16">
                <el-col :span="6">
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
                <el-col :span="6">
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
                <el-col :span="6">
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
                <el-col :span="6">
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
            <el-tab-pane :label="`Otlu Tulum (${calcTotalPlainTulumKG}kg)`">
              <el-row :gutter="16">
                <el-col :span="6">
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
                <el-col :span="6">
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
                <el-col :span="6">
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
                <el-col :span="6">
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
              </el-row>
            </el-tab-pane>
            <el-tab-pane :label="`Salamura (${calcTotalPlainBrineKG}kg)`">
              <el-row :gutter="16">
                <el-col :span="6">
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
                <el-col :span="6">
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
                <el-col :span="6">
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
                <el-col :span="6">
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
                <el-col :span="6">
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
                <el-col :span="6">
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
          <p class="total-balance">Toplam Üretilen: <strong>{{ sumTotalKG }} KG</strong></p>
        </div>

        <el-form-item v-if="editingProduction" label="Açıklama" class="full-width">
          <el-tooltip class="item" effect="dark" content="Birim fiyatı, üretilen kg üzerinden hesaplanmıştır." placement="top">
            <el-input class="noresize" type="textarea" :value="!isShowDetail ? generateDesc : getDesc" disabled></el-input>
          </el-tooltip>
        </el-form-item>

        <div class="alert-group">
          <el-alert
            v-if="sumTotalKG && sumTotalKG >= formData.purchasedKG"
            :title="`Not: Firesiz üretim yapmadıysanız üretilen adetlerinizi kontrol edin.`"
            type="error"
          >
          </el-alert>
        </div>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="closePopup">Vazgeç</el-button>
        <el-button v-if="!isShowDetail" type="primary" @click="saveProduction" :disabled="sumTotalKG > formData.purchasedKG">Kaydet</el-button>
        <el-button v-else type="primary" @click="closePopup">Kapat</el-button>
      </span>
    </el-dialog>
  </el-card>
</template>

<script>
import moment from 'moment';
import PriceInput from './../components/PriceInput.vue';
import { formatDate, formatNumber, normalizeNumber, getUnitAmount } from '../utils/helpers';
import { mapActions, mapGetters } from 'vuex';
import globalMixin from '../mixin/global.mixin.js';

export default {
  name: 'Manifacture',
  components: {
    PriceInput
  },
  mixins: [globalMixin],
  data() {
    return {
      dialogVisible: false,
      currentPage: 1,
      pageSize: 7,
      isShowDetail: false,
      date: "",
      desc: "",
      filter: {
        endDate: '',
        startDate: '',
        season: '',
        search: ''
      },
      formData: {
        fullName: '',
        productTypePayload: {
          herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 }, // otlu
          plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 }, // sade
          plainBrine: { kg2: 0, kg3: 0, kg5: 0 }, // salamura
          herbBrine: { kg2: 0, kg3: 0, kg5: 0 } // otlu salamura
        },
        desc: '',
        currentSeason: '',
        currentVendor: '',
        purchasedKG: 0,
        purchasedAmount: 0,
        receivedDate: '',
        completedDate: '' // outputdate
      },
      editingProduction: false,
      outputDetail: null,
      rules: {
        currentSeason: [
          { required: true, message: 'Sezon seçiniz', trigger: 'change' }
        ],
        currentVendor: [
          { required: true, message: 'Tedarikçi seçiniz', trigger: 'change' }
        ],
        purchasedKG: [
          { required: true, message: 'Alınan KG giriniz', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (!/^\d+$/.test(value)) {
                callback(new Error('Sadece sayı girebilirsiniz'));
              } else if (parseInt(value, 10) <= 0) {
                callback(new Error('KG 0’dan büyük olmalı'));
              } else {
                callback();
              }
            },
            trigger: 'blur'
          }
        ],
        purchasedAmount: [
          { required: true, message: 'Toplam alım tutarı giriniz', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (!value || value <= 0) {
                callback(new Error('Geçerli bir alım tutarı giriniz'))
              } else {
                callback()
              }
            }, trigger: 'blur'
          }
        ],
        receivedDate: [
          { required: true, message: 'Teslim alınma tarihi seçiniz', trigger: 'change' }
        ],
        // Düzenleme ekranına özel kural
        completedDate: [
          {
            validator: (rule, value, callback) => {
              if (value && this.editingProduction) {
                const payload = this.formData.productTypePayload;
                const total =
                  (payload.herbTulum.kg1 || 0) +
                  (payload.herbTulum.kg2 || 0) +
                  (payload.herbTulum.kg3 || 0) +
                  (payload.herbTulum.kg5 || 0) +
                  (payload.plainTulum.kg1 || 0) +
                  (payload.plainTulum.kg2 || 0) +
                  (payload.plainTulum.kg3 || 0) +
                  (payload.plainTulum.kg5 || 0) +
                  (payload.plainBrine.kg2 || 0) +
                  (payload.plainBrine.kg3 || 0) +
                  (payload.plainBrine.kg5 || 0) +
                  (payload.herbBrine.kg2 || 0) +
                  (payload.herbBrine.kg3 || 0) +
                  (payload.herbBrine.kg5 || 0);
              }
              callback();
            },
            trigger: ['change', 'blur']
          }
        ]
      },
      pickerOptions: {
        /* disabledDate(time) {
          return time.getTime() < Date.now();
        }, */
      }
    }
  },
  async mounted() {
    const { vendorName, season } = this.$route.params || {};
    if (vendorName) this.filter.search = vendorName;
    if (season) this.filter.season = season;
    /* this.formData.receivedDate = new Date(); */
    await this.fetchAllProductions();
  },
  computed: {
    ...mapGetters({
      getProductionList: "production/getProductionList",
      vendorList: 'vendor/getVendorList'
    }),
    filteredData() {
      return this.getProductionList?.filter(item => {
        let matchesSearch = true;
        let matchesSeason = true;
        let matchesDate = true;

        // Search filtresi
        if (this.filter.search) {
          matchesSearch = item.vendor
            ?.toLowerCase()
            .includes(this.filter.search.toLowerCase());
        }

        // Sezon filtresi
        if (this.filter.season) {
          matchesSeason = item.seasonId == this.filter.season;
        }

        console.log(this.filter.startDate, this.filter.endDate);
        
        // Tarih filtresi
        if (this.filter.startDate && this.filter.endDate) {
          const start = moment(this.filter.startDate).startOf('day');
          const end = moment(this.filter.endDate).endOf('day').add(24, 'hours');

          const itemDate = moment.utc(item.completedDate);

          matchesDate = itemDate.isBetween(start, end, null, '[]');
        }

        return matchesSearch && matchesSeason && matchesDate;
      })
      .sort((a, b) => {
        const dateA = moment.utc(a.completedDate);
        const dateB = moment.utc(b.completedDate);
        return dateB - dateA; // büyükten küçüğe
      });
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredData?.slice(start, end)
    },
    calcTotalHerbyTulumKG() {
      const h = this.formData.productTypePayload.herbTulum
      return h.kg1 * 1 + h.kg2 * 2 + h.kg3 * 3 + h.kg5 * 5
    },
    calcTotalPlainTulumKG() {
      const p = this.formData.productTypePayload.plainTulum
      return p.kg1 * 1 + p.kg2 * 2 + p.kg3 * 3 + p.kg5 * 5
    },
    calcTotalPlainBrineKG() {
      const b = this.formData.productTypePayload.plainBrine
      return b.kg2 * 2 + b.kg3 * 3 + b.kg5 * 5
    },
    calcTotalHerbBrineKG() {
      const b = this.formData.productTypePayload.herbBrine
      return b.kg2 * 2 + b.kg3 * 3 + b.kg5 * 5
    },
    sumTotalKG() {
      return this.calcTotalHerbyTulumKG + this.calcTotalPlainTulumKG + this.calcTotalPlainBrineKG + this.calcTotalHerbBrineKG;
    },
    calcUnitPrice() {
      return this.formData.purchasedAmount
        ? this.formData.purchasedAmount / this.sumTotalKG
        : 0
    },
    generateDesc() {
      let text = ''
      const unitPrice = this.calcUnitPrice
      if (this.sumTotalKG > 0) {
        text = `- Toplam fire: ${Math.abs(this.sumTotalKG - this.formData.purchasedKG)} KG`
      }
      if (unitPrice > 0) {
        return `Ortalama KG Fiyatı: ${unitPrice.toFixed(2)}₺ ${text}`
      }
      return text
    },
    getPopupTitle() {
      let title;
      
      if (this.isShowDetail) {
        title = `${ formatDate(this.date) } - Üretim Detayı`;
        return title;
      }

      return this.editingProduction ? 'Üretimi Düzenle' : 'Yeni Üretim'
    },
    getCurrentSeasonName() {
      return seasonId => this.getSeasonList?.find(season => season.id == seasonId)?.label;
    },
    getDesc() {
      return this.desc;
    },
    isFilterActive() {
      return Object.values(this.filter).some(val => val !== '');
    },
    truncateVendor() {
      return name => name.length > 14 ? name.slice(0, 14) + '...' : name;
    },
    getUnitAmountPrice() {
      return note => getUnitAmount(note);
    }
  },
  methods: {
    ...mapActions({
      fetchAllProductions: 'production/fetchAllProductions', 
      addNewProduction: 'production/addNewProduction', 
      updateProduction: 'production/updateProduction',
      getAllVendor: 'vendor/getAllVendor',
    }),
    handlePageChange(page) {
      this.currentPage = page;
    },
    isOpenDialog(type, row = {}) {
      this.editingProduction = type === 'edit'
      this.outputDetail = row;

      if (this.editingProduction) {
        this.fillForm();
      } else {
        this.getAllVendor();
        this.resetFormData();
      }
      this.dialogVisible = true
    },
    resetFormData() {
      this.formData = {
        fullName: '',
        productTypePayload: {
          herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
          plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
          plainBrine: { kg2: 0, kg3: 0, kg5: 0 },
          herbBrine: { kg2: 0, kg3: 0, kg5: 0 }
        },
        desc: '',
        currentSeason: '',
        currentVendor: '',
        purchasedKG: 0,
        purchasedAmount: 0,
        receivedDate: '',
        completedDate: ''
      };
    },
    saveProduction() {
      this.$refs.productionForm.validate(async (valid) => {
        if (!valid) return;

        if (this.editingProduction) {
          this.checkValidation();

          const payload = {
            "id": this.outputDetail.id,
            "vendorId": this.formData.currentVendor,
            "dateReceived": this.formData.receivedDate,
            "outputDate": this.formData.completedDate,
            "totalOutputQuantity": this.formData.purchasedKG - this.sumTotalKG,
            "totalAmount": this.formData.purchasedAmount,
            "inputQuantity": this.formData.purchasedKG,
            "notes": this.generateDesc,
            "seasonId": this.formData.currentSeason,
            "outputs": this.mapFormToOutputs(this.formData.productTypePayload)
          }
          
          await this.updateProduction(payload);
          
          this.$notify({
            title: 'Başarılı',
            type: 'success',
            message: 'Üretim bilgileri güncellendi!',
            duration: 3000,
            position: 'top-right'
          });
        } else {
          const payload = {
            "season": this.getCurrentSeasonName(this.formData.currentSeason),
            "vendorId": Number(this.formData.currentVendor),
            "seasonId": Number(this.formData.currentSeason),
            "dateReceived": this.formData.receivedDate,
            "totalOutputQuantity": 0,
            "totalAmount": normalizeNumber(this.formData.purchasedAmount),
            "inputQuantity": Number(this.formData.purchasedKG)
          }

          await this.addNewProduction(payload);
          this.$notify({
            title: 'Başarılı',
            type: 'success',
            message: 'Yeni üretim bilgileri kaydedildi!',
            duration: 3000,
            position: 'top-right'
          });
        }
        
        this.closePopup();
      });
    },
    checkValidation() {
      const payload = this.formData.productTypePayload;

      const sumKg = (obj) => Object.values(obj || {}).reduce((acc, v) => acc + (v || 0), 0);
      const total =
      sumKg(payload.herbTulum) +
      sumKg(payload.plainTulum) +
      sumKg(payload.plainBrine) +
      sumKg(payload.herbBrine);
      
      // Düzenleme validasyonları
      if (this.formData.completedDate && total === 0) {
        this.$notify({
          title: 'Hata',
          type: 'error',
          message: 'Üretim değerlerini girmelisiniz!',
          duration: 3000,
          position: 'top-right'
        });
        return;
      }
      if (total > 0 && !this.formData.completedDate) {
        this.$notify({
          title: "Hata",
          type: "error",
          message: "Tamamlanma tarihi girmelisiniz!",
          duration: 3000
        });
        return;
      }
    },
    /* saveProduction() {
      const payload = {
        remainingKg: this.calcRemainingKG,
        productTypePayload: this.formData.productTypePayload
      }

      console.log('Gönderilen payload:', payload)
      // api.put('/accounting', payload)

      this.closePopup();
      this.$notify({
        title: 'Başarılı',
        type: 'success',
        message: 'Yeni üretim bilgileri kaydedildi!',
        duration: 3000,
        position: 'top-right'
      })
    }, */
    showDetail(row) {
      this.date = row.receivedDate;
      this.desc = row.desc;
      this.isOpenDialog('edit', row);
      this.isShowDetail = true;
    },
    fillForm() {
      this.formData.currentSeason = this.outputDetail.season?.toString();
      this.formData.currentVendor = this.outputDetail.vendor;
      this.formData.receivedDate = this.outputDetail.receivedDate;
      this.formData.completedDate = this.outputDetail.completedDate;
      this.formData.purchasedAmount = this.outputDetail.cost;
      this.formData.purchasedKG = this.outputDetail.purchasedKG;
      this.formData.desc = this.outputDetail.note;
      this.formData.productTypePayload = this.editingProduction ? this.mapOutputToForm(this.outputDetail.outputList) : this.mapFormToOutputs(this.outputDetail.outputList);
    },
    mapOutputToForm(outputList) {
      const payload = {
        herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
        plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
        plainBrine: { kg2: 0, kg3: 0, kg5: 0 },
        herbBrine: { kg2: 0, kg3: 0, kg5: 0 }
      };

      outputList?.forEach(item => {
        const { type, weightKg, quantity, isGrassy } = item;
        const key = `kg${weightKg}`;
        if (type === 'Tulum' && !isGrassy && key in payload.herbTulum)
          payload.herbTulum[key] = quantity;
        else if (type === 'Tulum' && isGrassy && key in payload.plainTulum)
          payload.plainTulum[key] = quantity;
        else if (type === 'Salamura' && !isGrassy && key in payload.herbBrine)
          payload.herbBrine[key] = quantity;
        else if (type === 'Salamura' && isGrassy && key in payload.plainBrine)
          payload.plainBrine[key] = quantity;
      });

      return payload;
    },
    mapFormToOutputs(productTypePayload) {
      const outputs = [];

      // Tulum
      Object.entries(productTypePayload.plainTulum).forEach(([kgKey, quantity]) => {
        if (quantity > 0) {
          outputs.push({
            type: 'Tulum',
            weightKg: Number(kgKey.replace('kg', '')),
            quantity,
            isGrassy: false
          });
        }
      });

      Object.entries(productTypePayload.herbTulum).forEach(([kgKey, quantity]) => {
        if (quantity > 0) {
          outputs.push({
            type: 'Tulum',
            weightKg: Number(kgKey.replace('kg', '')),
            quantity,
            isGrassy: true
          });
        }
      });

      // Salamura
      Object.entries(productTypePayload.plainBrine).forEach(([kgKey, quantity]) => {
        if (quantity > 0) {
          outputs.push({
            type: 'Salamura',
            weightKg: Number(kgKey.replace('kg', '')),
            quantity,
            isGrassy: false
          });
        }
      });

      Object.entries(productTypePayload.herbBrine).forEach(([kgKey, quantity]) => {
        if (quantity > 0) {
          outputs.push({
            type: 'Salamura',
            weightKg: Number(kgKey.replace('kg', '')),
            quantity,
            isGrassy: true
          });
        }
      });

      return outputs;
    },
    closePopup() {
      this.dialogVisible = false;
      setTimeout(() => {
        this.isShowDetail = false;
      }, 100);
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
          column.property.toLowerCase().includes('kg');

        if (isKgColumn) {
          const list = this.isFilterActive ? data : this.getProductionList;
          const values = list?.map(item => Number(item[column.property]));
          const total = values?.reduce((prev, curr) => {
            const value = Number(curr);
            return !isNaN(value) ? prev + value : prev;
          }, 0);

          sums[index] = formatNumber(total) + ' KG';
        } else {
          sums[index] = '';
        }
      });

      return sums;
    },
    tableRowClassName({ row, rowIndex }) {
      const receivedDate = moment.utc(row.receivedDate).local();
      const completedDate = row.completedDate ? moment.utc(row.completedDate).local() : null;
      const sevenDaysLater = receivedDate.clone().add(7, 'days');
      if (!completedDate && moment().isAfter(sevenDaysLater, 'day')) {
        return 'warning-row';
      }

      return '';
    },
  }
}
</script>

<style lang="scss" scoped>
.custom-width div {
  width: 290px !important;
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
}
.gap {
  display: flex;
  align-items: center;
  gap: 5px;
}
::v-deep {
  .noresize textarea {
    resize: none !important;
    font-family: Arial, Helvetica, sans-serif;
  }
  .el-table .warning-row {
    background: #ffdddd;
  }
}
</style>