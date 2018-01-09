exports.data = {
	name: 'Twitch Stream Watcher',
	command: 'twitch',
	description: ''
};

const crypto = require('crypto');
const request = require('request-promise-native');
const Discord = require('discord.js');
const moment = require('moment');
const humanize = require('humanize-duration');
const Twit = require('twit');
const uuid = require('uuid/v4');

const TwitchWatch = require('../lib/models/twitchwatch');
const log = require('../lib/log.js')(exports.data.name);
const config = require('../config.json');

let repeat;

const T = new Twit(config.WTTwitter);

const whr = request.defaults({
	uri: `https://api.twitch.tv/helix/webhooks/hub`,
	headers: {
		Accept: 'application/vnd.twitchtv.v5+json',
		'Client-ID': config.twitch_clientid
	},
	json: true,
	method: 'POST',
	resolveWithFullResponse: true
});

const v5r = request.defaults({
	baseUrl: `https://api.twitch.tv/kraken/`,
	headers: {
		Accept: 'application/vnd.twitchtv.v5+json',
		'Client-ID': config.twitch_clientid
	},
	json: true
});

const renewWebhooks = async bot => {
	log.verbose('Renewing webhooks.');
	(await TwitchWatch.findAll({attributes: ['twitchID'], group: ['twitchID']})).forEach(async watch => {
		await whr({
			qs: {
				'hub.callback': `https://ocel.artemisbot.uk/twitch/${watch.twitchID}`,
				'hub.mode': 'subscribe',
				'hub.topic': `https://api.twitch.tv/helix/streams?user_id=${watch.twitchID}`,
				'hub.lease_seconds': 172800,
				'hub.secret': bot.config.twitchSecret
			}
		});
	});
};

const cancelWebhook = async watch => {
	log.verbose(`Cancelling webhook for ${watch.twitchID}.`);
	await whr({
		qs: {
			'hub.callback': `https://ocel.artemisbot.uk/twitch/${watch.twitchID}`,
			'hub.mode': 'unsubscribe',
			'hub.topic': `https://api.twitch.tv/helix/streams?user_id=${watch.twitchID}`
		}
	});
};

const startServer = async bot => {
	// Initialisation
	bot.config.twitchSecret = uuid();
	await TwitchWatch.sync();
	if ((await TwitchWatch.all()).length > 0) {
		renewWebhooks(bot);
	}

	// When GET request received
	bot.router.get('/twitch/:user', (req, res) => {
		if (req.query['hub.mode'] === 'subscribe') {
			if (req.query['hub.challenge'] === null) {
				res.sendStatus(200);
				log.error(`Failed to subscribe to stream up/down event for streamer with ID ${req.params.user} for reason ${req.query['hub.reason']}.`);
			} else {
				res.status(200).send(req.query['hub.challenge']);
				log.verbose(`Successful subscription to stream up/down event for streamer with ID ${req.params.user}.`);
			}
		} else if (req.query['hub.mode'] === 'unsubscribe') {
			if (req.query['hub.challenge'] === null) {
				res.sendStatus(200);
				log.error(`Failed to unsubscribe from stream up/down event for streamer with ID ${req.params.user}.`);
			} else {
				res.status(200).send(req.query['hub.challenge']);
				log.verbose(`Successful unsubscription from stream up/down event for streamer with ID ${req.params.user}.`);
			}
		} else {
			res.sendStatus(404);
		}
	});

	// When POST request received
	bot.router.post('/twitch/:user', async (req, res) => {
		if (!req.headers['x-hub-signature']) {
			return res.sendStatus(404);
		}
		res.sendStatus(200);
		// Check signature of data
		const incoming = req.headers['x-hub-signature'].split('=');
		const hash = crypto.createHmac(incoming[0], bot.config.twitchSecret).update(JSON.stringify(req.body)).digest('hex');
		if (incoming[1] !== hash) {
			return log.error('Webhook POST signing does not match.');
		}
		// Fetch watchers related to channel
		const twitchWatchers = await TwitchWatch.findAll({where: {twitchID: req.params.user}});

		if (req.body.data.length > 0) { // If channel has gone live, data is included in this array
			// Check that this isn't a repeat
			if (twitchWatchers[0].live) {
				return log.verbose(`${twitchWatchers[0].twitchName} is already live on Twitch.`);
			}
			// Get channel data
			const channelData = await v5r(`/channels/${req.params.user}`);
			log.info(`${channelData.display_name} has gone live on Twitch.`);
			// Generate embed to send to discord
			const embed = new Discord.RichEmbed({
				color: 6570405,
				author: {
					icon_url: channelData.logo,
					name: `${channelData.display_name} on Twitch.tv has just gone live!`,
					url: channelData.url
				},
				fields: [
					{
						name: 'Status',
						value: channelData.status || 'None',
						inline: false
					},
					{
						name: 'Game',
						value: channelData.game || 'None',
						inline: true
					},
					{
						name: 'Followers',
						value: channelData.followers,
						inline: true
					},
					{
						name: 'Viewers',
						value: req.body.data[0].viewer_count,
						inline: true
					},
					{
						name: 'Uptime',
						value: humanize(moment().diff(moment(req.body.data[0].started_at)), {round: true}),
						inline: true
					}
				],
				thumbnail: {url: req.body.data[0].thumbnail_url.replace('{width}', '320').replace('{height}', '180')},
				timestamp: moment().toISOString(),
				footer: {
					icon_url: 'https://cdn.artemisbot.uk/img/twitch.png',
					text: `\u200B`
				}
			});
			if (req.params.user === '163329949') {
				await T.post('statuses/update', {status: `${channelData.url} has gone live! #WakingTitan`});
			}
			await Promise.all(twitchWatchers.map(watcher =>
				Promise.all([watcher.update({live: true}), bot.channels.get(watcher.channelID).send('', {embed})])
			));
		} else { // If channel has gone offline, array is empty
			log.info(`${twitchWatchers[0].twitchName} has gone offline on Twitch.`);
			// Update database
			twitchWatchers.forEach(async watch => {
				await watch.update({live: false});
			});
		}
	});
};

// Gets unique Twitch user ID from username
const getID = user => {
	return new Promise(async (resolve, reject) => {
		try {
			const userSearch = await v5r(`/users?login=${user}`);
			userSearch._total > 0 ? resolve(userSearch.users[0]._id) : reject(new Error('NotReal'));
		} catch (err) {
			reject(err);
		}
	});
};

// Checks whether channel with given ID is live
const checkLive = id => {
	return new Promise(async (resolve, reject) => {
		try {
			const streams = (await v5r(`/streams/${id}`)).stream;
			resolve(streams ? resolve(streams) : resolve(false));
		} catch (err) {
			reject(err);
		}
	});
};

// Startup process for watcher
exports.watcher = bot => {
	// Start express server & generate new webshooks
	startServer(bot);
	// Refresh webhooks every 24 hours
	repeat = setInterval(() => {
		renewWebhooks(bot);
	}, 86400 * 1000);
	log.verbose(`${exports.data.name} has initialised successfully.`);
};

exports.disable = async () => {
	clearInterval(repeat);
	log.info('Cancelling all webhooks and disabling Twitch Watcher module.');
	(await TwitchWatch.findAll({attributes: ['twitchID'], group: ['twitchID']})).forEach(watch => {
		cancelWebhook(watch);
	});
};

exports.start = async (msg, bot, args) => {
  // Process for new channel/watched item
	try {
		await TwitchWatch.sync();
		if (args.length < 0) {
			return msg.reply('Please add the id/name of a Twitch stream.');
		}
		const options = {
			user: args[0].split('/').slice(-1).pop()
		};
		const id = options.user.match(/^[0-9]+$/) ? options.user : await getID(options.user);
		if (await TwitchWatch.findOne({where: {twitchID: id, channelID: msg.channel.id}})) {
			return msg.reply(`I am already watching ${options.user} on Twitch in this channel.`);
		}
		const live = Boolean(await checkLive(id));
		if (!(await TwitchWatch.findOne({where: {twitchID: id}}))) {
			renewWebhooks(bot);
		}
		await TwitchWatch.create({
			watchID: uuid(),
			twitchID: id,
			twitchName: options.user,
			channelID: msg.channel.id,
			live
		});
		log.info(`Now watching ${options.user} in #${msg.channel.name} on ${msg.guild.name}.`);
		await msg.reply(`Now watching ${options.user} on Twitch in this channel.`);
	} catch (err) {
		msg.reply('Couldn\'t watch this stream! Check the logs.');
		log.error(`Couldn't start watching a new stream: ${err}`);
	}
};

exports.stop = async (msg, bot, args) => {
	await TwitchWatch.sync();
	if (args.length < 0) {
		return msg.reply('Please add the id/name of a Twitch stream.');
	}
	const options = {
		user: args[0].split('/').slice(-1).pop()
	};
	const id = options.user.match(/^[0-9]+$/) ? options.user : await getID(options.user);
	const selectedWatch = await TwitchWatch.findOne({where: {twitchID: id, channelID: msg.channel.id}});
	if (!selectedWatch) {
		return msg.reply(`I am not watching ${options.user} on Twitch in this channel.`);
	}
	if ((await TwitchWatch.find({where: {twitchID: id}}).length) === 1) {
		cancelWebhook(selectedWatch);
	}
	selectedWatch.destroy();
	msg.reply(`I am no longer watching ${options.user} on Twitch in this channel.`);
	log.info(`Stopped watching ${options.user} in #${msg.channel.name} on ${msg.guild.name}.`);
	if (!(await TwitchWatch.findOne({where: {twitchID: id}}))) {
		cancelWebhook(selectedWatch);
	}
};

exports.list = async (msg, bot, args) => {
	const channelID = args[0] && bot.channels.has(args[0]) ? args[0] : msg.channel.id;
	const channel = bot.channels.get(args[0]) || msg.channel;
	const fields = (await TwitchWatch.findAll({where: {channelID}})).map(watch => {
		return {
			name: watch.twitchName,
			value: `Created ${moment(watch.createdAt).fromNow()}`,
			inline: true
		};
	});
	if (fields.length > 0) {
		msg.reply('', {embed: {
			author: {
				icon_url: 'https://cdn.artemisbot.uk/img/twitch.png?c',
				name: `Twitch stream watchers running in #${channel.name} on ${channel.guild.name}`
			},
			fields,
			color: 0x993E4D,
			footer: {
				icon_url: 'https://cdn.artemisbot.uk/img/ocel.jpg',
				text: 'Ocel'
			}
		}});
	} else {
		msg.reply(`There are no twitch watchers in ${args[0] && bot.channels.has(args[0]) ? `#${channel.name} on ${channel.guild.name}` : 'this channel'}.`);
	}
};
