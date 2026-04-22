import http from '../http'

const state = {
  summary: null,
  productList: null
}

const getters = {
  getSummary: state => state.summary,
  getProductList: state => state.productList,
}

const mutations = {
  SET_SUMMARY(state, summary) {
    state.summary = summary
  },
  SET_PRODUCT_LIST(state, productList) {
    state.productList = productList
  },
  DELETE_PRODUCT(state, productId) {
    state.productList = state.productList.filter(product => product.id !== productId);
  },
  UPDATE_PRODUCT(state, updatedProduct) {
    const index = state.productList.findIndex(product => product.id === updatedProduct.id);
    if (index !== -1) {
      state.productList.splice(index, 1, updatedProduct);
    }
  },
  ADD_PRODUCT(state, newProduct) {
    state.productList.push(newProduct);
  }
}

const actions = {
  async fetchSummary({ commit }) {
      try {
      const { data } = await http.get('/StockSummary');
      commit('SET_SUMMARY', data);
      return data
      }
      catch (err) {
          throw err
      }
  },
  async fetchAllProducts({ commit }) {
    try {
      const { data } = await http.get('/ProductTypes');

      const mappedData = data.map(product => ({
        id: product.id,
        name: product.name,
        unitWeight: `${product.unitWeight}KG`,
        isGrass: product.isGrassy,
        category: product.category,
      }));

      commit('SET_PRODUCT_LIST', mappedData);
      return data
    }
    catch (err) {
        throw err
    }
  },
  async deleteProduct({ commit }, productId) {
    await http.delete(`/ProductTypes/${productId}`).then(() => {
        commit('DELETE_PRODUCT', productId);
    }).catch(err => {
        throw err
    });
  },
  async updateProduct({ commit }, product) {
    await http.put(`/ProductTypes/${product.id}`, product)
      .then(() => {
        commit('UPDATE_PRODUCT', product);
      })
      .catch(err => { 
        throw err 
      });
  },
  async addProduct({ commit }, product) {
    delete product.id;
    await http.post('/ProductTypes', product)
    .then(response => {
      commit('ADD_PRODUCT', response.data);
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