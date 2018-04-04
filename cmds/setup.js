exports.data = {
	name: 'Server Setup',
	command: 'setup',
	description: 'Setup specific server options.',
	group: 'system',
	syntax: 'setup',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 3
};

const moment = require('moment');
const log = require('../lib/log.js')(exports.data.name);
const Server = require('../lib/models/server');

const reactionStuff = (qNum, msg, dm) => {
	const setupEmbeds = [
		{
			embed: {
				title: `Ocel Server setup for ${msg.guild.name}. Page 1/x`,
				description: `Would you like to enable emotes on this server?`,
				color: 2212073
			},
			type: 'y/n'
		},
		{
			embed: {
				title: `Ocel Server setup for ${msg.guild.name}. Page 2/x`,
				description: `Would you like to enable quotes on this server?`,
				color: 2212073
			},
			type: 'y/n'
		}
	];
	const reactTypes = {
		'y/n': {
			'☑': true,
			'❌': false
		}
	};
	return new Promise(async (resolve, reject) => {
		try {
			const dMsg = await dm.send('', {embed: setupEmbeds[qNum].embed});
			await Promise.all(Object.keys(reactTypes[setupEmbeds[qNum].type]).map(emote => dMsg.react(emote)));
			const response = await dMsg.awaitReactions((react, user) => {
				if (user.id === msg.author.id) {
					return true;
				}
				return false;
			}, {max: 1});
			resolve(reactTypes[setupEmbeds[qNum].type][response.first().emoji.name]);
		} catch (err) {
			reject(err);
		}
	});
};

exports.func = async msg => {
	try {
		log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has started to setup a server in #${msg.channel.name} on ${msg.guild.name}.`);
		if (msg.member.hasPermission('ADMINISTRATOR') || msg.elevation === 4) {
			const server = await Server.findOne({
				where: {
					guildId: msg.guild.id
				}
			});
			await msg.reply('Setup will continue in DMs.');
			const dm = await msg.author.createDM();
			const emotes = await reactionStuff(0, msg, dm);
			const quotes = await reactionStuff(1, msg, dm);
			server.update({
				emotes,
				quotes
			});
			await dm.send('Server setup complete. Rerun the command to change any settings.');
		} else {
			msg.reply(':newspaper2: You don\'t have permission to use this command. You must have the Administrator permission on a server to configure its settings.');
		}
		/*
		Let roleList = '';
		msg.guild.roles.keyArray().forEach(key => roleList += `${msg.guild.roles.get(key).name}: ${key}\n`);
		// Msg.reply(roleList);
		const dm = await msg.author.createDM();
		dm.send(`\`\`\`${roleList}\`\`\``);

		const server = await Server.findOne({
			where: {
				guildId: msg.guild.id
			}
		});
		await server.update({
			altPrefix: '&'
		});
		*/
		msg.reply('Server has been set up.');
	} catch (err) {
		log.error(`Something went wrong: ${err}`);
	}
};
