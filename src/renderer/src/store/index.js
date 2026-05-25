import Vue from 'vue';
import Vuex from 'vuex';

import season from './season';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    season
  },
  strict: process.env.NODE_ENV !== 'production'
});