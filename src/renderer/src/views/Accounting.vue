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

    <div v-if="loading" style="padding: 20px">
      <el-skeleton :rows="10" animated />
    </div>
    <el-table
      v-else
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
          <template v-if="scope.row.remainingKg > 0">
            <p style="font-weight: bold">{{ scope.row.remainingKg }}</p>
          </template>
          <el-tag v-else-if="scope.row.remainingKg == 0" type="success">
            Tamamı Teslim Edildi
          </el-tag>
          <el-tag v-else type="danger"> Kota Aşımı: {{ scope.row.remainingKg }} </el-tag>
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

    <!-- Cari Düzenleme Artık Customers.vue üzerinden yapılıyor -->
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
      loading: false,
      dialogVisible: false,
      currentPage: 1,
      pageSize: 8,
      filter: {
        search: '',
        season: '',
        receivedDate: '',
        isClosing: 'Tümü'
      },
      customerBalanceList: []
    }
  },
  async mounted() {
    await this.getAllCustomerBalance()

    this.filter.season = this.$route.params?.season || ''
    this.filter.search = this.$route.params?.customerName || ''
  },
  computed: {
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
        const dateA = new Date(a.createdAt)
        const dateB = new Date(b.createdAt)
        return dateB - dateA // büyükten küçüğe
      })
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredData?.slice(start, end)
    }
  },
  methods: {
    handleClick(row) {
      this.$router.push({ name: 'AccountingProcess', params: { user: row } })
    },
    useBalance(row) {
      this.$router.push({ name: 'AccountingProcess', params: { type: 'add', user: row } })
    },
    async getAllCustomerBalance() {
      this.loading = true
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
        isClosing: !!item.is_closed, // Bakiye bazlı kapanış bilgisini kullan ve null ise false (Aktif) kabul et
        createdAt: item.created_at,
        hasTransaction: true // Detay ekranı için
      }))
      this.loading = false
    },
    isOpenDialog(type, row) {
      // Yönlendirme yaparak Customers.vue daki dialogu açtırıyoruz
      this.$router.push({
        name: 'Customers',
        params: {
          customerId: row.customerId
        }
      })
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
            .from('customer_balances')
            .update({ is_closed: type === 'close' })
            .eq('id', row.id)

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
      const { columns, data } = param
      const sums = []

      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = 'Toplam'
          return
        }

        // sadece 'kg' içeren kolonlar için toplam hesapla
        const isKgColumn = column.property === 'totalKg' || column.property === 'remainingKg'
        if (isKgColumn) {
          const values = data.map((item) => Number(item[column.property]))
          if (!values.every((value) => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr)
              if (!isNaN(value)) {
                return prev + curr
              } else {
                return prev
              }
            }, 0)
          } else {
            sums[index] = 'N/A'
          }
        } else {
          sums[index] = ''
        }
      })

      return sums
    }
  }
}
</script>          column?.property &&
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