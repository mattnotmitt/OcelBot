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
	await Watcher.sync();
	let watcher = await Watcher.findOne({where: {watcherName: args[1]}});
	try {
		if (args[0] === 'start') {
			if (watcher) {
				if (watcher.disabledGuilds.includes(msg.guild.id)) {
					msg.reply(`This watcher has been disabled in this guild. Re-enable it with \`ocel watcher genable ${args[1]}\`.`);
				} else {
					bot.watchers.get(args[1]).start(msg, bot, args.slice(2));
				}
			} else {
				msg.reply('Selected watcher does not exist.');
			}
		} else if (args[0] === 'stop') {
			if (watcher) {
				if (watcher.disabledGuilds.includes(msg.guild.id)) {
					msg.reply(`This watcher has been disabled in this guild. Re-enable it with \`ocel watcher genable ${args[1]}\`.`);
				} else {
					bot.watchers.get(args[1]).stop(msg, bot, args.slice(2));
				}
			} else {
				msg.reply('Selected watcher does not exist.');
			}
		} else if (args[0] === 'enable') {
			if (watcher || jetpack.list('./watchers/').includes(`${args[1]}.js`)) {
				if (!watcher) {
					watcher = await Watcher.create({
						watcherName: args[1],
						globalEnable: true,
						disabledGuilds: []
					});
				}
				if (watcher.globalEnable) {
					msg.reply('Enable failed: watcher already enabled.');
				} else {
					bot.watcherEnable(args[1], watcher);
					msg.reply('Enable successful.');
				}
			} else {
				msg.reply('Selected watcher does not exist.');
			}
		} else if (args[0] === 'disable') {
			if (watcher) {
				if (watcher.globalEnable) {
					bot.watcherDisable(args[1], watcher);
					msg.reply('Disable successful.');
				} else {
					msg.reply('Disable failed: watcher already disabled.');
				}
			} else {
				msg.reply('Selected watcher does not exist.');
			}
		} else if (args[0].toLowerCase() === 'genable') {
			if (watcher) {
				if (watcher.disabledGuilds.includes(msg.guild.id)) {
					watcher.disabledGuilds.splice(watcher.disabledGuilds.indexOf(msg.guild.id), 1);
					await watcher.update({disabledGuilds: watcher.disabledGuilds});
					msg.reply('Watcher enabled for this guild.');
				} else {
					msg.reply('Enable failed: watcher already enabled for this guild.');
				}
			} else {
				msg.reply('Selected watcher does not exist.');
			}
		} else if (args[0].toLowerCase() === 'gdisable') {
			if (watcher) {
				if (watcher.disabledGuilds.includes(msg.guild.id)) {
					msg.reply('Disable failed: watcher already disabled for this guild.');
				} else {
					watcher.disabledGuilds.push(msg.guild.id);
					await watcher.update({disabledGuilds: watcher.disabledGuilds});
					msg.reply('Watcher disabled for this guild.');
				}
			} else {
				msg.reply('Selected watcher does not exist.');
			}
		} else if (args[0] === 'reload') {
			if (watcher) {
				if (watcher.globalEnable) {
					bot.watcherReload(args[1]);
					msg.reply('Reload successful.');
				} else {
					msg.reply('Reload failed: watcher already disabled.');
				}
			} else {
				msg.reply('Selected watcher does not exist.');
			}
		} else if (args[0] === 'list') {
			const watcherList = (await Watcher.all()).map(w => {
				return w.watcherName;
			}).join(' ,');
			msg.reply(`Available watchers are \`${watcherList}\`.`);
		}
	} catch (err) {
		msg.reply('Something went wrong.');
		log.error(`Something went wrong: ${err}`);
	}
};
