<template>
  <el-card class="card-view box-card">
    <div class="card-header">
      <h1><i class="el-icon-coin"></i> Üretim Partileri</h1>
      <el-button type="success" @click="openBatchDialog" icon="el-icon-circle-plus"
        >Yeni Parti Oluştur</el-button
      >
    </div>
    <br />

    <!-- filtre -->
    <el-form label-position="top">
      <el-row type="flex" justify="start" :gutter="16">
        <el-col :span="6">
          <el-form-item label="Sezon" class="custom-width">
            <el-select
              v-model="filter.season"
              filterable
              placeholder="Sezon seçin"
              @change="currentPage = 1"
            >
              <el-option
                v-for="item in seasonList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- Ana Tablo (Partiler) -->
    <el-table
      ref="batchTable"
      :data="paginatedData"
      border
      style="width: 100%"
      empty-text="Üretim partisi bulunamadı"
      show-summary
      :summary-method="getSummary"
    >
      <el-table-column type="expand">
        <template v-slot="scope">
          <div class="sub-detail">
            <div class="sub-detail__header">
              <h4>Ham Peynir Girişleri</h4>
            </div>
            <el-table
              :data="scope.row.inputs"
              border
              size="small"
              empty-text="Henüz alım yok"
              style="width: 100%"
            >
              <el-table-column
                prop="vendorName"
                label="Tedarikçi"
                min-width="140"
              ></el-table-column>
              <el-table-column prop="receivedAt" label="Alım Tarihi" width="130">
                <template v-slot="s">{{ s.row.receivedAt | formatDate }}</template>
              </el-table-column>
              <el-table-column prop="inputWeight" label="Alınan KG" width="110">
                <template v-slot="s">{{ s.row.inputWeight | formatNumber }}</template>
              </el-table-column>
              <el-table-column prop="unitPrice" label="Birim Fiyat" width="110">
                <template v-slot="s">{{ s.row.unitPrice | formatNumber }} ₺</template>
              </el-table-column>
              <el-table-column prop="totalCost" label="Toplam Tutar" width="120">
                <template v-slot="s">{{ s.row.totalCost | formatNumber }} ₺</template>
              </el-table-column>
              <el-table-column prop="paidAmount" label="Ödenen" width="110">
                <template v-slot="s">{{ s.row.paidAmount | formatNumber }} ₺</template>
              </el-table-column>
              <el-table-column prop="paymentType" label="Ödeme Türü" width="120"></el-table-column>
              <el-table-column prop="notes" label="Not" width="60">
                <template v-slot="s">
                  <el-tooltip effect="dark" :content="s.row.notes || 'Not yok'" placement="left">
                    <i class="el-icon-info"></i>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column label="İşlem" width="90" fixed="right">
                <template v-slot="s">
                  <el-button
                    type="primary"
                    icon="el-icon-edit"
                    circle
                    size="mini"
                    @click="openInputDialog(scope.row, s.row)"
                  ></el-button>
                  <el-button
                    type="danger"
                    icon="el-icon-delete"
                    circle
                    size="mini"
                    @click="deleteInput(scope.row, s.row)"
                  ></el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="batchName" sortable label="Parti Adı" min-width="60"></el-table-column>
      <el-table-column prop="createdAt" sortable label="Oluş. Tarihi" width="126">
        <template v-slot="scope">{{ scope.row.createdAt | formatDate }}</template>
      </el-table-column>
      <el-table-column prop="totalInputKG" sortable label="Alınan(kg)">
        <template v-slot="scope">{{ scope.row.totalInputKG | formatNumber }}</template>
      </el-table-column>
      <el-table-column prop="unitCostPerKg" sortable label="Birim Fiyat">
        <template v-slot="scope"
          >{{ scope.row.unitCostPerKg | formatNumber }}
          {{ scope.row.unitCostPerKg ? '₺' : '-' }}</template
        >
      </el-table-column>
      <el-table-column prop="totalCost" sortable label="Maliyet(₺)">
        <template v-slot="scope">{{ scope.row.totalCost | formatNumber }} ₺</template>
      </el-table-column>
      <el-table-column prop="totalOutputKG" sortable label="Üretilen(kg)" width="135">
        <template v-slot="scope">
          <span v-if="scope.row.totalOutputKG">{{ scope.row.totalOutputKG | formatNumber }}</span>
          <el-tag v-else type="info" effect="dark" size="small">-</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalWasteKG" sortable label="Top. Fire(kg)">
        <template v-slot="scope">
          <span v-if="scope.row.isCompleted && scope.row.totalWasteKG !== null"
            >{{ scope.row.totalWasteKG | formatNumber }} kg</span
          >
          <el-tag v-else type="info" effect="dark" size="small">-</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" sortable label="Durum" width="126">
        <template v-slot="scope">
          <el-tag :type="scope.row.isCompleted ? 'success' : 'warning'" effect="dark">{{
            scope.row.isCompleted ? 'Tamamlandı' : 'Devam Ediyor'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="notes" label="Not" width="75">
        <template v-slot="scope">
          <el-tooltip effect="dark" :content="scope.row.notes || 'Not yok'" placement="left">
            <div class="cursor gap"><i class="el-icon-info"></i><span>Bilgi</span></div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="İşlem" width="200">
        <template v-slot="scope">
          <div style="display: flex; gap: 8px">
            <el-button
              type="primary"
              circle
              size="small"
              icon="el-icon-edit"
              @click="editBatch(scope.row)"
            ></el-button>
            <el-button
              type="success"
              size="small"
              circle
              icon="el-icon-plus"
              @click="openInputDialog(scope.row)"
            ></el-button>
            <el-tooltip effect="dark" content="Üretim Çıktıları" placement="top-start">
              <el-button
                type="primary"
                size="small"
                icon="el-icon-notebook-2"
                @click="openOutputDialog(scope.row)"
                >Detay</el-button
              >
            </el-tooltip>
          </div>
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

    <!-- Dialog 1: Yeni Parti -->
    <el-dialog
      title="Yeni Parti Başlat"
      :visible.sync="batchDialogVisible"
      width="30%"
      @close="resetBatchForm"
    >
      <el-form label-position="top" :model="batchForm" ref="batchFormRef" :rules="batchRules">
        <el-form-item label="Parti Adı" prop="batchName">
          <el-input
            v-model="batchForm.batchName"
            disabled
            placeholder="Sezon seçilince otomatik dolar"
          ></el-input>
        </el-form-item>
        <el-form-item label="Sezon" prop="seasonId">
          <el-select
            v-model="batchForm.seasonId"
            filterable
            placeholder="Sezon seçin"
            style="width: 100%"
            @change="updateAutoName"
          >
            <el-option
              v-for="item in seasonList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Not">
          <el-input type="textarea" v-model="batchForm.notes"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="batchDialogVisible = false">Vazgeç</el-button>
        <el-button type="primary" @click="saveBatch">Kaydet</el-button>
      </span>
    </el-dialog>

    <!-- Dialog 2: Hammadde Alım -->
    <el-dialog
      :title="
        inputForm.id
          ? `Alımı Düzenle — ${selectedBatch ? selectedBatch.batchName : ''}`
          : `Yeni Alım Ekle — ${selectedBatch ? selectedBatch.batchName : ''}`
      "
      :visible.sync="inputDialogVisible"
      width="35%"
      @close="resetInputForm"
    >
      <el-form label-position="top" :model="inputForm" ref="inputFormRef" :rules="inputRules">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Tedarikçi" prop="vendorId">
              <el-select
                v-model="inputForm.vendorId"
                filterable
                placeholder="Tedarikçi seçin"
                style="width: 100%"
              >
                <el-option
                  v-for="item in vendorList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
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
              <price-input v-model="inputForm.paidAmount" :decimals="2" />
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

    <!-- Dialog 3: Üretim Çıktı (Detay) -->
    <el-dialog
      :title="`${selectedBatch ? selectedBatch.batchName : ''} - Üretim Çıktıları`"
      :visible.sync="outputDialogVisible"
      width="43%"
      @close="resetOutputForm"
    >
      <el-form label-position="top" :model="outputForm">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Toplam Alınan KG">
              <el-input :value="selectedBatch ? selectedBatch.totalInputKG : 0" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Tamamlanma Tarihi">
              <el-date-picker
                v-model="outputForm.outputDate"
                type="date"
                format="dd.MM.yyyy"
                placeholder=""
                style="width: 100%"
                :disabled="!outputDateEditable"
              ></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="tab-wrapper">
          <el-tabs type="card" class="tab-custom">
            <el-tab-pane :label="`Sade Tulum (${calcTotalPlainTulumKG}kg)`">
              <div style="overflow-x: auto; padding-bottom: 10px">
                <el-row :gutter="16" type="flex" style="flex-wrap: nowrap; min-width: 800px">
                  <el-col
                    :span="4"
                    v-for="w in [1, 2, 3, 5, 10, 25]"
                    :key="'ht' + w"
                    style="min-width: 120px"
                  >
                    <el-form-item :label="`${w}KG`">
                      <el-input-number
                        v-model="outputForm.productTypePayload.plainTulum[`kg${w}`]"
                        size="small"
                        :min="0"
                        :step="1"
                      ></el-input-number>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </el-tab-pane>
            <el-tab-pane :label="`Otlu Tulum (${calcTotalHerbyTulumKG}kg)`">
              <el-row :gutter="16">
                <el-col :span="5" v-for="w in [1, 2, 3, 5]" :key="'pt' + w">
                  <el-form-item :label="`${w}KG`">
                    <el-input-number
                      v-model="outputForm.productTypePayload.herbTulum[`kg${w}`]"
                      size="small"
                      :min="0"
                      :step="1"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>
            <el-tab-pane :label="`Salamura (${calcTotalPlainBrineKG}kg)`">
              <el-row :gutter="16">
                <el-col :span="5" v-for="w in [2, 3, 5]" :key="'pb' + w">
                  <el-form-item :label="`${w}KG`">
                    <el-input-number
                      v-model="outputForm.productTypePayload.plainBrine[`kg${w}`]"
                      size="small"
                      :min="0"
                      :step="1"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>
            <el-tab-pane :label="`Otlu Salamura (${calcTotalHerbBrineKG}kg)`">
              <el-row :gutter="16">
                <el-col :span="5" v-for="w in [2, 3, 5]" :key="'hb' + w">
                  <el-form-item :label="`${w}KG`">
                    <el-input-number
                      v-model="outputForm.productTypePayload.herbBrine[`kg${w}`]"
                      size="small"
                      :min="0"
                      :step="1"
                    ></el-input-number>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-tab-pane>
          </el-tabs>
          <p class="total-balance">
            Toplam Üretilen: <strong>{{ sumTotalKG }} KG</strong>
          </p>
        </div>
        <el-form-item label="Açıklama" class="full-width">
          <el-input
            class="noresize"
            type="textarea"
            v-model="outputForm.notes"
            :disabled="!outputDateEditable"
            placeholder="Üretim notlarınızı buraya girebilirsiniz"
          ></el-input>
        </el-form-item>
        <div class="alert-group">
          <el-alert v-if="generateDesc" :title="generateDesc" type="success"></el-alert>
          <el-alert
            v-if="sumTotalKG && selectedBatch && sumTotalKG >= selectedBatch.totalInputKG"
            title="Not: Firesiz üretim yapmadıysanız üretilen adetlerinizi kontrol edin."
            type="error"
          ></el-alert>
        </div>
      </el-form>
      <span slot="footer">
        <el-button @click="outputDialogVisible = false">Vazgeç</el-button>
        <el-button
          type="primary"
          @click="saveOutputs"
          :disabled="selectedBatch && sumTotalKG > selectedBatch.totalInputKG"
          >Kaydet</el-button
        >
      </span>
    </el-dialog>
  </el-card>
</template>

<script>
import moment from 'moment'
import PriceInput from './../components/PriceInput.vue'
import { formatDate, formatNumber, normalizeNumber } from '../utils/helpers'
import { supabase } from '../utils/supabase'
import globalMixin from '../mixin/global.mixin.js'

export default {
  name: 'Manufacture',
  mixins: [globalMixin],
  components: { PriceInput },
  data() {
    return {
      productionList: [],
      vendorList: [],
      seasonList: [],
      productTypes: [],
      manufactures: [],
      currentPage: 1,
      pageSize: 7,
      filter: { season: '' },
      // Dialog visibility
      batchDialogVisible: false,
      inputDialogVisible: false,
      outputDialogVisible: false,
      outputDateEditable: false,
      selectedBatch: null,
      // Batch form
      batchForm: { batchName: '', seasonId: '', notes: '' },
      batchRules: {
        batchName: [{ required: true, message: 'Parti adı giriniz', trigger: 'blur' }],
        seasonId: [{ required: true, message: 'Sezon seçiniz', trigger: 'change' }]
      },
      // Input form
      inputForm: {
        id: null,
        batchId: null,
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
        vendorId: [{ required: true, message: 'Tedarikçi seçiniz', trigger: 'change' }],
        receivedAt: [{ required: true, message: 'Alım tarihi seçiniz', trigger: 'change' }],
        inputWeight: [{ required: true, message: 'KG giriniz', trigger: 'blur' }],
        totalPurchaseAmount: [{ required: true, message: 'Tutar giriniz', trigger: 'blur' }]
      },
      // Output form
      outputForm: {
        outputDate: '',
        notes: '',
        productTypePayload: {
          herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
          plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
          plainBrine: { kg2: 0, kg3: 0, kg5: 0 },
          herbBrine: { kg2: 0, kg3: 0, kg5: 0 }
        }
      }
    }
  },
  filters: { formatDate, formatNumber },
  async mounted() {
    await this.fetchAuxiliaryData()
    await this.fetchAllProductions()
    // Default son sezonu seç
    if (this.seasonList.length > 0) {
      this.filter.season = this.seasonList[this.seasonList.length - 1].value
    }
  },
  computed: {
    filteredData() {
      if (!this.filter.season) return this.productionList || []
      return this.productionList?.filter((b) => b.seasonId === this.filter.season) || []
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredData.slice(start, start + this.pageSize)
    },
    calcTotalHerbyTulumKG() {
      const h = this.outputForm.productTypePayload.herbTulum
      return h.kg1 * 1 + h.kg2 * 2 + h.kg3 * 3 + h.kg5 * 5
    },
    calcTotalPlainTulumKG() {
      const p = this.outputForm.productTypePayload.plainTulum
      return (
        (p.kg1 || 0) * 1 +
        (p.kg2 || 0) * 2 +
        (p.kg3 || 0) * 3 +
        (p.kg5 || 0) * 5 +
        (p.kg10 || 0) * 10 +
        (p.kg25 || 0) * 25
      )
    },
    calcTotalPlainBrineKG() {
      const b = this.outputForm.productTypePayload.plainBrine
      return b.kg2 * 2 + b.kg3 * 3 + b.kg5 * 5
    },
    calcTotalHerbBrineKG() {
      const b = this.outputForm.productTypePayload.herbBrine
      return b.kg2 * 2 + b.kg3 * 3 + b.kg5 * 5
    },
    sumTotalKG() {
      return (
        this.calcTotalHerbyTulumKG +
        this.calcTotalPlainTulumKG +
        this.calcTotalPlainBrineKG +
        this.calcTotalHerbBrineKG
      )
    },
    generateDesc() {
      if (!this.selectedBatch) return ''
      const totalInput = this.selectedBatch.totalInputKG
      const totalCost = this.selectedBatch.totalCost
      let text = ''
      if (this.sumTotalKG > 0) {
        text = `- Toplam fire: ${Math.abs(this.sumTotalKG - totalInput)} KG`
      }
      if (totalCost > 0 && this.sumTotalKG > 0) {
        const unitPrice = totalCost / this.sumTotalKG
        return `Ortalama KG Fiyatı: ${unitPrice.toFixed(2)}₺ ${text}`
      }
      return text
    }
  },
  methods: {
    // === DATA FETCHING ===
    async fetchAuxiliaryData() {
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, full_name')
        .eq('tenant_id', this.currentTenantId)
      this.vendorList = vendors?.map((v) => ({ label: v.full_name, value: v.id })) || []
      const { data: seasons } = await supabase
        .from('seasons')
        .select('id, name')
        .eq('tenant_id', this.currentTenantId)
      this.seasonList = seasons?.map((s) => ({ label: s.name, value: s.id })) || []
      const { data: products } = await supabase
        .from('product_types')
        .select('*')
        .eq('tenant_id', this.currentTenantId)
      this.productTypes = products || []
    },
    async fetchAllProductions() {
      const { data, error } = await supabase
        .from('production_batches')
        .select(
          `
          *,
          season:seasons(name),
          inputs:production_inputs(
            id,
            vendor_id,
            received_at,
            input_weight,
            unit_price,
            total_purchase_amount,
            paid_amount,
            payment_type,
            notes,
            vendor:vendors(full_name)
          ),
          outputs:production_outputs(
            quantity,
            product:product_types(name, category, unit_weight, is_grassy)
          )
        `
        )
        .eq('tenant_id', this.currentTenantId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching productions:', error)
        this.$message.error('Üretimler yüklenirken hata oluştu.')
        return
      }
      this.productionList = data.map((batch) => {
        const totalInputKG = batch.inputs?.reduce((s, i) => s + (i.input_weight || 0), 0) || 0
        const totalCost = batch.inputs?.reduce((s, i) => s + (i.total_purchase_amount || 0), 0) || 0
        const totalOutputKG =
          batch.outputs?.reduce(
            (s, o) => s + (o.quantity || 0) * (o.product?.unit_weight || 0),
            0
          ) || 0
        return {
          id: batch.id,
          batchName: batch.batch_name,
          createdAt: batch.created_at,
          seasonId: batch.season_id,
          seasonName: batch.season?.name || '',
          isCompleted: batch.is_completed || false,
          outputDate: batch.output_date || null,
          notes: batch.notes,
          totalInputKG,
          totalCost,
          unitCostPerKg: totalInputKG > 0 ? totalCost / totalInputKG : 0,
          totalOutputKG,
          totalWasteKG: batch.is_completed ? totalInputKG - totalOutputKG : null,
          inputs:
            batch.inputs?.map((inp) => ({
              id: inp.id,
              vendorId: inp.vendor_id,
              vendorName: inp.vendor?.full_name || '',
              receivedAt: inp.received_at,
              inputWeight: inp.input_weight,
              unitPrice: inp.unit_price || 0,
              totalCost: inp.total_purchase_amount || 0,
              paidAmount: inp.paid_amount || 0,
              paymentType: inp.payment_type || 'Nakit',
              notes: inp.notes
            })) || [],
          outputList:
            batch.outputs?.map((o) => ({
              type: o.product?.name || o.product?.category,
              weightKg: Number(o.product?.unit_weight),
              quantity: o.quantity,
              isGrassy: o.product?.is_grassy
            })) || []
        }
      })
    },

    // === BATCH CRUD ===
    openBatchDialog() {
      this.resetBatchForm()
      if (this.filter.season) {
        this.batchForm.seasonId = this.filter.season
        this.updateAutoName(this.filter.season)
      }
      this.batchDialogVisible = true
    },
    resetBatchForm() {
      this.batchForm = { batchName: '', seasonId: '', notes: '' }
    },
    updateAutoName(seasonId) {
      if (!seasonId) return
      const count = this.productionList.filter((b) => b.seasonId === seasonId).length
      this.batchForm.batchName = `${count + 1}.Parti`
    },
    async saveBatch() {
      this.$refs.batchFormRef.validate(async (valid) => {
        if (!valid) return
        try {
          const { error } = await supabase.from('production_batches').insert([
            {
              batch_name: this.batchForm.batchName,
              season_id: this.batchForm.seasonId,
              notes: this.batchForm.notes || null,
              tenant_id: this.currentTenantId
            }
          ])
          if (error) throw error
          this.$notify({
            title: 'Başarılı',
            type: 'success',
            message: 'Yeni parti oluşturuldu!',
            duration: 3000,
            position: 'top-right'
          })
          this.batchDialogVisible = false
          await this.fetchAllProductions()
        } catch (err) {
          console.error(err)
          this.$message.error('Parti oluşturulurken hata oluştu.')
        }
      })
    },

    editBatch(batch) {
      this.openOutputDialog(batch, true)
    },
    openInputDialog(batch, input = null) {
      this.selectedBatch = batch
      if (input) {
        this.inputForm = {
          id: input.id,
          batchId: batch.id,
          vendorId: input.vendorId,
          receivedAt: input.receivedAt,
          inputWeight: input.inputWeight,
          unitPrice: input.unitPrice,
          totalPurchaseAmount: input.totalCost,
          paidAmount: input.paidAmount,
          paymentType: input.paymentType,
          notes: input.notes
        }
      } else {
        this.resetInputForm()
        this.inputForm.batchId = batch.id
      }
      this.inputDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.batchTable) {
          this.$refs.batchTable.toggleRowExpansion(batch, true)
        }
      })
    },
    resetInputForm() {
      this.inputForm = {
        id: null,
        batchId: null,
        vendorId: '',
        receivedAt: '',
        inputWeight: 0,
        unitPrice: 0,
        totalPurchaseAmount: 0,
        paidAmount: 0,
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
            batch_id: this.inputForm.batchId,
            vendor_id: this.inputForm.vendorId,
            received_at: this.inputForm.receivedAt,
            input_weight: this.inputForm.inputWeight,
            unit_price: normalizeNumber(this.inputForm.unitPrice),
            total_purchase_amount: normalizeNumber(this.inputForm.totalPurchaseAmount),
            paid_amount: normalizeNumber(this.inputForm.paidAmount),
            payment_type: this.inputForm.paymentType
          }
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
          await this.fetchAllProductions()
        } catch (err) {
          console.error(err)
          this.$message.error('Alım kaydedilirken hata oluştu.')
        }
      })
    },
    async deleteInput(batch, input) {
      try {
        await this.$confirm(
          `${input.vendorName} tedarikçisinden alınan ${input.inputWeight} KG alımı silmek istiyor musunuz?`,
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
        await this.fetchAllProductions()
      } catch (e) {
        if (e !== 'cancel') {
          console.error(e)
          this.$message.error('Silme sırasında hata oluştu.')
        }
      }
    },

    // === OUTPUT (DETAY) ===
    openOutputDialog(batch, editable = false) {
      this.selectedBatch = batch
      this.outputDateEditable = editable
      this.outputForm.outputDate = batch.outputDate ? batch.outputDate : null
      this.outputForm.notes = batch.notes || ''
      this.outputForm.productTypePayload = this.mapOutputToForm(batch.outputList)
      this.outputDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.batchTable) {
          this.$refs.batchTable.toggleRowExpansion(batch, true)
        }
      })
    },
    resetOutputForm() {
      this.outputForm = {
        outputDate: null,
        notes: '',
        productTypePayload: {
          herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
          plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0, kg10: 0, kg25: 0 },
          plainBrine: { kg2: 0, kg3: 0, kg5: 0 },
          herbBrine: { kg2: 0, kg3: 0, kg5: 0 }
        }
      }
      this.selectedBatch = null
    },
    async saveOutputs() {
      if (!this.selectedBatch) return
      try {
        const batchId = this.selectedBatch.id
        // Update batch output_date & notes & is_completed
        const updatePayload = { notes: this.outputForm.notes }
        if (this.outputForm.outputDate) {
          updatePayload.output_date = this.outputForm.outputDate
          updatePayload.is_completed = true
          updatePayload.output_weight = this.sumTotalKG
          updatePayload.waste_weight = this.selectedBatch.totalInputKG - this.sumTotalKG
        }
        const { error: batchErr } = await supabase
          .from('production_batches')
          .update(updatePayload)
          .eq('id', batchId)
        if (batchErr) throw batchErr
        // Delete old outputs
        const { error: delErr } = await supabase
          .from('production_outputs')
          .delete()
          .eq('batch_id', batchId)
        if (delErr) throw delErr
        // Insert new outputs
        const outputs = this.mapFormToOutputs(this.outputForm.productTypePayload)
        if (outputs.length > 0) {
          const inserts = outputs
            .map((out) => {
              const pt = this.productTypes.find(
                (p) =>
                  (p.name === out.type || p.category === out.type) &&
                  Number(p.unit_weight) === out.weightKg &&
                  p.is_grassy === out.isGrassy
              )
              return {
                batch_id: batchId,
                product_type_id: pt ? pt.id : null,
                quantity: out.quantity,
                total_weight: out.quantity * out.weightKg
              }
            })
            .filter((o) => o.product_type_id !== null)
          if (inserts.length > 0) {
            const { error: insErr } = await supabase.from('production_outputs').insert(inserts)
            if (insErr) throw insErr
          }
        }
        this.$notify({
          title: 'Başarılı',
          type: 'success',
          message: 'Üretim çıktıları kaydedildi!',
          duration: 3000,
          position: 'top-right'
        })
        this.outputDialogVisible = false
        await this.fetchAllProductions()
      } catch (err) {
        console.error(err)
        this.$message.error('Çıktılar kaydedilirken hata oluştu.')
      }
    },

    // === MAPPERS ===
    mapOutputToForm(outputList) {
      const payload = {
        herbTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0 },
        plainTulum: { kg1: 0, kg2: 0, kg3: 0, kg5: 0, kg10: 0, kg25: 0 },
        plainBrine: { kg2: 0, kg3: 0, kg5: 0 },
        herbBrine: { kg2: 0, kg3: 0, kg5: 0 }
      }
      outputList?.forEach((item) => {
        const type = (item.type || '').toString()
        const isGrassy = !!item.isGrassy
        const weightKg = Number(item.weightKg)
        const quantity = Number(item.quantity)
        const key = `kg${weightKg}`

        if (type.includes('Tulum')) {
          if (isGrassy) payload.herbTulum[key] = quantity
          else payload.plainTulum[key] = quantity
        } else if (type.includes('Salamura')) {
          if (isGrassy) payload.herbBrine[key] = quantity
          else payload.plainBrine[key] = quantity
        }
      })
      return payload
    },
    getSummary({ columns }) {
      const data = this.filteredData
      const totalInputKG = data.reduce((s, r) => s + (r.totalInputKG || 0), 0)
      const totalCost = data.reduce((s, r) => s + (r.totalCost || 0), 0)
      const totalWasteKG = data
        .filter((r) => r.isCompleted && r.totalWasteKG !== null)
        .reduce((s, r) => s + r.totalWasteKG, 0)
      const avgUnitCost = totalInputKG > 0 ? totalCost / totalInputKG : 0

      const colMap = {
        totalInputKG: `${this.$options.filters.formatNumber(totalInputKG)} kg`,
        totalCost: `${this.$options.filters.formatNumber(totalCost)} ₺`,
        totalWasteKG: `${this.$options.filters.formatNumber(totalWasteKG)} kg`,
        unitCostPerKg:
          avgUnitCost > 0 ? `Ort: ${this.$options.filters.formatNumber(avgUnitCost)} ₺` : '-'
      }

      return columns.map((col) => {
        if (col.property === 'batchName') return 'Toplam'
        return colMap[col.property] || ''
      })
    },
    mapFormToOutputs(ptp) {
      const outputs = []
      const push = (obj, type, isGrassy) => {
        Object.entries(obj).forEach(([k, q]) => {
          if (q > 0)
            outputs.push({ type, weightKg: Number(k.replace('kg', '')), quantity: q, isGrassy })
        })
      }
      push(ptp.plainTulum, 'Tulum', false)
      push(ptp.herbTulum, 'Tulum', true)
      push(ptp.plainBrine, 'Salamura', false)
      push(ptp.herbBrine, 'Salamura', true)
      return outputs
    }
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
.sub-detail {
  padding: 10px 20px;
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    h4 {
      margin: 0;
    }
  }
}
::v-deep {
  .noresize textarea {
    resize: none !important;
    font-family: Arial, Helvetica, sans-serif;
  }
}
.info-text {
  font-size: 13px;
  color: #909399;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
