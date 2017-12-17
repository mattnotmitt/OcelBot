exports.data = {
	name: 'Emote List',
	description: 'Lists available emotes.',
	group: 'emotes',
	command: 'emotelist',
	syntax: 'emotelist',
	author: 'Matt: matt@artemisbot.uk',
	permissions: 0
};

const Discord = require('discord.js');
const log = require('../lib/log.js')(exports.data.name);
const Emote = require('../lib/models/emote');
const EmoteLog = require('../lib/models/emotelog');

exports.func = async (msg, args, bot) => {
	await Promise.all([Emote.sync(), EmoteLog.sync()]);
	const guildId = msg.server.sister || msg.guild.id;
	const guildEmotes = await Emote.findAll({where: {guildId}});
	log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has listed the availiable emotes in #${msg.channel.name} on ${msg.guild.name}.`);
	if (guildEmotes.length === 0) {
		return msg.reply('There are no emotes in this server! How boring.');
	}
	const emotes = new Discord.RichEmbed({
		title: msg.server.sister ? `__Emotes in ${msg.guild.name} (Sister server of ${bot.guilds.get(guildId).name})__` : `__Emotes in ${msg.guild.name}__`,
		// Description: `The available emotes on this server can be viewed at https://ocel.artemisbot.uk/emotes/${guildId}`,
		color: 2212073
	});
	for (const emote of guildEmotes) {
		emotes.addField(`:${emote.name}:`, `Used: ${await EmoteLog.count({where: {emoteID: emote.emoteID}})} time(s)`, true);
	}
	const dm = await msg.author.createDM();
	dm.send('', {
		embed: emotes
	}).then(() => msg.reply('I have DMed you with the avaliable emotes in this server.')).catch(err => {
		log.error(`Could not DM user: ${err}.`);
		msg.reply(`I could not DM you, please check your settings.`);
	});
};
