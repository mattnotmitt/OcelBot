// Modules & Initialisation
exports.data = {
	name: 'Skype Listener',
	command: 'skype',
	description: 'Listens to skype messages from specified usernames'
};

const Discord = require('discord.js');
const {connect} = require('skype-http');

const Watcher = require('../lib/models/watcher');
const log = require('../lib/log.js')(exports.data.name);
const config = require('../config.json');

// Const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let api;

exports.watcher = async bot => {
	// Startup process for watcher
	this.disable();
	api = await connect({credentials: config.skypeCreds});

	const onMessage = async event => {
		const resource = event.resource;
		let title;
		if (!['Text', 'RichText'].includes(resource.type)) {
			return;
		}
		if (['live:fondationarnaudlacours', 'live:mercury_443'].includes(resource.from.username)) {
			log.verbose('Message received from ARG.');
			title = `A new Skype message has been sent by ${resource.native.imdisplayname} to Point of Contact 6.`;
		} else if (resource.from.username === api.context.username && ['8:live:fondationarnaudlacours', '8:live:mercury_443'].includes(resource.conversation)) {
			log.verbose('Message sent to ARG.');
			title = `A new Skype message has been sent by Point of Contact 6 to ${resource.conversation === '8:live:fondationarnaudlacours' ? 'Geraldine Nadeau' : 'Mercury Process'}.`;
		} else {
			log.verbose('Irrelevant message received.');
			return;
		}

		const embed = new Discord.RichEmbed({
			author: {
				name: title,
				icon_url: 'https://cdn.artemisbot.uk/img/ocel.jpg'
			},
			description: `${resource.content}`,
			color: 0x00AFF0,
			footer: {
				text: 'Sent',
				icon_url: 'https://cdn.artemisbot.uk/img/skype.png'
			},
			timestamp: resource.composeTime
		});
		const wtSites = await Watcher.findOne({
			where: {
				watcherName: 'wt-sites'
			}
		});
		const data = wtSites.data;
		// Const data = {channels: ['338712920466915329']};
		await Promise.all(data.channels.map(channel =>
			bot.channels.get(channel).send('', {embed})
		));
	};

	api.on('event', onMessage);
	api.on('error', err => {
		if (err.name !== 'poll') {
			log.error(`Issue with Skype: ${err}`);
		}
	});
	await api.listen();
	log.verbose('Connected to Skype API.');
};
/*
Exports.start = async (msg, bot, args) => {
	// Process for new channel/watched item
};

exports.stop = async (msg, bot, args) => {
	// Process for removing channel/watched item
};

exports.list = async (msg, bot, args) => {
};
*/

exports.disable = async () => {
	try {
		await api.stopListening();
	} catch (err) {
		log.warn(`Failed to stop listener: ${err}`);
	}
};
