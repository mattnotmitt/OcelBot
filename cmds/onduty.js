exports.data = {
	name: 'Active Agent',
	description: 'Toggles the "Active Agent" role so that users in need of help can tag you.',
	group: 'help',
	command: 'onduty',
	syntax: 'onduty',
	author: 'Matt C: matt@artemisbot.uk',
	asOnly: true,
	permissions: 0
};

const log = require('../lib/log.js')(exports.data.name);

exports.func = async msg => {
	try {
		if (!(msg.guild.available)) {
			return msg.reply('The bot cannot communicate with the guild servers. :(');
		}
		if (!(msg.guild.roles.exists('name', 'Active Agent'))) {
			msg.reply(`This guild does not have an "Active Agent" role - creating it now.`).then(m => m.delete(5000));
			await msg.guild.createRole({
				name: 'Active Agent',
				mentionable: true
			});
		}
		const dutyRole = msg.guild.roles.find('name', 'Active Agent');
		if (msg.member.roles.has(dutyRole.id)) {
			msg.member.removeRole(dutyRole);
			msg.reply(`"Active Agent" role has been removed, thank you for your help!`);
			log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has been removed from duty in #${msg.channel.name} on ${msg.guild.name}.`);
		} else {
			msg.member.addRole(dutyRole);
			msg.reply(`You are now on duty - users will be able to ping you and other agents with this role to ask for help.`);
			log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has gone on duty in #${msg.channel.name} on ${msg.guild.name}.`);
		}
	} catch (err) {
		msg.reply('Couldn\'t modify your roles. If you\'re on invisible mode, please change to `Online`.');
	}
};
