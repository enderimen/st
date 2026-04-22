import http from '../http'

const state = {
    stockList: null,
    groupedList: null
}

const getters = {
  getStockList: state => state.stockList,
  getGroupedStockList: state => state.groupedList,
}

const mutations = {
    SET_STOCK_LIST(state, stockList) {
        state.stockList = stockList;
    },
    SET_CHART_DATA(state, groupedList) {
        state.groupedList = groupedList;
    },
}

const actions = {
  async fetchAllStocks({ commit }) {
    try {
      const { data } = await http.get('/StockItem');
      const outputs = data[0].outputs || [];
  
      function prepareChartData(outputs, productType, isGrassy, allWeights) {
        const filtered = outputs.filter(
          x => x.type === productType && x.isGrassy === isGrassy
        );
  
        const grouped = filtered.reduce((acc, cur) => {
          const key = Number(cur.weightKg);
          if (!acc[key]) acc[key] = 0;
          acc[key] += cur.quantity * cur.weightKg;
          return acc;
        }, {});
  
        const labels = allWeights.map(w => w + 'KG');
        const series = allWeights.map(w => grouped[w] || 0);
  
        return { labels, series };
      }
  
      const tulumWeights = [1, 2, 3, 5];
      const salamuraWeights = [2, 3, 5];
  
      const chartData = {
        otluTulum: prepareChartData(outputs, 'Tulum', true, tulumWeights),
        sadeTulum: prepareChartData(outputs, 'Tulum', false, tulumWeights),
        otluSalamura: prepareChartData(outputs, 'Salamura', true, salamuraWeights),
        sadeSalamura: prepareChartData(outputs, 'Salamura', false, salamuraWeights)
      };
  
      commit('SET_STOCK_LIST', data);
      commit('SET_CHART_DATA', chartData);
  
      return data;
    } catch (err) {
      throw err;
    }
  }  
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}