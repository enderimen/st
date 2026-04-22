import http from '../http'

const state = {
  customerList: null,
  customerBalanceList: null,
  customerDetail: null,
  customerBalanceExtractList: null
}

const getters = {
  getCustomerDetail: state => state.customerDetail,
  getCustomerList: state => state.customerList,
  getCustomerBalanceList: state => state.customerBalanceList,
  getCustomerBalanceExtractList: state => state.customerBalanceExtractList,
  getCustomerSpecialList: state => {
    return state.customerBalanceList?.map((customer) => {
      return {
        value: customer.id,
        label: customer.name
      }
    });
  }
}

const mutations = {
  SET_CUSTOMER_LIST(state, customerList) {
    state.customerList = customerList
  },
  SET_CUSTOMER_BALANCE_LIST(state, customerBalanceList) {
    state.customerBalanceList = customerBalanceList
  },
  SET_CUSTOMER_BALANCE_EXTRACT_LIST(state, customerBalanceExtractList) {
    state.customerBalanceExtractList = customerBalanceExtractList
  },
  SET_CUSTOMER_BALANCE_EXTRACT(state, newExtract) {
    state.customerBalanceExtractList.push(newExtract);
  },
  UPDATE_CUSTOMER_BALANCE_EXTRACT_LIST(state, updatedExtract) {
    const index = state.customerBalanceExtractList.findIndex(extract => extract.id === updatedExtract.id);
    if (index !== -1) {
      state.customerBalanceExtractList.splice(index, 1, updatedExtract);
    }
  },
  CLOSE_CUSTOMER_BALANCE(state, payload) {
    const customerBalance = state.customerBalanceList.find(cb => cb.id == payload.id);
    if (customerBalance) {
      customerBalance.isClosing = payload.status;
    }
  },
  DELETE_CUSTOMER(state, customerId) {
    state.customerList = state.customerList.filter(customer => customer.id !== customerId);
  },
  UPDATE_CUSTOMER(state, updatedCustomer) {
    const index = state.customerList.findIndex(customer => customer.id === updatedCustomer.id);
    if (index !== -1) {
      const existing = state.customerList[index];
  
      const mergedCustomer = {
        ...updatedCustomer,
        hasBalance: existing.hasBalance,
        balanceId: existing.balanceId
      };
  
      state.customerList.splice(index, 1, mergedCustomer);
    }
  },
  SET_CUSTOMER_DETAIL(state, customerDetail) {
    state.customerDetail = customerDetail;
  },
  ADD_CUSTOMER(state, newCustomer) {
    state.customerList.push(newCustomer);
  },
  ADD_CUSTOMER_BALANCE(state, balanceDetail) {
    state.customerBalanceList.push(balanceDetail);
  },
  UPDATE_CUSTOMER_BALANCE(state, balanceDetail) {
    const index = state.customerBalanceList.findIndex(balance => balance.id === balanceDetail.id);

    if (index !== -1) {
      state.customerBalanceList.splice(index, 1, balanceDetail);
    }
  }
}

const actions = {
  async getAllCustomerBalance({ commit }) {
    try {
    const { data } = await http.get('/CustomerBalance');
    
    const mappedData = data.map(cust => ({
      id: cust.id,
      customerId: cust.customerId,
      name: cust.customerName,
      phone: cust.phone,
      seasonId: cust.seasonId,
      season: cust.seasonName,
      purchasedAmount: cust.purchasedAmount,
      paymentType: cust.paymentType,
      desc: cust.desc,
      totalKg: cust.totalKg,
      remainingKg: cust.remainingKg,
      isClosing: cust.isClosed,
      hasTransaction: cust.hasTransaction,
      createdAt: cust.createdDate
    }));
    
    commit('SET_CUSTOMER_BALANCE_LIST', mappedData);
    return mappedData
    }
    catch (err) {
        throw err
    }
  },
  async getAllCustomerBalanceExtract({ commit }) {
    try {
      const { data } = await http.get(`/CustomerBalanceTransaction`);
      
      const mappedData = mapDetails(data);
 
      commit('SET_CUSTOMER_BALANCE_EXTRACT_LIST', mappedData);
      return mappedData
    }
    catch (err) {
      throw err
    }
  },
  async getCustomer({ commit }, customerId) {
    try {
    const { data } = await http.get(`/Customer/${customerId}`);
    const mappedData = [data].map(cust => ({
        id: cust.id,
        fullName: cust.fullName,
        phone: cust.phone,
        hasBalance: cust.hasBalance,
        balanceId: cust.balanceId,
        address: cust.address
    }));
    
    commit('SET_CUSTOMER_DETAIL', mappedData[0]);
    return mappedData
    }
    catch (err) {
        throw err
    }
  },
  async getAllCustomer({ commit }) {
    try {
    const { data } = await http.get('/Customer');
    const mappedData = data.map(cust => ({
        id: cust.id,
        fullName: cust.fullName,
        phone: cust.phone,
        hasBalance: cust.hasBalance,
        balanceId: cust.balanceId,
        address: cust.address
    }));
    
    commit('SET_CUSTOMER_LIST', mappedData);
    return mappedData
    }
    catch (err) {
        throw err
    }
  },
  async deleteCustomer({ commit }, customerId) {
    await http.delete(`/Customer/${customerId}`)
    .then(() => {
      commit('DELETE_CUSTOMER', customerId);
    }).catch(err => {
      throw err
    });
  },
  async addCustomer({ commit }, customer) {
    delete customer.id;
    await http.post('/Customer', customer)
    .then((response) => {
      commit('ADD_CUSTOMER', response.data);
    });
  },
  async updateCustomer({ commit }, customer) {
    await http.put(`/Customer/${customer.id}`, customer)
    .then(() => {
      commit('UPDATE_CUSTOMER', customer);
    })
    .catch(err => { 
      throw err 
    });
  },
  async closeCustomerBalance({ commit }, {id, status }) {
    await http.put(`/CustomerBalance/${id}/close?status=${status}`,)
    .then(() => {
      commit('CLOSE_CUSTOMER_BALANCE', { id, status });
    }).catch(err => {
      throw err
    });
  },   
  async addCustomerBalance({ commit }, balanceDetail) {
    await http.post(`/CustomerBalance`, balanceDetail)
    .then((response) => {
      const mappedData = [response.data].map(cust => ({
        id: cust.id,
        customerId: cust.customerId,
        name: cust.customerName,
        phone: cust.phone,
        seasonId: cust.seasonId,
        season: cust.seasonName,
        purchasedAmount: cust.purchasedAmount,
        paymentType: cust.paymentType,
        desc: cust.desc,
        totalKg: cust.totalKg,
        remainingKg: cust.remainingKg,
        isClosing: cust.isClosed,
        hasTransaction: cust.hasTransaction,
        createdAt: cust.createdDate
      }));
      commit('ADD_CUSTOMER_BALANCE', mappedData[0]);
    }).catch(err => {
      throw err
    });
  },
  async updateCustomerBalance({ commit }, balanceDetail) {
    await http.put(`/CustomerBalance/${balanceDetail.id}`, balanceDetail)
    .then((response) => {
      const mappedData = [response.data].map(cust => ({
        id: cust.id,
        customerId: cust.customerId,
        name: cust.customerName,
        phone: cust.phone,
        seasonId: cust.seasonId,
        season: cust.seasonName,
        purchasedAmount: cust.purchasedAmount,
        paymentType: cust.paymentType,
        desc: cust.desc,
        totalKg: cust.totalKg,
        remainingKg: cust.remainingKg,
        isClosing: cust.isClosed,
        hasTransaction: cust.hasTransaction,
        createdAt: cust.createdDate
      }));
      commit('UPDATE_CUSTOMER_BALANCE', mappedData[0]);
    }).catch(err => {
      throw err
    });
  },
  async addCustomerBalanceExtract({ commit }, extractDetail) {
    return await http.post('/CustomerBalanceTransaction', extractDetail)
    .then((response) => {
      if (response.data.isSuccess) {
        const mappedData = mapDetails([response.data]);
        commit('SET_CUSTOMER_BALANCE_EXTRACT', mappedData[0]);
      }
      return response.data;
    }).catch(err => {
      throw err
    });
  },
  async updateCustomerBalanceExtract({ commit }, extractDetail) {
    const id = extractDetail.id;
    delete extractDetail.id;
    return await http.put(`/CustomerBalanceTransaction/${id}`, extractDetail)
    .then((response) => {
      if (response.data.isSuccess) {
        const mappedData = mapDetails([response.data]);
        commit('UPDATE_CUSTOMER_BALANCE_EXTRACT_LIST', mappedData[0]);
      }
      return response.data;
    }).catch(err => {
      throw err
    });
  }
}

function mapDetails(details) {
  return details.map(extract => ({
    id: extract.id,
    name: extract.customerBalance.customerName,
    customerId: extract.customerBalance.customerId,
    season: extract.customerBalance.seasonName,
    seasonId: extract.customerBalance.seasonId,
    totalKg: extract.customerBalance.totalKg,
    totalWeight: extract.totalWeight,
    receivedKg: extract.details?.reduce((sum, product) => sum + product.totalKg, 0),
    remainingKg: extract.customerBalance.remainingKg,
    isClosing: extract.customerBalance.isClosed,
    createdAt: extract.transactionDateUtc,
    detailList: extract.details.filter(d => d.quantity > 0)
  }));
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}