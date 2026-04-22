import Vue from 'vue';
import Vuex from 'vuex';

import auth from './auth';
import product from './product';
import customer from './customer';
import vendor from './vendor';
import season from './season';
import stock from './stock';
import production from './production';
import user from './user';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    auth,
    product,
    customer,
    vendor,
    season,
    stock,
    production,
    user
  },
  strict: process.env.NODE_ENV !== 'production'
});