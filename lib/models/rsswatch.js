const Sequelize = require('sequelize');

const Database = require('../db.js');

const RSSWatch = Database.db.define('rsswatch', {
	watchID: {
		type: Sequelize.UUID,
		primaryKey: true,
		allowNull: false,
		unique: true,
		defaultValue: Sequelize.UUIDV4
	},
	feedURL: Sequelize.STRING,
	feedName: Sequelize.STRING,
	channelID: Sequelize.STRING
});

module.exports = RSSWatch;
