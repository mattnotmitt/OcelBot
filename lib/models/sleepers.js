const Sequelize = require('sequelize');

const Database = require('../db.js');

const Sleepers = Database.db.define('sleepers', {
	watchID: {
		type: Sequelize.UUID,
		primaryKey: true,
		allowNull: false,
		unique: true,
		defaultValue: Sequelize.UUIDV4
	},
	sleeperID: Sequelize.STRING,
	blocks: Sequelize.JSON,
    channelID: Sequelize.STRING,
    name: Sequelize.STRING
});

module.exports = Sleepers;
