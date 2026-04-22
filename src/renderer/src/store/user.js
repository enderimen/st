import http from '../http'

const state = {
  profile: {
    imageUrl: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.imageUrl : null,
    username: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.username : null,
    companyName: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))?.companyName : null,
  },
}

const getters = {
  getProfileDetail: (state) => state.profile,
}

const mutations = {
  UPDATE_PROFILE(state, { imageUrl, companyName, username }) {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    if (imageUrl) {
      user.imageUrl = imageUrl;
      state.profile.imageUrl = imageUrl;
    }
    if (companyName) {
      user.companyName = companyName;
      state.profile.companyName = companyName;
    }
    if (username) {
      user.username = username;
      state.profile.username = username;
    }
    localStorage.setItem('user', JSON.stringify(user));
  }
}

const actions = {
  async updateProfile({ commit }, { userId, formData }) {
    try {
      const { data: response } = await http.post(`/User/update/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.isSuccess) {
        const { id, profileImageUrl, companyName, username } = response.data;
        
        const user = {
          id: id,
          imageUrl: profileImageUrl,
          companyName: companyName,
          username: username
        }

        localStorage.setItem('user', JSON.stringify(user));
        commit('UPDATE_PROFILE', user);
      }
      return response;
    } catch (err) {
      throw err;
    }
  },
  async getUserDetails({ commit }, userId) {
    try {
      const { data } = await http.get(`/User/details/${userId}`);

      commit('UPDATE_PROFILE', {
        imageUrl: data.profileImageUrl,
        companyName: data.companyName,
        username: data.username
      });

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