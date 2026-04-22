import Vue from 'vue';
import App from './App.vue';
import router from './router';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import locale from './locale/tr';
import store from './store';
import './filters';
import './assets/scss/index.scss';

Vue.use(ElementUI, { locale });

new Vue({
  render: h => h(App),
  router,
  store
}).$mount('#app');