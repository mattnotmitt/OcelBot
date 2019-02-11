exports.data = {
	name: 'TBW Helper Duty',
	description: 'Toggles the "TBW Helper" role so that users in need of help can tag you.',
	group: 'help',
	command: 'ondutytbw',
	syntax: 'ondutytbw',
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
		if (!(msg.guild.roles.exists('name', 'TBW Helper'))) {
			msg.reply(`This guild does not have an "TBW Helper" role - creating it now.`).then(m => m.delete(5000));
			await msg.guild.createRole({
				name: 'TBW Helper',
				hoist: true
			});
		}
		if (!(msg.guild.roles.exists('name', 'Online TBW Helpers'))) {
			msg.reply(`This guild does not have an "Online TBW Helpers" role - creating it now.`).then(m => m.delete(5000));
			await msg.guild.createRole({
				name: 'Online TBW Helpers',
				mentionable: true
			});
		}
		const dutyRole = msg.guild.roles.find('name', 'TBW Helper');
		if (msg.member.roles.has(dutyRole.id)) {
			await msg.member.removeRole(dutyRole);
			msg.reply(`"TBW Helper" role has been removed, thank you for your help!`);
			log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has been removed from duty for TBW in #${msg.channel.name} on ${msg.guild.name}.`);
		} else {
			await msg.member.addRole(dutyRole);
			msg.reply(`You are now on duty - users will be able to ping you and other agents with the TBW Helper role to ask for help with The Black Watchmen.`);
			log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has gone on duty for TBW in #${msg.channel.name} on ${msg.guild.name}.`);
		}
	} catch (err) {
		msg.reply('Couldn\'t modify your roles. If you\'re on invisible mode, please change to `Online`.');
	}
};
