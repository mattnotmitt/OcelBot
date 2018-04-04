// LineChart.js
import { Line, mixins } from 'vue-chartjs';

const { reactiveProp } = mixins;

export default {
	name: 'LineChart',
	extends: Line,
	props: ['options'],
	mixins: [reactiveProp],
	mounted() {
		this.renderChart(this.chartData, this.options);
	}
};
