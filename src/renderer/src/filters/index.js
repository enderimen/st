import Vue from 'vue'
import { 
    formatNumber,
    formatCount,
    formatDate,
    formatDateWithClock
} from './../utils/helpers';

Vue.filter('formatNumber', formatNumber);
Vue.filter('formatCount', formatCount);
Vue.filter('formatDate', formatDate);
Vue.filter('formatDateWithClock', formatDateWithClock);
