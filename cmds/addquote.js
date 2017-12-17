exports.data = {
	name: 'Quote Add',
	description: 'Adds a quote to the bot',
	group: 'quotes',
	command: 'addquote',
	syntax: 'addquote [name] [quote]',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 2
};

const jetpack = require('fs-jetpack');
const log = require('../lib/log.js')(exports.data.name);

exports.func = (msg, args) => {
	const quotelist = jetpack.read('quotes.json', 'json');
	const guildId = typeof quotelist[msg.guild.id] === 'string' ? quotelist[msg.guild.id] : msg.guild.id;
	const name = args[0];
	const mesg = args.slice(1).join(' ');
	if (args.length === 0) {
		return msg.reply(`You didn't include a quote or a name! The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`);
	}
	if (args.length < 2) {
		return msg.reply(`There are not enough arguments in this command. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`);
	}
	if (jetpack.list('./cmds/').includes(`${name}.js`)) {
		return msg.reply(`You cannot create a quote with the same name as a core bot command.`);
	}
	if (quotelist[guildId][name]) {
		return msg.reply('That quote already exists!');
	}
	log.info(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has added the quote ${name} in #${msg.channel.name} on ${msg.guild.name}.`);
	quotelist[guildId][name] = mesg;
	msg.reply(`Quote ${name} has been added!`);
	jetpack.write('quotes.json', quotelist);
};
