exports.data = {
	name: 'Watchers',
	command: 'watcher',
	description: 'Watcher functions',
	group: 'system',
	syntax: 'watcher [start|stop|enable|disable|list] [watcherName] [params]',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 3,
	anywhere: true
};

const jetpack = require('fs-jetpack');
const Watcher = require('../lib/models/watcher');
const log = require('../lib/log')(exports.data.name);

exports.func = async (msg, args, bot) => {
	const watcherData = jetpack.read('/home/matt/mattBot/watcherData.json', 'json');
	try {
		if (args[0] === 'start') {
			if (bot.watchers.has(args[1])) {
				bot.watchers.get(args[1]).start(msg, bot, args.slice(2));
			} else {
				msg.reply('Selected watcher does not exist.');
			}
		} else if (args[0] === 'stop') {
			if (bot.watchers.has(args[1])) {
				bot.watchers.get(args[1]).stop(msg, bot, args.slice(2));
			} else {
				msg.reply('Selected watcher does not exist.');
			}
		} else if (args[0] === 'enable') {
			if (bot.watchers.has(args[1]) || jetpack.list('./watchers/').includes(`${args[1]}.js`)) {
				if (watcherData[args[1]].enable) {
					msg.reply('Enable failed: watcher already enabled.');
				} else {
					bot.watcherEnable(args[1], watcherData);
					msg.reply('Enable successful.');
				}
			} else {
				msg.reply('Selected watcher does not exist.');
			}
		} else if (args[0] === 'disable') {
			if (bot.watchers.has(args[1])) {
				if (watcherData[args[1]].enable) {
					bot.watcherDisable(args[1], watcherData);
					msg.reply('Disable successful.');
				} else {
					msg.reply('Disable failed: watcher already disabled.');
				}
			} else {
				msg.reply('Selected watcher does not exist.');
			}
		} else if (args[0] === 'reload') {
			if (bot.watchers.has(args[1])) {
				if (watcherData[args[1]].enable) {
					bot.watcherReload(args[1], watcherData);
					msg.reply('Reload successful.');
				} else {
					msg.reply('Reload failed: watcher already disabled.');
				}
			} else {
				msg.reply('Selected watcher does not exist.');
			}
		} else if (args[0] === 'list') {
			msg.reply('Available watchers are `null`.');
		}
	} catch (err) {
		msg.reply('Something went wrong.');
		log.error(`Something went wrong: ${err}`);
	}
};
