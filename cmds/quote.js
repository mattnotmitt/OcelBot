const jetpack = require('fs-jetpack');

exports.data = {
	name: 'Quotes',
	description: 'Sends a quote to the channel specified.',
	group: 'quotes',
	command: 'quote',
	author: 'Matt C: matt@artemisbot.uk'
};

const log = require('../lib/log.js')(exports.data.name);

exports.func = (msg, quote) => {
	const quotelist = jetpack.read('quotes.json', 'json');
	const guildId = typeof quotelist[msg.guild.id] === 'string' ? quotelist[msg.guild.id] : msg.guild.id;
	if (quotelist[guildId][quote]) {
		log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has used quote ${quote} in #${msg.channel.name} on ${msg.guild.name}.`);
		msg.channel.send(quotelist[guildId][quote]);
	}
};
