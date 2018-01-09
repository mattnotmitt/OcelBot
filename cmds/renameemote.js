exports.data = {
	name: 'Rename Emote',
	description: 'Renames the specified emote.',
	group: 'emotes',
	command: 'renameemote',
	syntax: 'delemote [emote name] [new name]',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 2
};

const jetpack = require('fs-jetpack');
const log = require('../lib/log.js')(exports.data.name);
const Emote = require('../lib/models/emote');

exports.func = async (msg, args) => {
	try {
		await Emote.sync();
		const guildId = msg.server.sister || msg.guild.id;
		const name = args[0];
		const newName = args[1];
		if (args.length !== 2) {
			return msg.reply(`you have not provided the correct number of parameters. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`);
		}
		const emoteData = await Emote.findOne({where: {guildId, name}});
		if (!emoteData) {
			return msg.reply('The selected emote does not exist.');
		}
		log.info(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has renamed emote :${name}: to :${newName}: in #${msg.channel.name} on ${msg.guild.name}.`);
		const filename = `${newName}.${emoteData.path.split('.').slice(-1)[0]}`;
		jetpack.rename(`./emotes/${emoteData.path}`, filename);
		await emoteData.update({
			name: newName,
			path: `${guildId}/${filename}`
		});
		return msg.reply(`Emote :${name}: has been renamed to :${newName}:.`);
	} catch (err) {
		msg.reply(`Failed to rename emote.`);
		log.error(`Failed to rename emote: ${err.stack}`);
	}
};
