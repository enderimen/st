import http from '../http'

const state = {
  productionList: null
}

const getters = {
  getProductionList: state => state.productionList,
}

const mutations = {
  SET_SUMMARY(state, summary) {
    state.summary = summary
  },
  SET_PRODUCTION_LIST(state, productionList) {
    state.productionList = productionList
  },
  DELETE_PRODUCTION(state, productionId) {
    state.productionList = state.productionList.filter(production => production.id !== productionId);
  },
  UPDATE_PRODUCTION(state, updatedProduction) {
    const index = state.productionList.findIndex(production => production.id === updatedProduction.id);
    if (index !== -1) {
      state.productionList.splice(index, 1, updatedProduction);
    }
  },
  ADD_NEW_PRODUCTION(state, newProduction) {
    state.productionList.push(newProduction);
  }
}

const actions = {
  async fetchAllProductions({ commit }) {
    try {
        const { data } = await http.get('/RawMaterialBatch');

        const mappedData = data.map(production => ({
          id: production.id,
          seasonId: production.seasonId,
          vendorId: production.vendorId,
          season: production.seasonName,
          vendor: production.vendorName,
          receivedDate: production.dateReceived,
          completedDate: production.outputDate,
          purchasedKG: production.inputQuantity,
          cost: production.totalAmount,
          producedKG: production.totalOutputQuantity,
          lossKG: production.lossKg,
          unitAmount: production.notes,
          desc: production.notes,
          outputList: production.outputs
        }));

        commit('SET_PRODUCTION_LIST', mappedData);
        return data
    }
    catch (err) {
        throw err
    }
  },
  async deleteProduction({ commit }, productionId) {
    await http.delete(`/RawMaterialBatch/${productionId}`).then(() => {
        commit('DELETE_PRODUCTION', productionId);
    }).catch(err => {
        throw err
    });
  },
  async updateProduction({ commit }, production) {
    await http.put(`/RawMaterialBatch/update-production/${production.id}`, production)
      .then((response) => {
        const mappedData = [response.data].map(production => ({
          id: production.id,
          season: production.seasonName,
          vendor: production.vendorName,
          receivedDate: production.dateReceived,
          completedDate: production.outputDate,
          purchasedKG: production.inputQuantity,
          cost: production.totalAmount,
          producedKG: production.totalOutputQuantity,
          lossKG: production.lossKg,
          desc: production.notes,
          unitAmount: production.notes,
          outputList: production.outputs
        }));

        commit('UPDATE_PRODUCTION', mappedData[0]);
      })
      .catch(err => { 
        throw err 
      });
  },
  async addNewProduction({ commit }, production) {
    await http.post('/RawMaterialBatch', production)
    .then((response) => {
      const mappedData = [response.data].map(production => ({
        id: production.id,
        season: production.seasonName,
        vendor: production.vendorName,
        receivedDate: production.dateReceived,
        completedDate: production.outputDate,
        purchasedKG: production.inputQuantity,
        cost: production.totalAmount,
        producedKG: production.totalOutputQuantity,
        lossKG: production.lossKg,
        desc: production.notes,
        unitAmount: production.notes,
        outputList: production.outputs
      }));
      
      commit('ADD_NEW_PRODUCTION', mappedData[0]);
    })
    .catch(err => { 
      throw err 
    });
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}