// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
/* eslint import/no-unresolved: "off" */
import Vue from 'vue';
import VueLazyload from 'vue-lazyload';
import chunk from 'lodash/chunk';
import App from './App';
import router from './router';

Vue.prototype.$chunk = chunk;

Vue.config.productionTip = false;

Vue.use(VueLazyload, {
	preLoad: 1.3,
	loading: require('./assets/loading.gif'),
	attempt: 3
});

/* eslint-disable no-new */
new Vue({
	el: '#app',
	router,
	template: '<App/>',
	components: {App}
});
