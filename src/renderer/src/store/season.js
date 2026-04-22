import http from '../http'

const state = {
  seasonList: null
}

const getters = {
  getSeasonWithProductList: state => state.seasonList,
  getSeasonList(state) {
    return state.seasonList?.map(season => {
      return {
        value: season?.id?.toString(),
        label: season.name
      }
    }) || [];
  },
}

const mutations = {
  SET_SUMMARY(state, summary) {
    state.summary = summary
  },
  SET_SEASON_LIST(state, seasonList) {
    state.seasonList = seasonList
  },
  DELETE_SEASON(state, seasonId) {
    state.seasonList = state.seasonList?.filter(season => season.id != seasonId);
  },
  UPDATE_SEASON(state, updatedSeason) {
    const index = state.seasonList?.findIndex(season => season.id === updatedSeason.id);
    if (index !== -1) {
      state.seasonList?.splice(index, 1, updatedSeason);
    }
  },
  ADD_SEASON(state, newSeason) {
    state.seasonList.push(newSeason);
  }
}

const actions = {
  async fetchAllSeasons({ commit }) {
    try {
        const { data } = await http.get('/Season');

        const mappedData = data.map(season => ({
            "id": season.id?.toString(),
            "name": season.name,
            "createdDate": season.createdDate,
            "totalInputWeight": season.totalInputWeight,
            "totalOutputWeight": season.totalOutputWeight,
            "lossKg": season.lossKg,
            "averagePrice": season.averageKgPrice
        }));

        commit('SET_SEASON_LIST', mappedData);
        return data
    }
    catch (err) {
        throw err
    }
  },
  async deleteSeason({ commit }, seasonId) {
    await http.delete(`/Season/${seasonId}`).then(() => {
        commit('DELETE_SEASON', seasonId);
    }).catch(err => {
        throw err
    });
  },
  async updateSeason({ commit }, season) {
    await http.put(`/Season/${season.id}`, season)
      .then(() => {
        commit('UPDATE_SEASON', season);
      })
      .catch(err => { 
        throw err 
      });
  },
  async addSeason({ state, commit }, season) {
    try {
      const alreadyExists = state.seasonList.some(
        s => s.name.trim().toLowerCase() === season.name.trim().toLowerCase()
      );
  
      if (alreadyExists) {
        throw new Error('Bu isimde bir sezon zaten mevcut.');
      }

      delete season.id;
      
      const response = await http.post('/Season', season);
      commit('ADD_SEASON', response.data);
  
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