exports.data = {
	name: 'Emotes',
	description: 'Sends an emote to the channel specified.',
	group: 'emotes',
	command: 'emote',
	author: 'Matt C: matt@artemisbot.uk'
};

const Sequelize = require('sequelize');

const log = require('../lib/log')(exports.data.name);
const Channel = require('../lib/models/channel');
const Emote = require('../lib/models/emote');
const EmoteLog = require('../lib/models/emotelog');
const User = require('../lib/models/user');

exports.func = async (msg, emotes) => {
	await Promise.all([Emote.sync(), EmoteLog.sync(), Channel.sync(), User.sync()]);
	const guildId = msg.server.sister || msg.guild.id;
	emotes = emotes.filter((e, i, s) => i === s.indexOf(e)).slice(0, 2);
	emotes.forEach(async emote => {
		const emoteData = await Emote.findOne({where: {name: emote.substring(1, emote.length - 1), guildId}});
		if (emoteData) {
			log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has used emote ${emote} in #${msg.channel.name} on ${msg.guild.name}.`);
			await Promise.all([msg.channel.send('', {file: `./emotes/${emoteData.path}`}), EmoteLog.create({emoteID: emoteData.emoteID, userID: msg.author.id, channelID: msg.channel.id, guildID: msg.guild.id})]);
			if (!await Channel.findOne({where: {channelID: msg.channel.id}})) {
				await Channel.create({channelID: msg.channel.id, name: msg.channel.name, guildID: msg.guild.id});
			}
			const user = await User.findOne({where: {userID: msg.author.id}});
			if (user) {
				if (!user.guilds.includes(msg.guild.id)) {
					await user.update({guilds: Sequelize.fn('array_append', Sequelize.col('guilds'), msg.guild.id)});
				}
			} else {
				await User.create({userID: msg.author.id, name: msg.author.username, discrim: msg.author.discriminator, guilds: [msg.guild.id]});
			}
		}
	});
};
