exports.data = {
	name: 'Spoilers',
	description: 'Toggles the "Spoilers" role so that you can see spoilers channels.',
	group: 'roles',
	command: 'spoilers',
	syntax: 'spoilers',
	author: 'Matt C: matt@artemisbot.uk',
	asOnly: true,
	permissions: 0
};

const log = require('../lib/log.js')(exports.data.name);

exports.func = async msg => {
	try {
		if (!msg.guild.available) {
			return msg.reply('The bot cannot communicate with the guild servers. :(');
		}
		if (!(msg.guild.roles.exists('name', 'spoilers'))) {
			msg.reply(`This guild does not have an "Spoilers" role - creating it now.`);
			await msg.guild.createRole({
				name: 'spoilers'
			});
		}
		const spoilRole = msg.guild.roles.find('name', 'spoilers');
		if (msg.member.roles.has(spoilRole.id)) {
			await msg.member.removeRole(spoilRole);
			msg.reply(`"Spoilers" role has been removed, you can no longer access spoiler channels.`);
			log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has been removed from the spoilers role in #${msg.channel.name} on ${msg.guild.name}.`);
		} else {
			await msg.member.addRole(spoilRole);
			msg.reply(`You are now a member of the "Spoilers" role - you will be able to view the spoilers channels on this server.`);
			log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has been added to the spoilers role in #${msg.channel.name} on ${msg.guild.name}.`);
		}
	} catch (err) {
		msg.reply('Couldn\'t modify your roles. If you\'re on invisible mode, please change to `Online`.');
	}
};
