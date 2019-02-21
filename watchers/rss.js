exports.data = {
	name: 'RSS Watcher',
	nick: 'rss',
	command: 'rss',
	description: 'Creates a watcher for rss feeds.',
	author: 'Matt C: matt@artemisbot.uk'
};

let feeds = [];

const FeedSub = require('feedsub');
const Discord = require('discord.js');
const chalk = require('chalk');
const moment = require('moment');
const he = require('he');
const Twit = require('twit');

const config = require('../config.json');
const log = require('../lib/log')(exports.data.name);
const RSSWatch = require('../lib/models/rsswatch');

const T = new Twit(config.TBTwitter);

const startSub = async bot => {
	await RSSWatch.sync();
	const watches = await RSSWatch.findAll({attributes: ['feedURL'], group: ['feedURL']});
	if (watches.length === 0) {
		return;
	}
	watches.forEach(watch => {
		const reader = new FeedSub(watch.feedURL, {
			interval: 0.5,
			maxHistory: 100
		});
		reader.on('item', async item => {
			const embed = new Discord.RichEmbed({
				title: `**${item.title}**`,
				description: he.decode(item.description).split(' ').slice(0, 30).join(' ') + '...',
				color: 0xF26522,
				timestamp: moment(item.pubdate).toISOString(),
				footer: {
					text: `Published`,
					icon_url: 'https://cdn.artemisbot.uk/img/ocel.jpg'
				}
			});
			await Promise.all((await RSSWatch.findAll({where: {feedURL: watch.feedURL}})).map(watcher => {
				embed.setAuthor(`A new article has been published on ${watcher.feedName} ${item['dc:creator'] ? `by ${item['dc:creator']}` : ''}`,
					'https://cdn.artemisbot.uk/img/rss.png',
					item.link
				);
				return bot.channels.get(watcher.channelID).send('', {embed});
			}));
			if (watch.feedURL === 'https://www.trustnomore.com/feed/') {
				await T.post('statuses/update', {
					status: `A new article has been published on TrustNoMore${item['dc:creator'] ? ` by ${item['dc:creator']}` : ''}: "${item.title}". Check it out here: ${item.link}`
				});
			}
		});
		reader.on('error', error => {
			log.error(error);
		});
		reader.start();
		feeds.push(reader);
	});
};

// Handles adding and removing of followed Twitter accounts
exports.start = async (msg, bot, args) => {
	try {
		await RSSWatch.sync();
		if (!args[0]) {
			return msg.reply('Please include a RSS feed url to watch.');
		}
		if (!args[1]) {
			return msg.reply('Please include a name for this feeed.');
		}
		if (await RSSWatch.findOne({where: {feedURL: args[0], channelID: msg.channel.id}})) {
			return msg.reply(`I am already watching \`${args[0]}\` in this channel.`);
		}
		RSSWatch.create({
			feedURL: args[0],
			feedName: args[1],
			channelID: msg.channel.id
		});
		log.info(`Now watching ${args[0]} in #${msg.channel.name} on ${msg.guild.name}.`);
		await msg.reply(`I am now watching ${args[0]} in this channel.`);
		this.disable();
		startSub(bot);
	} catch (err) {
		msg.reply('Couldn\'t watch this user! Check the logs.');
		log.error(`Couldn't start watching a new user: ${err}`);
	}
};

exports.stop = async (msg, bot, args) => {
	try {
		await RSSWatch.sync();
		if (!args[0]) {
			return msg.reply('Please include a RSS feed to stop watching.');
		}
		const watch = await RSSWatch.findOne({where: {feedURL: args[0], channelID: msg.channel.id}});
		if (!watch) {
			return msg.reply(`I am not watching RSS feed with url \`${args[0]}\` in this channel.`);
		}
		await watch.destroy();
		log.info(`No longer watching ${args[0]} in #${msg.channel.name} on ${msg.guild.name}.`);
		await msg.reply(`I am no longer watching ${args[0]} in this channel.`);
		this.disable();
		startSub();
	} catch (err) {
		msg.reply('Couldn\'t stop watching this user! Check the logs.');
		log.error(`Couldn't stop watching a user: ${err}`);
	}
};

// Watches the specified twitter accounts
exports.watcher = async bot => {
	startSub(bot);
	log.verbose(chalk.green(`${exports.data.name} has initialised successfully.`));
};

exports.list = async (msg, bot, args) => {
	const channelID = args[0] && bot.channels.has(args[0]) ? args[0] : msg.channel.id;
	const channel = bot.channels.get(args[0]) || msg.channel;
	const fields = (await RSSWatch.findAll({where: {channelID}})).map(watch => {
		return {
			name: `${watch.feedURL}`,
			value: `Created ${moment(watch.createdAt).fromNow()}`,
			inline: true
		};
	});
	if (fields.length > 0) {
		msg.reply('', {embed: {
			author: {
				icon_url: 'https://cdn.artemisbot.uk/img/rss.png',
				name: `RSS Feed watchers running in #${channel.name} on ${channel.guild.name}`
			},
			fields,
			color: 0xF26522,
			footer: {
				icon_url: 'https://cdn.artemisbot.uk/img/ocel.jpg',
				text: 'Ocel'
			}
		}});
	} else {
		msg.reply(`There are no RSS feed watchers in ${args[0] && bot.channels.has(args[0]) ? `#${channel.name} on ${channel.guild.name}` : 'this channel'}.`);
	}
};

exports.disable = () => {
	feeds.forEach(feed => feed.stop());
	feeds = [];
};
