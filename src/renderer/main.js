/*
 * @Descripttion: your project
 * @version: 0.0.0
 * @Author: Minyoung
 * @Date: 2022-03-13 15:04:33
 * @LastEditors: Minyoung
 * @LastEditTime: 2022-04-01 09:37:44
 */
import Vue from 'vue'

import App from './App'
if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  template: '<App/>'
}).$mount('#app')
