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
  SET_SEASON_LIST(state, seasonList) {
    state.seasonList = seasonList
  },
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
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}