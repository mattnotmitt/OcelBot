// ==== Import modules ====
// External modules
const Discord = require('discord.js');
const jetpack = require('fs-jetpack');
const chalk = require('chalk');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// Database modules
const Database = require('./lib/db');
const Server = require('./lib/models/server');
const Watcher = require('./lib/models/watcher');
// Logging module
const log = require('./lib/log')('Core');
const OcelAPI = require('./lib/ocel-api');
// ==== Initialisation ====
const bot = new Discord.Client();

bot.config = require('./config.json');

bot.db = Database.start();

bot.router = express();
bot.router.use(bodyParser.json());
bot.router.use(cors());
OcelAPI(bot.router);
bot.router.listen(12000, () => log.info('Express router listening on port 12000.'));

// Function to load commands into bot
bot.loadCmds = () => {
	return new Promise((resolve, reject) => {
		try {
			const cmds = new Discord.Collection();
			const cmdList = jetpack.list('./cmds/');
			const loadedList = [];
			cmdList.forEach(f => {
				try {
					const props = require(`./cmds/${f}`);
					log.verbose(`Loading Command: ${props.data.name}. 👌`);
					loadedList.push(props.data.name);
					cmds.set(props.data.command, props);
				} catch (err) {
					reject(err);
				}
			});
			log.info(chalk.green(`Loaded ${loadedList.length} command(s) (${loadedList.join(', ')}).`));
			resolve(cmds);
		} catch (err) {
			reject(err);
		}
	});
};
// Function to load watchers into bot
bot.loadWatchers = bot => {
	return new Promise(async (resolve, reject) => {
		try {
			const watchers = new Discord.Collection();
			const watcherList = jetpack.list('./watchers/');
			const loadedList = [];
			const skippedList = [];
			await Watcher.sync();
			await new Promise((resolve, reject) => {
				watcherList.forEach(async f => {
					try {
						const props = require(`./watchers/${f}`);
						await Watcher.sync();
						let watcher = await Watcher.findOne({where: {watcherName: props.data.command}});
						if (!watcher) {
							watcher = await Watcher.create({
								watcherName: props.data.command,
								globalEnable: true,
								disabledGuilds: []
							});
						}
						if (watcher.globalEnable) {
							log.verbose(`Loading Watcher: ${props.data.name}. 👌`);
							loadedList.push(props.data.name);
							watchers.set(props.data.command, props);
							props.watcher(bot);
						} else {
							log.verbose(`Skipped loading ${props.data.name} as it is disabled. ❌`);
							skippedList.push(props.data.name);
						}
					} catch (err) {
						reject(err);
					}
					resolve();
				});
			});
			log.info(chalk.green(`Loaded ${loadedList.length} watcher(s) (${loadedList.join(', ')}) and skipped ${skippedList.length} (${skippedList.join(', ')}).`));
			resolve(watchers);
		} catch (err) {
			reject(err);
		}
	});
};

bot.on('ready', async () => {
	try {
		log.info(chalk.green(`Connected to Discord gateway & ${bot.guilds.size} guilds.`));
		bot.user.setGame('ocel help');
		[bot.commands, bot.watchers] = await Promise.all([bot.loadCmds(bot), bot.loadWatchers(bot)]);
		bot.guilds.keyArray().forEach(async id => {
			const guild = bot.guilds.get(id);
			await Server.sync();
			const server = await Server.findOne({
				where: {
					guildId: id
				}
			});
			if (server) {
				if (server.emotes === null && server.quotes === null) {
					log.info(`${server.name} has not been set up properly. Make sure it is set up correctly to enable all functionality.`);
				}
			} else {
				const server = await Server.create({
					guildId: id,
					name: guild.name,
					permitChan: [],
					perm3: [],
					perm2: [],
					perm1: []
				});
				log.info(`${server.name} has not been set up properly. Make sure it is set up correctly to enable all functionality.`);
			}
		});
	} catch (err) {
		log.error(`Error in bot initialisation: ${err}`);
	}
	// Bot.emotes = bot.commands.get('emote').refreshEmoteCache();
});

bot.on('message', async msg => {
	try {
		if (msg.author.id === bot.user.id || msg.author.bot || !msg.guild) {
			return;
		}
		msg.server = await Server.findOne({
			where: {
				guildId: msg.guild.id
			}
		});
		let command;
		let args;
		let emotes;
		let quotelist;
		const notCommand = [bot.config.prefix, msg.server.altPrefix, `<@${bot.user.id}>`, `<@!${bot.user.id}>`].every(prefix => {
			if (msg.content.toLowerCase().startsWith(prefix)) {
				command = msg.content.slice(prefix.length).trim().split(' ')[0];
				args = msg.content.slice(prefix.length).trim().split(' ').slice(1);
				if (msg.server.quotes && prefix === msg.server.altPrefix) {
					quotelist = jetpack.read('quotes.json', 'json');
				}
				return false;
			}
			return true;
		});
		// Log.verbose(`${msg.author.username}#${msg.author.discriminator}: notCommand: ${notCommand}`);
		if (msg.content.match(/:(.+?):/g) && msg.server.emotes) {
			emotes = msg.content.match(/:(.+?):/g);
		} else if (notCommand) {
			return;
		}
		let cmd;
		const elevation = await bot.elevation(msg);
		if (bot.commands.has(command) && (command !== 'emote' && command !== 'quote')) {
			cmd = bot.commands.get(command);
		} else if (emotes) {
			bot.commands.get('emote').func(msg, emotes);
		} else if (quotelist ? quotelist[msg.guild.id][command] : false) {
			bot.commands.get('quote').func(msg, command, bot);
		}
		if (cmd &&
			(cmd.data.anywhere || elevation >= 3 || msg.server.permitChan.includes(msg.channel.id)) &&
			(!cmd.data.asOnly || msg.guild.id === '263785005333872640') &&
			(cmd.data.group === 'emotes' ? msg.server.emotes : true) &&
			(cmd.data.group === 'quotes' ? msg.server.quotes : true)) {
			if (elevation >= cmd.data.permissions) {
				cmd.func(msg, args, bot);
			} else {
				msg.reply(':newspaper2: You don\'t have permission to use this command.');
			}
		}
	} catch (err) {
		log.error(`Something went wrong when handling a message: ${err}`);
	}
});

bot.on('error', console.error);
bot.on('warn', console.warn);

process.on('unhandledRejection', err => {
	log.error(`Uncaught Promise Error: \n${err.stack}`);
});

bot.login(bot.config.token);

bot.reload = command => {
	return new Promise((resolve, reject) => {
		try {
			delete require.cache[require.resolve(`./cmds/${command}.js`)];
			const cmd = require(`./cmds/${command}.js`);
			bot.commands.delete(command);
			bot.commands.set(command, cmd);
			resolve();
		} catch (err) {
			reject(err);
		}
	});
};

bot.enable = command => {
	return new Promise((resolve, reject) => {
		try {
			const cmd = require(`./cmds/${command}.js`);
			bot.commands.set(command, cmd);
			resolve();
		} catch (err) {
			reject(err);
		}
	});
};

bot.disable = command => {
	return new Promise((resolve, reject) => {
		try {
			delete require.cache[require.resolve(`./cmds/${command}.js`)];
			bot.commands.delete(command);
			resolve();
		} catch (err) {
			reject(err);
		}
	});
};

bot.watcherEnable = (watcher, watcherData) => {
	return new Promise(async (resolve, reject) => {
		try {
			const watchProps = require(`./watchers/${watcher}.js`);
			bot.watchers.set(watcher, watchProps);
			bot.watchers.get(watcher).watcher(bot);
			await watcherData.update({globalEnable: true});
			resolve();
		} catch (err) {
			reject(err);
		}
	});
};

bot.watcherDisable = (watcher, watcherData) => {
	return new Promise(async (resolve, reject) => {
		try {
			bot.watchers.get(watcher).disable();
			await watcherData.update({globalEnable: false});
			delete require.cache[require.resolve(`./watchers/${watcher}.js`)];
			bot.watchers.delete(watcher);
			resolve();
		} catch (err) {
			reject(err);
		}
	});
};

bot.watcherReload = watcher => {
	return new Promise((resolve, reject) => {
		try {
			bot.watchers.get(watcher).disable();
			delete require.cache[require.resolve(`./watchers/${watcher}.js`)];
			bot.watchers.delete(watcher);
			const watchProps = require(`./watchers/${watcher}.js`);
			bot.watchers.set(watcher, watchProps);
			bot.watchers.get(watcher).watcher(bot);
			resolve();
		} catch (err) {
			reject(err);
		}
	});
};

bot.elevation = msg => {
	return new Promise(async (resolve, reject) => {
		try {
			if (msg.author.id === bot.config.ownerID) {
				resolve(4);
			}
			const server = await Server.findOne({
				where: {
					guildId: msg.guild.id
				}
			});
			server.perm3.forEach(id => {
				if (msg.member.roles.has(id)) {
					resolve(3);
				}
			});
			server.perm2.forEach(id => {
				if (msg.member.roles.has(id)) {
					resolve(2);
				}
			});
			server.perm1.forEach(id => {
				if (msg.member.roles.has(id)) {
					resolve(1);
				}
			});
			resolve(0);
		} catch (err) {
			reject(err);
		}
	});
};
