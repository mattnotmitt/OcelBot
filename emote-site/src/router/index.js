import Vue from 'vue'
import Router from 'vue-router'
import GuildList from '@/components/GuildList'
import EmoteList from '@/components/EmoteList'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
	{
        path: '/emotes/',
        name: 'GuildList',
        component: GuildList
	},
    {
      path: '/emotes/list/:guild',
      name: 'EmoteList',
      component: EmoteList
    }
  ]
})
