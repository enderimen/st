import Vue from 'vue';
import Router from 'vue-router';

import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Customers from '../views/Customers.vue';
import Vendors from '../views/Vendors.vue';
import Seasons from '../views/Seasons.vue';
import Manufacture from '../views/Manufacture.vue';
import Products from '../views/Products.vue';
import Settings from '../views/Settings.vue';
import Profile from '../views/Profile.vue';
import Accounting from '../views/Accounting.vue';
import AccountingProcess from '../views/AccountingProcess.vue';

import AuthLayout from '../layouts/AuthLayout.vue'
import PanelLayout from '../layouts/PanelLayout.vue'

Vue.use(Router)

const router = new Router({
  mode: 'hash',
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/anasayfa',
      component: PanelLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'Home', component: Home },
        { path: 'musteriler', name: 'Customers', component: Customers },
        { path: 'tum-cariler', name: 'Accounting', component: Accounting },
        { path: 'tum-cari-islemleri', name: 'AccountingProcess', component: AccountingProcess },
        { path: 'tedarikciler', name: 'Vendors', component: Vendors },
        { path: 'tum-sezonlar', name: 'Seasons', component: Seasons },
        { path: 'uretimler', name: 'Manufacture', component: Manufacture },
        { path: 'urunler', name: 'Products', component: Products },
        { path: 'ayarlar', name: 'Settings', component: Settings },
        { path: 'profilim', name: 'Profile', component: Profile },
      ]
    },
    {
      path: '/login',
      component: AuthLayout,
      children: [
        { path: '', name: 'Login', component: Login }
      ]
    },
    { path: '*', redirect: '/login' }
  ]
});

import { supabase } from '../utils/supabase'

// Router guard
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  const hasTenant = !!localStorage.getItem('tenant_id');
  
  const isAuthenticated = session && hasTenant;

  if (to.meta.requiresAuth && !isAuthenticated) {
    // Eğer oturum yoksa her şeyi temizle ve logine gönder
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('user_id');
    next({ name: 'Login' });
  } else if (to.name === 'Login' && isAuthenticated) {
    // Giriş yapmışsa logine gitmesin
    next({ name: 'Home' });
  } else {
    next();
  }
});

export default router;
