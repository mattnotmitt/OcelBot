const Sequelize = require('sequelize');

const Database = require('../db.js');

const Command = Database.db.define('command', {
	commandName: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
		unique: true
	},
	globalEnable: Sequelize.BOOLEAN,
	disabledGuilds: Sequelize.ARRAY(Sequelize.STRING),
	data: Sequelize.JSON
});

module.exports = Command;
