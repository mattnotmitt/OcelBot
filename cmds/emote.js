exports.data = {
	name: 'Emotes',
	description: 'Sends an emote to the channel specified.',
	group: 'emotes',
	command: 'emote',
	author: 'Matt C: matt@artemisbot.uk'
};

const uuidv4 = require('uuid/v4');
const log = require('../lib/log')(exports.data.name);
const Emote = require('../lib/models/emote');
const EmoteLog = require('../lib/models/emotelog');

exports.func = async (msg, emotes) => {
	await Promise.all([Emote.sync(), EmoteLog.sync()]);
	const guildId = msg.server.sister || msg.guild.id;
	emotes = emotes.filter((e, i, s) => i === s.indexOf(e)).slice(0, 2);
	emotes.forEach(async emote => {
		const emoteData = await Emote.findOne({where: {name: emote.substring(1, emote.length - 1), guildId}});
		if (emoteData) {
			log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has used emote ${emote} in #${msg.channel.name} on ${msg.guild.name}.`);
			await msg.channel.send('', {file: `./emotes/${emoteData.path}`});
			await EmoteLog.create({logID: uuidv4(), emoteID: emoteData.emoteID, userID: msg.author.id, channelID: msg.channel.id, guildID: msg.guild.id});
		}
	});
	// Bot.emotes = this.refreshEmoteCache();
};

/*
Exports.refreshEmoteCache = async () => {
	const emotes = {};
	let i = 0;
	await Emote.sync();
	(await Emote.all()).forEach(emote => {
		emotes[emote.guildId] ? emotes[emote.guildId].push(emote.name) : emotes[emote.guildId] = [emote.name];
		i++;
	});
	log.info(`Cached ${i} emotes.`);
	return emotes;
};
*/
