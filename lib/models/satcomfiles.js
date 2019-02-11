const Sequelize = require('sequelize');

const Database = require('../db.js');

const SatComFiles = Database.db.define('satcomfiles', {
	watchID: {
		type: Sequelize.UUID,
		primaryKey: true,
		allowNull: false,
		unique: true,
		defaultValue: Sequelize.UUIDV4
	},
	channelID: Sequelize.STRING,
	data: Sequelize.ARRAY(Sequelize.DECIMAL(3, 2))
});

module.exports = SatComFiles;
