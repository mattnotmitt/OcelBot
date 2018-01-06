exports.data = {
	name: 'Waking Titan Terminal Watcher',
	command: 'terminal'
};

const Discord = require('discord.js');
const moment = require('moment');
const Twit = require('twit');
const config = require('../config.json');
const TerminalWatch = require('../lib/models/terminalwatch');
const wterminal = require('../cmds/wterminal.js').runCommand;
const log = require('../lib/log.js')(exports.data.name);

let repeat;

const T = new Twit(config.WTTwitter);

const checkCommands = async bot => {
	await TerminalWatch.sync();
	(await TerminalWatch.findAll({attributes: ['command', 'message'], group: ['command', 'message']})).forEach(async watch => {
		try {
			const commandArr = watch.command.split(' ');
			const resp = await wterminal(commandArr[0], commandArr.slice(1));
			const statMsg = resp.data.redirect ? `[${resp.data.message.join('\n')}](${resp.data.redirect})` : `${resp.data.message.join('\n')}`;
			if (statMsg === watch.message) {
				return log.debug(`Command \`${watch.command}\` has not changed.`);
			}
			log.info(`Command \`${watch.command} has changed.`);
			const embed = new Discord.RichEmbed({
				author: {
					name: `The value of the ${watch.command} command has updated.`,
					icon_url: 'https://cdn.artemisbot.uk/img/hexagon.png',
					url: 'http://wakingtitan.com'
				},
				title: `**> \`${watch.command}\`**`,
				description: `\`${statMsg}\``,
				color: resp.success ? 0x00FC5D : 0xF00404,
				footer: {
					text: 'Watching Titan',
					icon_url: 'https://cdn.artemisbot.uk/img/watchingtitan.png'
				},
				timestamp: moment().toISOString()
			});
			await T.post('statuses/update', {status: statMsg.length <= (204 - watch.command.length) ? `The wakingtitan.com ${watch.command} command has been updated to say "${statMsg}" #WakingTitan` : `The wakingtitan.com ${watch.command} command has been updated to say "${statMsg.slice(0, 203 - watch.command.length)}…" #WakingTitan`});
			Promise.all((await TerminalWatch.findAll({where: {command: watch.command}})).map(watcher =>
				Promise.all([watcher.update({message: statMsg}), bot.channels.get(watcher.channelID).send('', {embed})])
			));
		} catch (err) {
			log.error(`Something went wrong: ${err}`);
		}
	});
};

exports.watcher = bot => {
	this.disable();
	repeat = setInterval(async () => {
		checkCommands(bot);
	}, 30 * 1000);
	log.verbose(`${exports.data.name} has initialised successfully.`);
};

exports.start = async (msg, bot, args) => {
	try {
		await TerminalWatch.sync();
		const command = args.join(' ');
		if (args.length === 0) {
			return msg.reply('You must provide at least 1 command for the bot to run.');
		}
		if (await TerminalWatch.findOne({where: {channelID: msg.channel.id, command}})) {
			return msg.reply(`I am already watching the \`${command}\` command in this channel.`);
		}
		const resp = await wterminal(args[0], args.slice(1));
		const message = resp.data.redirect ? `[${resp.data.message.join('\n')}](${resp.data.redirect})` : `${resp.data.message.join('\n')}`;
		log.info(`Now outputting \`${command}\` command updates to #${msg.channel.name} in ${msg.guild.name}.`);
		msg.reply(`Now outputting \`${command}\` command updates to this channel.`);
		await TerminalWatch.create({
			channelID: msg.channel.id,
			command,
			message
		});
	} catch (err) {
		msg.reply('Couldn\'t watch this command! Check the logs.');
		log.error(`Couldn't start watching a new command: ${err}`);
	}
};

exports.stop = async (msg, bot, args) => {
	const command = args.join(' ');
	if (args.length === 0) {
		return msg.reply('Please specify a command to stop watching.');
	}
	const watch = await TerminalWatch.findOne({where: {channelID: msg.channel.id, command}});
	if (watch) {
		watch.destroy();
		log.info(`No longer outputting \`${command}\` command updates to #${msg.channel.name} in ${msg.guild.name}.`);
		msg.reply(`No longer outputting \`${command}\` command updates to this channel.`);
	} else {
		return msg.reply(`This channel is not receiving updates on the \`${command}\` command.`);
	}
};

exports.disable = () => {
	clearInterval(repeat);
};
