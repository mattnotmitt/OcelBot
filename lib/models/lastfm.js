const Sequelize = require('sequelize');

const Database = require('../db.js');

const LastFM = Database.db.define('lastfm', {
	userId: {
		type: Sequelize.STRING,
		primaryKey: true,
		allowNull: false,
		unique: true
	},
	lfmUsername: Sequelize.STRING
});

module.exports = LastFM;
