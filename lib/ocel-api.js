const log = require('../lib/log')('Ocel API');
const Emote = require('./models/emote');
const EmoteLog = require('./models/emotelog');
const Server = require('./models/server');

const OcelAPI = router => {
	router.get('/api/emotes/:guild', async (req, res) => {
		try {
			let i = 0;
			if (!req.params.guild.match(/^[0-9]+$/)) {
				return res.status(404).json({});
			}
			const guild = await Server.findOne({where: {guildId: req.params.guild}});
			if (!guild) {
				return res.status(404).json({});
			}
			let guildEmotes = await Emote.findAll({where: {guildId: req.params.guild}});
			if (guildEmotes.length === 0) {
				return res.status(200).json({status: 0, name: guild.name});
			}
			guildEmotes = guildEmotes.map(emote => {
				const cleaned = emote.toJSON();
				cleaned.index = i;
				i++;
				return cleaned;
			});
			return res.status(200).json({status: 1, emotes: guildEmotes.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)), name: guild.name});
		} catch (err) {
			log.error(`Error with API request: ${err.stack}`);
			res.status(500);
		}
	});
	router.get('/api/guilds/:guild', async (req, res) => {
		try {
			if (!req.params.guild.match(/^[0-9]+$/)) {
				return res.status(404).json({});
			}
			const guild = await Server.findOne({where: {guildId: req.params.guild}});
			if (!guild) {
				return res.status(404).json({});
			}
			return res.status(200).json({status: 1, guild: guild.toJSON()});
		} catch (err) {
			log.error(`Error with API request: ${err.stack}`);
			res.status(500);
		}
	});
	router.get('/api/guilds/', async (req, res) => {
		try {
			let guilds = await Server.all();
			if (guilds.length === 0) {
				return res.status(200).json({status: 0});
			}
			guilds = guilds.map(guild => guild.toJSON());
			return res.status(200).json({status: 1, guilds});
		} catch (err) {
			log.error(`Error with API request: ${err.stack}`);
			res.status(500);
		}
	});
};

module.exports = OcelAPI;
