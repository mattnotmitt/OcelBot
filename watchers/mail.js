// Modules & Initialisation
exports.data = {
	name: 'Mail Listener',
	command: 'mail',
	description: 'Listens to mail from specified address'
};

const util = require('util');

const MailListener = require('mail-listener2');
const moment = require('moment');
const Discord = require('discord.js');
const Twit = require('twit');
const webshot = require('webshot');
const jetpack = require('fs-jetpack');
const TwitterMedia = require('twitter-media');

const MailWatch = require('../lib/models/mailwatch');
const log = require('../lib/log.js')(exports.data.name);
const config = require('../config.json');

const T = new Twit(config.WTTwitter);
const ml = new MailListener({
	username: config.mailUsername,
	password: config.mailPassword,
	host: config.mailHost,
	port: 993, // Imap port
	tls: true,
	debug: log.debug, // Or your custom function with only one incoming argument. Default: null
	mailbox: 'INBOX', // Mailbox to monitor
	searchFilter: ['UNSEEN'], // The search filter being used after an IDLE notification has been retrieved
	markSeen: false, // All fetched email willbe marked as seen and not fetched next time
	fetchUnreadOnStart: true,
	mailParserOptions: {
		streamAttachments: true
	}, // Options to be passed to mailParser lib.
	attachments: false
});

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let gBot;
const reload = async () => {
	ml.removeAllListeners();
	log.error(`Bot has disconnected from IMAP server.`);
	await delay(10000);
	log.info(`Attempting to reconnect.`);
	this.watcher(gBot);
};

exports.watcher = async bot => {
	// Startup process for watcher
	this.disable();
	await delay(5000);
	log.verbose('Starting IMAP connection.');
	ml.on('server:connected', () => {
		log.verbose(`${exports.data.name} has initialised successfully and connected to the IMAP server.`);
	});
	ml.on('server:disconnected', reload);
	ml.on('error', err => {
		log.error(`Issue with IMAP: ${err.stack}`);
	});
	ml.on('mail', async (mail, seqno, attributes) => {
		try {
			log.debug(`New email received from "${mail.headers.from}" with subject "${mail.subject}".`);
			const mailWatchers = await MailWatch.findAll({where: {address: mail.from[0].address}});
			if (mailWatchers.length > 0) {
				ml.imap.addFlags(attributes.uid, '\\Seen', err => {
					if (!err) {
						log.debug('Mail has been set as read.');
					}
				});
				log.info(`New email received from "${mail.headers.from}" with subject "${mail.subject}".`);
				let screenshotDone = true;
				let screenshotURL = `https://cdn.artemisbot.uk/mail/${mail.from[0].name}-${mail.date.toISOString()}.jpg`;
				try {
					await util.promisify(webshot)(mail.html, `/var/www/cdn/mail/${mail.from[0].name}-${mail.date.toISOString()}.jpg`, {
						shotSize: {
							width: 'all',
							height: 'all'
						},
						zoomFactor: 1.5,
						quality: 100,
						siteType: 'html',
						defaultWhiteBackground: true
					});
					log.verbose('Screenshot created.');
				} catch (err) {
					screenshotDone = false;
					screenshotURL = '';
					log.error(`Error when generating webshot screenshot: ${err.stack}`);
				}

				const embed = new Discord.RichEmbed({
					author: {
						name: `A new email has been received from ${mail.headers.from}`,
						icon_url: 'https://cdn.artemisbot.uk/img/ocel.jpg'
					},
					description: `**Subject:** ${mail.subject}`,
					color: 0x993E4D,
					image: screenshotDone ? {
						url: screenshotURL
					} : null,
					footer: {
						text: 'Sent',
						icon_url: 'https://cdn.artemisbot.uk/img/mail.png'
					},
					timestamp: mail.date
				});
				if (['info@wakingtitan.com', 'info@ware-mail.cloud'].includes(mail.from[0].address)) {
					let previewObj;
					if (screenshotDone) {
						const tm = new TwitterMedia(config.WTTwitterMedia);
						try {
							const imageBuffer = jetpack.read(`/var/www/cdn/mail/${mail.from[0].name}-${mail.date.toISOString()}.jpg`, 'buffer');
							previewObj = await tm.uploadMedia('image', imageBuffer);
							log.verbose('Uploaded email preview to Twitter.');
						} catch (err) {
							log.verbose('Could not upload email preview to Twitter.');
							screenshotDone = false;
						}
					}
					await T.post('statuses/update', {
						status: mail.subject.length <= (216 - mail.headers.from.length) ?
							`A new email has been received from ${mail.headers.from} with subject "${mail.subject}" #WakingTitan` :
							`A new email has been received from ${mail.headers.from} with subject "${mail.subject.slice(0, 215 - mail.headers.from.length)}…" #WakingTitan`,
						media_ids: screenshotDone ? previewObj.media_id_string : ''
					});
				}
				await Promise.all(mailWatchers.map(watch =>
						// Send embed to watching discord channels
						bot.channels.get(watch.channelID).send('', {
							embed
						})
					));
			}
		} catch (err) {
			log.error(`Something went wrong: ${err}`);
		}
	});
	ml.start();
};

exports.start = async (msg, bot, args) => {
	// Process for new channel/watched item
	try {
		if (args.length <= 0) {
			return msg.reply('Please add an email address.');
		}
		await MailWatch.sync();
		if (await MailWatch.findOne({where: {address: args[0], channelID: msg.channel.id}})) {
			return msg.reply(`I am already watching ${args[0]} in this channel.`);
		}
		MailWatch.create({
			address: args[0],
			channelID: msg.channel.id
		});
		log.info(`Now watching for mail from "${args[0]}" in ${msg.channel.name} on ${msg.guild.name}.`);
		await msg.reply(`Now watching for mail from "${args[0]}" in this channel.`);
	} catch (err) {
		msg.reply('Couldn\'t watch this address! Check the logs.');
		log.error(`Couldn't start watching a new email address: ${err}`);
	}
};

exports.stop = async (msg, bot, args) => {
    // Process for removing channel/watched item
	try {
		if (args.length <= 0) {
			return msg.reply('Please add an email address.');
		}
		await MailWatch.sync();
		const watcher = await MailWatch.findOne({where: {address: args[0], channelID: msg.channel.id}});
		if (!watcher) {
			return msg.reply(`"${args[0]}" was not being watched in this channel.`);
		}
		await watcher.destroy();
		log.info(`Stopped watching for mail from "${args[0]}" in ${msg.channel.name} on ${msg.guild.name}.`);
		await msg.reply(`Stopped watching for mail from "${args[0]}" in this channel.`);
	} catch (err) {
		msg.reply('Couldn\'t remove this address! Check the logs.');
		log.error(`Couldn't stop watching a stream: ${err}`);
	}
};

exports.list = async (msg, bot, args) => {
	const channelID = args[0] && bot.channels.has(args[0]) ? args[0] : msg.channel.id;
	const channel = bot.channels.get(args[0]) || msg.channel;
	const fields = (await MailWatch.findAll({where: {channelID}})).map(watch => {
		return {
			name: watch.address,
			value: `Created ${moment(watch.createdAt).fromNow()}`,
			inline: true
		};
	});
	if (fields.length > 0) {
		msg.reply('', {embed: {
			author: {
				name: `Mail watchers running in #${channel.name} on ${channel.guild.name}`,
				icon_url: 'https://cdn.artemisbot.uk/img/mail.png?c'
			},
			fields,
			color: 0x993E4D,
			footer: {
				icon_url: 'https://cdn.artemisbot.uk/img/ocel.jpg',
				text: 'Ocel'
			}
		}});
	} else {
		msg.reply(`There are no mail watchers in ${args[0] && bot.channels.has(args[0]) ? `#${channel.name} on ${channel.guild.name}` : 'this channel'}.`);
	}
};

exports.disable = () => {
	try {
		ml.removeAllListeners();
		ml.stop();
	} catch (err) {
		log.error(`Failed to stop listener: ${err}`);
	}
};
