const Sequelize = require('sequelize');

const Database = require('../db.js');

const TwitchWatch = Database.db.define('twitchwatch', {
	watchID: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
		unique: true
	},
	twitchID: Sequelize.STRING,
	twitchName: Sequelize.STRING,
	channelID: Sequelize.STRING,
	live: Sequelize.BOOLEAN
});

module.exports = TwitchWatch;
