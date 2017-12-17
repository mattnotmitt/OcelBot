const Sequelize = require('sequelize');

const Database = require('../db.js');

const Emote = Database.db.define('emote', {
	emoteID: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
		unique: true
	},
	name: Sequelize.STRING,
	path: Sequelize.STRING,
	guildId: Sequelize.STRING
});

module.exports = Emote;
