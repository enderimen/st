import http from '../http'

const state = {
    vendorList: null
}

const getters = {
    getDetailVendorInfo: state => state.vendorList,
    getVendorList(state) {
        return state.vendorList?.map(vendor => {
          return {
            value: vendor?.id?.toString(),
            label: vendor.name
          }
        }) || [];
      },
}

const mutations = {
    SET_VENDOR_LIST(state, vendorList) {
        state.vendorList = vendorList
    },
    DELETE_VENDOR(state, vendorId) {
        state.vendorList = state.vendorList.filter(vendor => vendor.id !== vendorId);
    },
    UPDATE_VENDOR(state, updatedVendor) {
        const index = state.vendorList.findIndex(vendor => vendor.id === updatedVendor.id);
        if (index !== -1) {
            state.vendorList.splice(index, 1, updatedVendor);
        }
    },
    ADD_VENDOR(state, newVendor) {
        state.vendorList.push(newVendor);
    }
}

const actions = {
    async getAllVendor({ commit }) {
        try {
        const { data } = await http.get('/Vendor');
        const mappedData = data.map(vendor => ({
            id: vendor.id,
            name: vendor.name,
            phone: vendor.phone,
            address: vendor.address
        }));
        
        commit('SET_VENDOR_LIST', mappedData);
        return mappedData
        }
        catch (err) {
            throw err
        }
    },
    async deleteVendor({ commit }, vendorId) {
        await http.delete(`/Vendor/${vendorId}`)
        .then(() => {
            commit('DELETE_VENDOR', vendorId);
        }).catch(err => {
            throw err
        });
    },
    async addVendor({ commit }, vendor) {
        delete vendor.id;
        await http.post('/Vendor', vendor)
        .then(() => {
            commit('ADD_VENDOR', vendor);
        });
    },
    async updateVendor({ commit }, vendor) {
        await http.put(`/Vendor/${vendor.id}`, vendor)
        .then(() => {
            commit('UPDATE_VENDOR', vendor);
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