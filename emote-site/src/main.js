// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueLazyload from 'vue-lazyload'
import App from './App'
import router from './router'
import chunk from 'lodash/chunk';

Vue.prototype.$chunk = chunk;

Vue.config.productionTip = false

Vue.use(VueLazyload, {
  preLoad: 1.3,
  loading: require('./assets/loading.gif'),
  attempt: 3
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
