const Sequelize = require('sequelize');

const Database = require('../db.js');

const TwitterWatch = Database.db.define('twitterwatch', {
	watchID: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
		unique: true
	},
	twitterID: Sequelize.STRING,
	twitterName: Sequelize.STRING,
	channelID: Sequelize.STRING,
	replies: Sequelize.BOOLEAN
});

module.exports = TwitterWatch;
