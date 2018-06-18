exports.data = {
	name: 'SatCom Uplink Sleeper Watcher',
	command: 'sleepers'
};

const Discord = require('discord.js');
const moment = require('moment');
const Twit = require('twit');
const config = require('../config.json');
const Sleepers = require('../lib/models/sleepers');
const sleeper = require('../cmds/sleepers.js').runCommand;
const log = require('../lib/log.js')(exports.data.name);

let repeat;

// Const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const T = new Twit(config.WTTwitter);

const checkCommands = async bot => {
	try {
		await Sleepers.sync();
		const sleepers = await Sleepers.findAll({attributes: ['sleeperID', 'blocks'], group: ['sleeperID']});
		log.debug(`Checking sleepers: ${sleepers.map(command => command.sleeperID).join(', ')}`);
		const result = await Promise.all(sleepers.map(async watch => {
			return new Promise(async (resolve, reject) => {
				try {
					const commandArr = watch.command.split(' ');
					const resp = await sleeper(commandArr[0], commandArr.slice(1));
					if (resp.blocks === watch.blocks) {
						// Log.debug(`Command \`${watch.command}\` has not changed.`);
						return resolve(false);
					}
					log.info(`Sleeper \`${resp.name} has changed.`);
					const embed = new Discord.RichEmbed({
						author: {
							name: `Sleeper ${resp.name} has updated.`,
							icon_url: 'https://cdn.artemisbot.uk/img/hexagon.png',
							url: 'http://uplink.satcom-70.com/dashboard/'
						},
						title: `**> \`Sleeper ${resp.name} has updated.\`**`,
						description: `\`${resp.blocks.filter((ele, ind) => {
                            return (watch.blocks[ind].is_active !== ele.is_active)
                        }).map((e) => `Memory block ${e.svg_element_name} is now active!`).join('\n')}\``,
						color: 0x00FC5D,
						footer: {
							text: 'Watching Titan',
							icon_url: 'https://cdn.artemisbot.uk/img/watchingtitan.png'
						},
						timestamp: moment().toISOString()
					});
					await T.post('statuses/update', {status: `Sleeper ${resp.name}'s memory block has been activated! #WakingTitan`});
					await Promise.all((await Sleepers.findAll({where: {sleeperID: resp.id}})).map(watcher =>
						Promise.all([watcher.update({blocks: resp.blocks}), bot.channels.get(watcher.channelID).send('', {embed})])
					));
					resolve(true);
				} catch (err) {
					log.error(`Something went wrong: ${err}`);
					reject(err);
				}
			});
		}));
		if (!result.includes(true)) {
			log.debug('No commands have changed.');
		}
	} catch (err) {
		log.error('Failed to check all commands.');
	}
	repeat = setTimeout(async () => {
		checkCommands(bot);
	}, 15 * 1000);
};

exports.watcher = bot => {
	this.disable();
	repeat = setTimeout(async () => {
		checkCommands(bot);
	}, 15 * 1000);
	log.verbose(`${exports.data.name} has initialised successfully.`);
};

exports.start = async (msg, bot, args) => {
	try {
		await Sleepers.sync();
		const command = args.join(' ');
		if (args.length === 0) {
			return msg.reply('You must provide at least 1 sleeper for the bot to run.');
		}
		if (await Sleepers.findOne({where: {channelID: msg.channel.id, name: command.toLowerCase()}})) {
			return msg.reply(`I am already watching the \`${command}\` sleeper in this channel.`);
		}
        const resp = await sleeper(commandArr[0], commandArr.slice(1));
		log.info(`Now outputting \`${command}\` sleeper updates to #${msg.channel.name} in ${msg.guild.name}.`);
		msg.reply(`Now outputting \`${command}\` sleeper updates to this channel.`);
		await Sleepers.create({
			channelID: msg.channel.id,
			name: command.toLowerCase(),
            blocks: resp.blocks,
            sleeperID: resp.id
		});
	} catch (err) {
		msg.reply('Couldn\'t watch this sleeper! Check the logs.');
		log.error(`Couldn't start watching a new sleeper: ${err}`);
	}
};

exports.stop = async (msg, bot, args) => {
	const command = args.join(' ');
	if (args.length === 0) {
		return msg.reply('Please specify a sleeper to stop watching.');
	}
	const watch = await Sleepers.findOne({where: {channelID: msg.channel.id, name: command.toLowerCase()}});
	if (watch) {
		watch.destroy();
		log.info(`No longer outputting \`${command}\` command updates to #${msg.channel.name} in ${msg.guild.name}.`);
		msg.reply(`No longer outputting \`${command}\` command updates to this channel.`);
	} else {
		return msg.reply(`This channel is not receiving updates on the \`${command}\` command.`);
	}
};

exports.list = async (msg, bot, args) => {
	const channelID = args[0] && bot.channels.has(args[0]) ? args[0] : msg.channel.id;
	const channel = bot.channels.get(args[0]) || msg.channel;
	const fields = (await Sleepers.findAll({where: {channelID}})).map(watch => {
		return {
			name: watch.name,
			value: `Created ${moment(watch.createdAt).fromNow()}`,
			inline: true
		};
	});
	if (fields.length > 0) {
		msg.reply('', {embed: {
			author: {
				name: `Sleeper watchers running in #${channel.name} on ${channel.guild.name}`,
				icon_url: 'https://cdn.artemisbot.uk/img/watchingtitan.png?b'
			},
			fields,
			color: 0x993E4D,
			footer: {
				icon_url: 'https://cdn.artemisbot.uk/img/ocel.jpg',
				text: 'Ocel'
			}
		}});
	} else {
		msg.reply(`There are no sleeper watchers in ${args[0] && bot.channels.has(args[0]) ? `#${channel.name} on ${channel.guild.name}` : 'this channel'}.`);
	}
};

exports.disable = () => {
	clearTimeout(repeat);
};
