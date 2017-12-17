const Sequelize = require('sequelize');

const Database = require('../db.js');

const Watcher = Database.db.define('watcher', {
	watcher: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
		unique: true
	},
	status: Sequelize.BOOLEAN
});

module.exports = Watcher;
