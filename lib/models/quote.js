const Sequelize = require('sequelize');

const Database = require('../db.js');

const Emote = Database.db.define('quote', {
	quoteID: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
		unique: true
	},
	name: Sequelize.STRING,
	text: Sequelize.STRING,
	guildId: Sequelize.STRING
});

module.exports = Emote;
