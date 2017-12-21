<template>
<div class="container">
</br>
  <h4>{{ msg }}</h4>

  <div v-for="guild in guilds">
    <router-link class="forward" :to="{ name: 'EmoteList', params: { guild: guild.guildId }}">{{ guild.name }}</router-link>
  </div>
  <div id="emotes" v-for="chunk in guilds" class="row">
    <div class="one-third column" v-for="guild in chunk">
      <router-link class="forward" :to="{ name: 'EmoteList', params: { guild: guild.guildId }}">{{ guild.name }}</router-link>
    </div>
  </div>
</br>
  <b>{{ excluded }}</b>
</div>
</template>

<script>
import request from 'request-promise-native';

export default {
  name: 'GuildList',
  data() {
    return {
      msg: "",
      guilds: [],
	  excluded: ""
    }
  },
  created() {
    let self = this;
    self.fetchData();
  },
  methods: {
    fetchData: async function() {
      try {
        const result = await request({
          url: `https://ocel.artemisbot.uk/api/guilds/`,
          json: true
        });
        this.guilds = this.$chunk(result.guilds.filter(guild => true), 3);
        this.msg = `Ocel's guilds with emotes enabled`;
		const diff = 0; //result.guilds.length - this.guilds.length;
		this.excluded = diff > 0 ?
			(diff === 1 ?
			`${diff} guild was excluded from this list as it has emotes disabled.` :
			`${diff} guilds were excluded from this list as they have emotes disabled.`)
			: "";
      } catch (err) {
        console.error(err);
        this.msg = "Could not fetch guilds.";
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1,
h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

.forward {
  font-size: 20px;
  text-align: left;
}

a {
  color: #42b983;
  text-decoration: none;
}
</style>
