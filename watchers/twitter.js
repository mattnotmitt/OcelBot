exports.data = {
	name: 'Twitter Watcher',
	nick: 'twitter',
	command: 'twitter',
	description: 'Creates a watcher for tweets.',
	author: 'Matt C: matt@artemisbot.uk'
};

const Twit = require('twit');
const Discord = require('discord.js');
const he = require('he');
const chalk = require('chalk');
const uuidv4 = require('uuid/v4');
const config = require('../config.json');
const log = require('../lib/log')(exports.data.name);
const TwitterWatch = require('../lib/models/twitterwatch');

const T = new Twit(config.twitter);

let botStream;

const getFollowList = watchers => {
	const follow = [];
	watchers.forEach(watch => {
		if (!follow.includes(watch.twitterID)) {
			follow.push(watch.twitterID);
		}
	});
	console.log(follow.join(', '));
	return follow.join(', ');
};

// Handles adding and removing of followed Twitter accounts
exports.start = async (msg, bot, args) => {
	try {
		let name;
		let userId;
		if (args[0][0] === '@') {
			args[0] = args[0].substr(1);
		}
		try {
			if (args[0].match(/^[0-9]+$/)) {
				userId = args[0];
				name = (await T.get('users/show', {user_id: args[0]})).data.screen_name;
			} else {
				name = args[0];
				userId = (await T.get('users/show', {screen_name: args[0]})).data.id_str;
			}
		} catch (err) {
			log.error(`Initialisation of twitter stream failed: ${err}`);
		}
		await TwitterWatch.sync();
		TwitterWatch.create({
			watchID: uuidv4(),
			twitterID: userId,
			twitterName: name,
			channelID: msg.channel.id,
			replies: args[1]
		});
		await msg.reply(`I am now watching ${name} in this channel.`);
		this.watcher(bot);
	} catch (err) {
		msg.reply('Couldn\'t watch this user! Check the logs.');
		log.error(`Couldn't start watching a new user: ${err}`);
	}
};

// Watches the specified twitter accounts
exports.watcher = async bot => {
	await TwitterWatch.sync();
	let watchers = await TwitterWatch.all();
	try {
		botStream.stop();
	} catch (err) {
		// Do nothing
	}
	botStream = T.stream('statuses/filter', {
		follow: getFollowList(watchers)
	});
	botStream.on('connected', () => {
		log.verbose('Connected to Twitter stream API.');
	});
	botStream.on('tweet', async tweet => {
		await TwitterWatch.sync();
		const embed = new Discord.RichEmbed({
			color: 0x00ACED,
			author: {
				name: `${tweet.user.name} - @${tweet.user.screen_name}`,
				icon_url: tweet.user.profile_image_url,
				url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
			},
			description: he.decode(tweet.text),
			timestamp: (new Date(tweet.created_at)).toISOString(),
			footer: {
				text: `|`,
				icon_url: 'https://artemisbot.uk/i/nb7ko.png'
			}
		});
		watchers = await TwitterWatch.findAll({where: {twitterID: tweet.user.id_str}});
		if (watchers.length > 0) {
			log.verbose(`User ${tweet.user.screen_name} has just tweeted at ${tweet.created_at}.`);
			watchers.forEach(watch => {
				if (!tweet.in_reply_to_user_id || watch.replies) {
					bot.channels.get(watch.channelID).send('', {embed});
				}
			});
		}
	});
	botStream.on('error', err => {
		log.error(`Twitter Stream has exited with error: ${err}`);
		this.watcher(bot);
	});
	log.verbose(chalk.green(`${exports.data.name} has initialised successfully.`));
};

exports.disable = () => {
	botStream.stop();
};
