<template>
<div class="container">
  <br>
  <h4>{{ msg }}</h4>
  <router-link class="back" :to="{ name: 'GuildList'}">↤ Back to guild list</router-link>
  <br>
  <div id="emotes" v-for="chunk in emotes" class="row" v-bind:key="chunk">
    <div class="one-third column" v-for="emote in chunk" v-bind:key="emote">
      <img class="u-max-full-width" v-lazy="'https://cdn.artemisbot.uk/emotes/' + emote.path" /><br>
      <router-link id="emote-label" class="forward" :to="{ name: 'Emote', params: { emote: emote.emoteID }}"><b>{{ emote.name }}</b></router-link>
    </div>
  </div>
  <br>
  <br>
  <div v-if="emotes.length > 0"><router-link style="text-align: left;" class="back" :to="{ name: 'GuildList'}">↤ Back to guild list</router-link></div>
</div>
</template>

<script>
export default {
  name: 'EmoteList',
  data() {
    return {
      msg: "",
      emotes: [],
      emotecount: ""
    }
  },
  created() {
    let self = this;
    self.fetchData();
  },
  methods: {
    fetchData: async function() {
      try {
		let result = await (await fetch(`https://ocel.artemisbot.uk/api/guilds/${this.$route.params.guild}/emotes`)).json();
        this.emotes = this.$chunk(result.emotes, 3);
        this.msg = `Emotes from ${result.name}`;
        if (result.status === 1) {
          this.emotecount = `${result.emotes.length}`;
        } else {
          this.msg = `There are no emotes in ${result.name}.`;
        }
      } catch (err) {
        console.error(err);
        this.msg = "Guild not found.";
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
img[lazy=loading] {
    max-width: 30%;
}

.back {
  font-size: 20px;
  text-align: left;
}

a {
  color: #42b983;
  text-decoration: none;

}

.row {
  display: flex;
}

.column {
  align-self: center;
  max-width: 100%
}

.emote-label {
  font-size: 15px;
}
</style>
