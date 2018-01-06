const Sequelize = require('sequelize');

const Database = require('../db.js');

const EmoteLog = Database.db.define('emotelog', {
	logID: {
		type: Sequelize.UUID,
		primaryKey: true,
		allowNull: false,
		unique: true,
		defaultValue: Sequelize.UUIDV4
	},
	emoteID: Sequelize.STRING,
	userID: Sequelize.STRING,
	channelID: Sequelize.STRING,
	guildID: Sequelize.STRING
});

module.exports = EmoteLog;
