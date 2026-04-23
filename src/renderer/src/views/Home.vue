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
      <apexchart :key="chartKey" type="donut" height="320" :options="chartOptions2" :series="series2"> </apexchart>
      <apexchart :key="chartKey" type="donut" height="320" :options="chartOptions1" :series="series1"> </apexchart>
      <apexchart :key="chartKey" type="donut" height="320" :options="chartOptions4" :series="series4"> </apexchart>
      <apexchart :key="chartKey" type="donut" height="320" :options="chartOptions3" :series="series3"> </apexchart>
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
        <template v-slot="scope"> {{ scope.row.averagePrice | formatNumber }} ₺ </template>
      </el-table-column>
      <el-table-column prop="createdDate" label="Oluşturulma Tarihi" sortable>
        <template v-slot="scope">
          {{ scope.row.createdDate | formatDateWithClock }}
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="İşlem" width="308">
        <template v-slot="scope">
          <el-tooltip
            class="item"
            effect="dark"
            :content="`${scope.row.name.split(' ')[0]} Üretimlerini Gör`"
            placement="top-start"
          >
            <el-button
              type="info"
              size="small"
              icon="el-icon-notebook-2"
              @click="handleClick('Manufacture', scope.row.id)"
              >Üretimleri Gör</el-button
            >
          </el-tooltip>
          <el-tooltip
            class="item"
            effect="dark"
            :content="`${scope.row.name.split(' ')[0]} Cari İşlemlerini Gör`"
            placement="top-start"
          >
            <el-button
              type="success"
              size="small"
              icon="el-icon-notebook-2"
              @click="handleClick('Accounting', scope.row.id)"
              >Cari İşlemlerini Gör</el-button
            >
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      background
      layout="prev, pager, next"
      :total="seasonSummaries?.length"
      :page-size="pageSize"
      :current-page="currentPage"
      @current-change="handlePageChange"
      style="margin-top: 20px; text-align: center"
    />
  </el-card>
  <!-- </div> -->
</template>
  
<script>
import VueApexCharts from 'vue-apexcharts'
import { formatNumber } from '../utils/helpers'
import { supabase } from '../utils/supabase'
import globalMixin from '../mixin/global.mixin.js'

export default {
  name: 'Homepage',
  components: { apexchart: VueApexCharts },
  mixins: [globalMixin],
  data() {
    return {
      currentPage: 1,
      pageSize: 10,
      chartKey: 0,
      summaryData: {
        totalProducedKg: 0,
        unprocessedKg: 0,
        reservedKg: 0,
        totalLossKg: 0,
        customerCount: 0
      },
      seasonSummaries: [],
      unitSets: {
        tulum: [1, 2, 3, 5, 10, 25],
        salamura: [2, 3, 5]
      },
      widgets: [
        {
          id: 1,
          title: 'MEVCUT STOK',
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
        }
      ],
      series1: [0, 0, 0, 0],
      chartOptions1: {
        chart: {
          type: 'donut',
          height: 320
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
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: { width: 200 },
              legend: { position: 'bottom' }
            }
          }
        ],
        plotOptions: {
          pie: {
            customScale: 0.8,
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
                    return (
                      w.globals.seriesTotals?.reduce((a, b, i) => {
                        const units = [1, 2, 3, 5]
                        return a + b * units[i]
                      }, 0) + ' KG'
                    )
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: false,
          formatter: function (val) {
            return val
          }
        }
      },
      series2: [0, 0, 0, 0, 0, 0],
      chartOptions2: {
        chart: {
          type: 'donut',
          height: 320
        },
        colors: ['#d1beb0', '#AFC97E', '#9DB5B2', '#918450', '#7f8c8d', '#2c3e50'],
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
        labels: ['1KG', '2KG', '3KG', '5KG', '10KG', '25KG'],
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: { width: 200 },
              legend: { position: 'bottom' }
            }
          }
        ],
        plotOptions: {
          pie: {
            customScale: 0.8,
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
                    const units = [1, 2, 3, 5, 10, 25]
                    return w.globals.seriesTotals?.reduce((a, b, i) => a + b * units[i], 0) + ' KG'
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: false,
          formatter: function (val) {
            return val
          }
        }
      },
      series3: [0, 0, 0],
      chartOptions3: {
        chart: {
          type: 'donut',
          height: 320
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
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: { width: 200 },
              legend: { position: 'bottom' }
            }
          }
        ],
        plotOptions: {
          pie: {
            customScale: 0.8,
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
                      salamura: [2, 3, 5]
                    }
                    return (
                      w.globals.seriesTotals?.reduce((a, b, i) => a + b * unitSets.salamura[i], 0) +
                      ' KG'
                    )
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: false,
          formatter: function (val) {
            return val
          }
        }
      },
      series4: [0, 0, 0],
      chartOptions4: {
        chart: {
          type: 'donut',
          height: 320
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
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: { width: 200 },
              legend: { position: 'bottom' }
            }
          }
        ],
        plotOptions: {
          pie: {
            customScale: 0.8,
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
                      salamura: [2, 3, 5]
                    }
                    return (
                      w.globals.seriesTotals?.reduce((a, b, i) => a + b * unitSets.salamura[i], 0) +
                      ' KG'
                    )
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: false,
          formatter: function (val) {
            return val
          }
        }
      },
      series5: [0],
      chartOptions5: {
        chart: {
          type: 'pie'
        },
        labels: ['Salamura'],
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: { width: 200 },
              legend: { position: 'bottom' }
            }
          }
        ],
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
          formatter: function (val) {
            return val
          }
        }
      },
      series6: [80],
      chartOptions6: {
        chart: {
          type: 'pie'
        },
        labels: ['Sade Peynir'],
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: { width: 200 },
              legend: { position: 'bottom' }
            }
          }
        ],
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
          formatter: function (val) {
            return val
          }
        }
      }
    }
  },
  async mounted() {
    await this.fetchDashboardData()
    await this.fetchChartData()
    await this.fetchSeasonSummaries()
  },
  computed: {
    getSummaryValue() {
      return (widget) =>
        `${formatNumber(this.summaryData[widget?.value] || 0)} ${widget?.id != 5 ? 'KG' : ''}` || ''
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.seasonSummaries?.slice(start, end)
    }
  },
  methods: {
    async fetchDashboardData() {
      // 1. Toplam Üretilen (KG bazında)
      const { data: outputs } = await supabase
        .from('production_outputs')
        .select('quantity, product:product_types!inner(unit_weight, tenant_id)')
        .eq('product_types.tenant_id', this.currentTenantId)
      
      const totalProduced = outputs?.reduce((s, o) => {
        const weight = o.product?.unit_weight || 0
        return s + (o.quantity * weight)
      }, 0) || 0

      console.log('Dashboard Üretim Verisi:', outputs?.length, 'Toplam KG:', totalProduced)

      // 2. Toplam Teslim Edilen (Satılan KG)
      const { data: deliveries } = await supabase
        .from('customer_deliveries')
        .select('total_weight_delivered')
        .eq('tenant_id', this.currentTenantId)
      const totalDelivered =
        deliveries?.reduce((s, d) => s + (d.total_weight_delivered || 0), 0) || 0

      // 3. Mevcut Stok (Üretilen - Teslim Edilen)
      this.summaryData.totalProducedKg = totalProduced - totalDelivered

      // 4. Rezerve Edilen Ürün (Müşteri Kotaları Toplamı)
      const { data: balances } = await supabase
        .from('customer_balances')
        .select('total_kg_quota')
        .eq('tenant_id', this.currentTenantId)
      this.summaryData.reservedKg = balances?.reduce((s, b) => s + (b.total_kg_quota || 0), 0) || 0

      // 5. İşlenmemiş Ürün (Devam Edenler)
      const { data: pending } = await supabase
        .from('production_batches')
        .select('inputs:production_inputs(input_weight)')
        .eq('is_completed', false)
        .eq('tenant_id', this.currentTenantId)
      this.summaryData.unprocessedKg =
        pending?.reduce((s, b) => {
          const batchInput = b.inputs?.reduce((is, i) => is + (i.input_weight || 0), 0) || 0
          return s + batchInput
        }, 0) || 0

      // 6. Toplam Fire
      const { data: batches } = await supabase
        .from('production_batches')
        .select('waste_weight')
        .eq('tenant_id', this.currentTenantId)
      this.summaryData.totalLossKg = batches?.reduce((s, b) => s + (b.waste_weight || 0), 0) || 0

      // 7. Müşteri Sayısı
      const { count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', this.currentTenantId)
      this.summaryData.customerCount = count || 0
    },
    async fetchChartData() {
      // Üretim Çıktıları
      const { data: prodData } = await supabase
        .from('production_outputs')
        .select('quantity, product:product_types!inner(*)')
        .eq('product_types.tenant_id', this.currentTenantId)

      // Teslim Edilenler
      const { data: delData } = await supabase
        .from('customer_delivery_items')
        .select('quantity, product:product_types!inner(*)')
        .eq('product_types.tenant_id', this.currentTenantId)

      console.log('Ham Veriler:', { prod: prodData, del: delData })

      const series = {
        otluTulum: { 1: 0, 2: 0, 3: 0, 5: 0 },
        sadeTulum: { 1: 0, 2: 0, 3: 0, 5: 0, 10: 0, 25: 0 },
        otluSalamura: { 2: 0, 3: 0, 5: 0 },
        sadeSalamura: { 2: 0, 3: 0, 5: 0 }
      }

      const processItem = (item, isAddition) => {
        const p = item.product
        if (!p) return
        const isGrassy = p.is_grassy || false
        const key = isGrassy ? 'otlu' : 'sade'
        const pCategory = (p.category || '').toLowerCase()

        let type = ''
        if (pCategory.includes('tulum')) type = 'Tulum'
        else if (pCategory.includes('salamura')) type = 'Salamura'

        const target = `${key}${type}`
        const uWeight = parseInt(p.unit_weight)
        
        if (series[target] && series[target][uWeight] !== undefined) {
          const qty = parseInt(item.quantity || 0)
          if (isAddition) series[target][uWeight] += qty
          else series[target][uWeight] -= qty
        }
      }

      prodData?.forEach((item) => processItem(item, true))
      delData?.forEach((item) => processItem(item, false))

      this.series1 = Object.values(series.otluTulum)
      this.series2 = Object.values(series.sadeTulum)
      this.series3 = Object.values(series.otluSalamura)
      this.series4 = Object.values(series.sadeSalamura)
      this.chartKey++
    },
    async fetchSeasonSummaries() {
      const { data } = await supabase
        .from('seasons')
        .select(
          `
        id, name, created_at,
        batches:production_batches(
          output_weight, waste_weight, is_completed,
          inputs:production_inputs(input_weight, total_purchase_amount)
        )
      `
        )
        .eq('tenant_id', this.currentTenantId)
        .order('created_at', { ascending: false })

      this.seasonSummaries =
        data?.map((s) => {
          let totalInput = 0
          let totalOutput = 0
          let totalLoss = 0
          let totalCost = 0

          s.batches?.forEach((b) => {
            const bInput = b.inputs?.reduce((sum, i) => sum + (i.input_weight || 0), 0) || 0
            const bCost = b.inputs?.reduce((sum, i) => sum + (i.total_purchase_amount || 0), 0) || 0
            totalInput += bInput
            totalCost += bCost
            if (b.is_completed) {
              totalOutput += b.output_weight || 0
              totalLoss += b.waste_weight || 0
            }
          })

          return {
            id: s.id,
            name: s.name,
            totalInputWeight: totalInput,
            totalOutputWeight: totalOutput,
            lossKg: totalLoss,
            averagePrice: totalOutput > 0 ? totalCost / totalOutput : 0,
            createdDate: s.created_at
          }
        }) || []
    },
    handleClick(name, seasonId) {
      this.$router.push({ name, params: { season: seasonId } })
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    chartSeries() {
      const seriesMap = {
        series1: { key: 'otluTulum', type: 'tulum' },
        series2: { key: 'sadeTulum', type: 'tulum' },
        series3: { key: 'otluSalamura', type: 'salamura' },
        series4: { key: 'sadeSalamura', type: 'salamura' }
      }

      Object.entries(seriesMap).forEach(([seriesName, { key, type }]) => {
        const baseUnits = this.unitSets[type]
        const stockSeries = this.getGroupedStockList[key].series

        this[seriesName] = stockSeries.map((value, i) => (baseUnits[i] ? value / baseUnits[i] : 0))
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

        const isKgColumn = column?.property && column.property.toLowerCase().includes('kg')

        if (isKgColumn) {
          const total = data?.reduce((prev, curr) => {
            const value = Number(curr[column.property])
            return !isNaN(value) ? prev + value : prev
          }, 0)

          sums[index] = formatNumber(total) + ' KG'
        } else {
          sums[index] = ''
        }
      })

      return sums
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
  