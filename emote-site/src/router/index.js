import Vue from 'vue'
import Router from 'vue-router'
import GuildList from '@/components/GuildList'
import EmoteList from '@/components/EmoteList'
import Emote from '@/components/Emote'

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
		path: '/emotes/:emote',
        name: 'Emote',
        component: Emote
	}
    {
      path: '/emotes/list/:guild',
      name: 'EmoteList',
      component: EmoteList
    }
  ]
})
