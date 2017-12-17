exports.data = {
	name: 'Delete Emote',
	description: 'Deletes the specified emote.',
	group: 'emotes',
	command: 'delemote',
	syntax: 'delemote [emote_name]',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 3
};

const jetpack = require('fs-jetpack');
const log = require('../lib/log.js')(exports.data.name);
const Emote = require('../lib/models/emote');
const EmoteLog = require('../lib/models/emotelog');

exports.func = async (msg, args) => {
	await Promise.all([Emote.sync(), EmoteLog.sync()]);
	const guildId = msg.server.sister || msg.guild.id;
	const name = args[0];
	if (args.length !== 1) {
		return msg.reply(`There are not enough arguments in this command. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`);
	}
	const emoteData = await Emote.findOne({where: {guildId, name}});
	if (!emoteData) {
		return msg.reply('The selected emote does not exist.');
	}
	log.info(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has deleted emote ${name} in #${msg.channel.name} on ${msg.guild.name}.`);
	jetpack.remove(`./emotes/${emoteData.path}`);
	await Promise.all([EmoteLog.destroy({where: {emoteID: emoteData.emoteID}}), emoteData.destroy()]);
	return msg.reply(`Emote ${name} has been deleted :(.`);
};
