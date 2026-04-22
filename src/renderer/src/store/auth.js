import http from '../http'

const state = {
  isAuthenticated: false,
}

const getters = {
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  getUser: () => localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null,
  isAuthenticated: state => state.isAuthenticated
}

const mutations = {
  LOGOUT(state) {
    state.user = null
    state.isAuthenticated = false
  }
}

const actions = {
  async login(_, credentials) {
    try {
      const { data } = await http.post('/Auth/login', credentials);

      localStorage.setItem('token', data?.accessToken);
      localStorage.setItem('refreshToken', data?.refreshToken);
      localStorage.setItem('user', JSON.stringify({id: data?.id}));

      return data
    } catch (err) {
      throw err
    }
  },

  logout({ commit }) {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    commit('LOGOUT')
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}