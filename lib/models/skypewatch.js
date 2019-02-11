const Sequelize = require('sequelize');

const Database = require('../db.js');

const SkypeWatch = Database.db.define('twitchwatch', {
	watchID: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
		unique: true
	},
	skypeUsername: Sequelize.STRING,
	channelID: Sequelize.STRING
});

module.exports = SkypeWatch;
