<template>
  <!-- <div class="home-wrapper"> -->
    <el-card class="card-view box-card">
      <div class="widgets-container">
        <div
          class="widget"
          v-for="widget in widgets"
          :key="widget.id"
          :style="{ background: widget.bg }"
        >
          <h3>{{ widget.title }}</h3>
          <p>{{ getSummaryValue(widget) }}</p>
        </div>
      </div>
      <div class="charts-container">
        <apexchart
          type="donut"
          :options="chartOptions2"
          :series="series2">
        </apexchart>
        <apexchart
          type="donut"
          :options="chartOptions1"
          :series="series1">
        </apexchart>
        <apexchart
          type="donut"
          :options="chartOptions4"
          :series="series4">
        </apexchart>
        <apexchart
          type="donut"
          :options="chartOptions3"
          :series="series3">
        </apexchart>
        <!-- <apexchart
          type="pie"
          :options="chartOptions6"
          :series="series6">
        </apexchart> -->
      </div>

      <el-table
        :data="paginatedData"
        border
        show-summary
        :summary-method="getSummaries"
        style="width: 100%"
      >
        <!-- <el-table-column prop="id" label="ID" width="180"> </el-table-column> -->
        <el-table-column prop="name" label="Sezon İsmi" sortable></el-table-column>
        <el-table-column prop="totalInputWeight" label="Alınan(kg)" sortable>
          <template v-slot="scope">
            {{ scope.row.totalInputWeight | formatNumber }}
          </template>
        </el-table-column>
        <el-table-column prop="totalOutputWeight" label="Üretilen(kg)" sortable>
          <template v-slot="scope">
            {{ scope.row.totalOutputWeight | formatNumber }}
          </template>
        </el-table-column>
        <el-table-column prop="lossKg" label="Fire(kg)" sortable>
          <template v-slot="scope">
            {{ scope.row.lossKg | formatNumber }}
          </template>
        </el-table-column>
        <el-table-column prop="averagePrice" label="Ortalama Maliyet" sortable>
          <template v-slot="scope">
            {{ scope.row.averagePrice | formatNumber }} ₺
          </template>
        </el-table-column>
        <el-table-column prop="createdDate" label="Oluşturulma Tarihi" sortable>
          <template v-slot="scope">
            {{ scope.row.createdDate | formatDateWithClock }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="İşlem" width="308">
          <template v-slot="scope">
            <el-tooltip class="item" effect="dark" :content="`${scope.row.name.split(' ')[0]} Üretimlerini Gör`" placement="top-start">
              <el-button type="info" size="small" icon="el-icon-notebook-2" @click="handleClick('Manufacture', scope.row.id)">Üretimleri Gör</el-button>
            </el-tooltip>
            <el-tooltip class="item" effect="dark" :content="`${scope.row.name.split(' ')[0]} Cari İşlemlerini Gör`" placement="top-start">
              <el-button type="success" size="small" icon="el-icon-notebook-2" @click="handleClick('Accounting', scope.row.id)">Cari İşlemlerini Gör</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        background
        layout="prev, pager, next"
        :total="getSeasonWithProductList?.length"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
        style="margin-top: 20px; text-align: center"
      />
    </el-card>
  <!-- </div> -->
</template>
  
<script>
import VueApexCharts from 'vue-apexcharts';
import { formatNumber } from '../utils/helpers';
import { mapGetters, mapActions } from 'vuex';
import globalMixin from '../mixin/global.mixin.js';

export default {
  name: 'Homepage',
  components: { apexchart: VueApexCharts },
  mixins: [globalMixin],
  data() {
    return {
      currentPage: 1,
      pageSize: 10,
      dialogVisible: false,
      editingSeason: false,
      unitSets: {
        tulum: [1, 2, 3, 5],
        salamura: [2, 3, 5],
      },
      widgets: [
        {
          id: 1,
          title: 'TOPLAM ÜRÜN',
          value: 'totalProducedKg',
          bg: 'linear-gradient(45deg, #2c3e50 0%, hsla(211, 36%, 46%, 1) 100%)'
        },
        {
          id: 2,
          title: 'İŞLENMEMİŞ ÜRÜN',
          value: 'unprocessedKg',
          bg: 'linear-gradient(45deg, #2c3e50 0%, hsla(211, 36%, 46%, 1) 100%)'
        },
        {
          id: 3,
          title: 'REZERVE EDİLEN ÜRÜN',
          value: 'reservedKg',
          bg: 'linear-gradient(45deg, #2c3e50 0%, hsla(211, 36%, 46%, 1) 100%)'
        },
        {
          id: 4,
          title: 'TOPLAM FİRE',
          value: 'totalLossKg',
          bg: 'linear-gradient(45deg, #2c3e50 0%, hsla(211, 36%, 46%, 1) 100%)'
        },
        {
          id: 5,
          title: 'MÜŞTERİ SAYISI',
          value: 'customerCount',
          bg: 'linear-gradient(45deg, #2c3e50 0%, hsla(211, 36%, 46%, 1) 100%)'
        },
      ],
      series1: [0, 0, 0, 0],
      chartOptions1: {
        chart: {
          type: 'donut',
        },
        colors: ['#d1beb0', '#AFC97E', '#9DB5B2', '#918450'],
        title: {
          text: 'Otlu Tulum',
          align: 'center',
          style: {
            fontSize: '16px',
            fontWeight: 'bold'
          }
        },
        legend: {
          show: true,
          position: 'bottom',
          horizontalAlign: 'center'
        },
        labels: ['1KG', '2KG', '3KG', '5KG'],
        responsive: [{
          breakpoint: 480,
          options: {
            chart: { width: 200 },
            legend: { position: 'bottom' }
          }
        }],
        plotOptions: {
          pie: {
            donut: {
              size: '80%',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '16px',
                  color: '#000'
                },
                value: {
                  show: true,
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#000',
                  formatter: function (val, b) {
                    return val + ' Adet'
                  }
                },
                total: {
                  show: true,
                  label: 'Toplam',
                  formatter: function (w) {
                    const unitSets = {
                      tulum: [1, 2, 3, 5],
                      salamura: [2, 3, 5],
                    }
                    return w.globals.seriesTotals?.reduce((a, b, i) => a + (b * unitSets.tulum[i]), 0) + ' KG';
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: false,
          formatter: function(val) {
            return val
          }
        },
      },
      series2: [0, 0, 0, 0],
      chartOptions2: {
        chart: {
          type: 'donut'
        },
        colors: ['#d1beb0', '#AFC97E', '#9DB5B2', '#918450'],
        title: {
          text: 'Sade Tulum',
          align: 'center',
          style: {
            fontSize: '16px',
            fontWeight: 'bold'
          }
        },
        legend: {
          show: true,
          position: 'bottom',
          horizontalAlign: 'center'
        },
        labels: ['1KG', '2KG', '3KG', '5KG'],
        responsive: [{
          breakpoint: 480,
          options: {
            chart: { width: 200 },
            legend: { position: 'bottom' }
          }
        }],
        plotOptions: {
          pie: {
            donut: {
              size: '80%',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '16px',
                  color: '#000'
                },
                value: {
                  show: true,
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#000',
                  formatter: function (val) {
                    return val + ' Adet'
                  }
                },
                total: {
                  show: true,
                  label: 'Toplam',
                  formatter: function (w) {
                    const unitSets = {
                      tulum: [1, 2, 3, 5],
                      salamura: [2, 3, 5],
                    }
                    return w.globals.seriesTotals?.reduce((a, b, i) => a + (b * unitSets.tulum[i]), 0) + ' KG';
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: false,
          formatter: function(val) {
            return val
          }
        },
      },
      series3: [0, 0, 0],
      chartOptions3: {
        chart: {
          type: 'donut'
        },
        colors: ['#d1beb0', '#AFC97E', '#9DB5B2', '#918450'],
        title: {
          text: 'Otlu Salamura',
          align: 'center',
          style: {
            fontSize: '16px',
            fontWeight: 'bold'
          }
        },
        legend: {
          show: true,
          position: 'bottom',
          horizontalAlign: 'center'
        },
        labels: ['2KG', '3KG', '5KG'],
        responsive: [{
          breakpoint: 480,
          options: {
            chart: { width: 200 },
            legend: { position: 'bottom' }
          }
        }],
        plotOptions: {
          pie: {
            donut: {
              size: '80%',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '16px',
                  color: '#000'
                },
                value: {
                  show: true,
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#000',
                  formatter: function (val) {
                    return val + ' Adet'
                  }
                },
                total: {
                  show: true,
                  label: 'Toplam',
                  formatter: function (w) {
                    const unitSets = {
                      tulum: [1, 2, 3, 5],
                      salamura: [2, 3, 5],
                    }
                    return w.globals.seriesTotals?.reduce((a, b, i) => a + (b * unitSets.salamura[i]), 0) + ' KG';
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: false,
          formatter: function(val) {
            return val
          }
        },
      },
      series4: [0, 0, 0],
      chartOptions4: {
        chart: {
          type: 'donut'
        },
        colors: ['#d1beb0', '#AFC97E', '#9DB5B2', '#918450'],
        title: {
          text: 'Sade Salamura',
          align: 'center',
          style: {
            fontSize: '16px',
            fontWeight: 'bold'
          }
        },
        legend: {
          show: true,
          position: 'bottom',
          horizontalAlign: 'center'
        },
        labels: ['2KG', '3KG', '5KG'],
        responsive: [{
          breakpoint: 480,
          options: {
            chart: { width: 200 },
            legend: { position: 'bottom' }
          }
        }],
        plotOptions: {
          pie: {
            donut: {
              size: '80%',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '16px',
                  color: '#000'
                },
                value: {
                  show: true,
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#000',
                  formatter: function (val) {
                    return val + ' Adet'
                  }
                },
                total: {
                  show: true,
                  label: 'Toplam',
                  formatter: function (w) {
                    const unitSets = {
                      tulum: [1, 2, 3, 5],
                      salamura: [2, 3, 5],
                    }
                    return w.globals.seriesTotals?.reduce((a, b, i) => a + (b * unitSets.salamura[i]), 0) + ' KG';
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: false,
          formatter: function(val) {
            return val
          }
        },
      },
      series5: [0],
      chartOptions5: {
        chart: {
          type: 'pie'
        },
        labels: ['Salamura'],
        responsive: [{
          breakpoint: 480,
          options: {
            chart: { width: 200 },
            legend: { position: 'bottom' }
          }
        }],
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '16px',
                  color: '#fff'
                },
                value: {
                  show: true,
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#fff',
                  formatter: function (val) {
                    return val + ' Adet'
                  }
                },
                total: {
                  show: true,
                  label: 'Toplam',
                  formatter: function (w) {
                    return w.globals.seriesTotals?.reduce((a, b) => a + b, 0)
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: false,
          formatter: function(val) {
            return val
          }
        },
      },
      series6: [80],
      chartOptions6: {
        chart: {
          type: 'pie'
        },
        labels: ['Sade Peynir'],
        responsive: [{
          breakpoint: 480,
          options: {
            chart: { width: 200 },
            legend: { position: 'bottom' }
          }
        }],
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '16px',
                  color: '#fff'
                },
                value: {
                  show: true,
                  fontSize: '15px',
                  fontWeight: 'bold',
                  color: '#fff',
                  formatter: function (val) {
                    return val + ' Adet'
                  }
                },
                total: {
                  show: true,
                  label: 'Toplam',
                  formatter: function (w) {
                    return w.globals.seriesTotals?.reduce((a, b) => a + b, 0)
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: false,
          formatter: function(val) {
            return val
          }
        },
      },
    }
  },
  async mounted() {
    this.getUserDetails(this.getUser.id)
    await this.fetchSummary();
    await this.fetchAllStocks();
    this.chartSeries();
    /* const unitsV1 = [1, 2, 3, 5];
    const unitsV2 = [2, 3, 5];
    this.series1 = this.getGroupedStockList.otluTulum.series.map((unit, i) => unit / unitsV1[i]);
    this.series2 = this.getGroupedStockList.sadeTulum.series.map((unit, i) => unit / unitsV1[i])
    this.series3 = this.getGroupedStockList.otluSalamura.series.map((unit, i) => unit / unitsV2[i]);
    this.series4 = this.getGroupedStockList.sadeSalamura.series.map((unit, i) => unit / unitsV2[i]); */

  },
  computed: {
    ...mapGetters({
      getRefreshToken: 'auth/getRefreshToken',
      getSummary: 'product/getSummary',
      getStockList: 'stock/getStockList',
      getGroupedStockList: 'stock/getGroupedStockList',
      getUser: 'auth/getUser',
    }),
    getSummaryValue() {
      return widget => `${this.getSummary[widget?.value]} ${widget?.id != 5 ? 'KG' : ''}` || '';
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.getSeasonWithProductList?.slice(start, end);
    },
  },
  methods: {
    ...mapActions({
      fetchSummary: 'product/fetchSummary',
      fetchAllStocks: 'stock/fetchAllStocks',
      getUserDetails: 'user/getUserDetails',
    }),
    handleClick(name, seasonId) {
      this.$router.push({ name, params: { season: seasonId }});
    },
    handlePageChange(page) {
      this.currentPage = page;
    },
    chartSeries() {
      const seriesMap = {
        series1: { key: "otluTulum", type: "tulum" },
        series2: { key: "sadeTulum", type: "tulum" },
        series3: { key: "otluSalamura", type: "salamura" },
        series4: { key: "sadeSalamura", type: "salamura" },
      };

      Object.entries(seriesMap).forEach(([seriesName, { key, type }]) => {
        const baseUnits = this.unitSets[type];
        const stockSeries = this.getGroupedStockList[key].series;

        this[seriesName] = stockSeries.map((value, i) => 
          baseUnits[i] ? value / baseUnits[i] : 0
        );
      });
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
          const values = this.getSeasonWithProductList?.map(item => Number(item[column.property]));
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
    }
  }
}
</script>
  
<style lang="scss">
/* .home-wrapper {
  display: flex;
  gap: 50px;
  flex-direction: column;
} */
.widgets-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
}
.charts-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 28px;
}
.apexcharts-canvas {
  max-width: 270px !important;
  width: 100%;
}
.widget {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1 1 113px;
  height: 175px;
  min-width: 113px;
  color: #fff;
  padding: 12px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;

  h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
    letter-spacing: 1px;
  }

  p {
    margin: 0;
    font-size: 22px;
    font-weight: bold;
    display: flex;
    justify-content: center;
    gap: 5px;
  }

  &:hover {
    transform: translateY(-5px);
  }
}
</style>
  