import { supabase } from '../utils/supabase'

const state = {
  seasonList: []
}

const getters = {
  getSeasonWithProductList: (state) => state.seasonList,
  getSeasonList(state) {
    return (
      state.seasonList?.map((season) => {
        return {
          value: season?.id?.toString(),
          label: season.name
        }
      }) || []
    )
  }
}

const mutations = {
  SET_SUMMARY(state, summary) {
    state.summary = summary
  },
  SET_SEASON_LIST(state, seasonList) {
    state.seasonList = seasonList
  },
  DELETE_SEASON(state, seasonId) {
    state.seasonList = state.seasonList?.filter((season) => season.id != seasonId)
  },
  UPDATE_SEASON(state, updatedSeason) {
    const index = state.seasonList?.findIndex((season) => season.id === updatedSeason.id)
    if (index !== -1) {
      state.seasonList?.splice(index, 1, updatedSeason)
    }
  },
  ADD_SEASON(state, newSeason) {
    state.seasonList.push(newSeason)
  }
}

const actions = {
  async fetchAllSeasons({ commit }) {
    try {
      const tenantId = localStorage.getItem('tenant_id')
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error

      commit('SET_SEASON_LIST', data || [])
      return data
    } catch (err) {
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