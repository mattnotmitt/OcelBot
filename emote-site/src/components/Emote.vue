<template>
<div class="container">
  <br>
  <h4>:{{ emote.name }}:</h4>
  <img id="emote-image" v-lazy="'https://cdn.artemisbot.uk/emotes/' + emote.path" /><br>
  <br>
  <br>
  <h5>{{ msg }}</h5>
  <div v-if="datacollection" height="500px">
    <line-chart :chart-data="datacollection" :options="chartOptions"></line-chart>
  </div>
  <div v-if="emote">
  	<router-link class="back" :to="{ name: 'EmoteList', params: { guild: emote.guildId }}">↤ Back to guild list</router-link>
  </div><div v-else>
		<router-link class="back" :to="{ name: 'GuildList'}">↤ Back to guild list</router-link>
  </div>
</div>
</template>

<script>
import LineChart from './LineChart.js';

export default {
  name: 'Emote',
	components: {
		LineChart
  },
	data() {
		return {
			msg: null,
			emote: null,
			datacollection: null,
			chartOptions: {
					responsive: true,
					maintainAspectRatio: false,
					elements: {
						line: {
							tension: 0
						}
					},
					legend: {
						display: false
					},
					scales: {
						xAxes: [{
							type: 'time',
							display: true,
							scaleLabel: {
								display: true,
								labelString: 'Date'
							},
							ticks: {
								major: {
									fontStyle: 'bold',
									fontColor: '#FF0000'
								}
							},
							time: {
								suggestedMax: new Date(),
								tooltipFormat: "dddd, MMMM Do YYYY, h:mm:ss a",
								minUnit: 'minute'
							}
						}],
						yAxes: [{
							display: true,
							scaleLabel: {
								display: true,
								labelString: 'Uses'
							},
							ticks: {
								stepSize: 1
							}
						}]
					}
				}
		}
	},
	mounted() {
		let self = this;
		self.fetchData();
	},
	methods: {
		fetchData: async function() {
			try {
				let result = await (await fetch(`https://ocel.artemisbot.uk/api/emotes/${this.$route.params.emote}`)).json();
				this.emote = result.emote;
				if (result.status === 0) {
					this.msg = `This emote has never been used.`;
				} else {
					this.datacollection = {
						datasets: [{
							label: 'Uses',
							data: result.stats.uses,
							backgroundColor: 'rgba(186,85,211, 0.2)'
						}]
					};
					this.msg = `Emote Stats`;
				}
			} catch (err) {
				console.error(err);
				this.msg = "Emote not found.";
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

#emote-image {
	max-height: 250px;
}
</style>
