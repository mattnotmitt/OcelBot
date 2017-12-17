exports.data = {
	name: 'Delete Quote',
	description: 'Deletes the specified quote.',
	group: 'quotes',
	command: 'delquote',
	syntax: 'delquote [msg_name]',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 3
};

const jetpack = require('fs-jetpack');
const log = require('../lib/log.js')(exports.data.name);

exports.func = (msg, args) => {
	const quotelist = jetpack.read('quotes.json', 'json');
	const guildId = typeof quotelist[msg.guild.id] === 'string' ? quotelist[msg.guild.id] : msg.guild.id;
	const name = args[0];
	if (args.length !== 1) {
		return msg.reply(`There are not enough arguments in this command. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`);
	}
	if (!quotelist[guildId][name]) {
		return msg.reply('The selected quote does not exist.');
	}
	log.info(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has deleted quote ${name} in #${msg.channel.name} on ${msg.guild.name}.`);
	delete quotelist[guildId][name];
	jetpack.write('quotes.json', quotelist);
	msg.reply(`Quote ${name} has been deleted :(`);
};
