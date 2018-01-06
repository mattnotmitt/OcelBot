exports.data = {
	name: 'Quote List',
	description: 'Lists available quotes.',
	group: 'quotes',
	command: 'quotelist',
	syntax: 'quotelist',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 0
};

const jetpack = require('fs-jetpack');
const Discord = require('discord.js');
const log = require('../lib/log.js')(exports.data.name);

exports.func = async (msg, args, bot) => {
	try {
		const quotelist = jetpack.read('quotes.json', 'json');
		const guildId = typeof quotelist[msg.guild.id] === 'string' ? quotelist[msg.guild.id] : msg.guild.id;
		log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has listed the available quotes in #${msg.channel.name} on ${msg.guild.name}.`);
		if (Object.keys(quotelist[guildId]).length === 0) {
			return msg.reply('There are no quotes in this server! How boring.');
		}
		const quotes = new Discord.RichEmbed({
			title: typeof quotelist[msg.guild.id] === 'string' ? `__Quotes in ${msg.guild.name} (Sister server of ${bot.guilds.get(guildId).name})__` : `__Quotes in ${msg.guild.name}__`,
			color: 2212073
		});
		for (const quote in quotelist[guildId]) {
			if (Object.prototype.hasOwnProperty.call(quotelist[guildId], quote)) {
				quotes.addField(`!${quote}:`, quotelist[guildId][quote]);
			}
		}
		const dm = await msg.author.createDM();
		try {
			await dm.send('', {
				embed: quotes
			});
			await msg.reply('I have DMed you with the avaliable quotes in this server.');
		} catch (err) {
			log.error(`Could not DM user: ${err.stack}.`);
			msg.reply(`I could not DM you, please check your settings.`);
		}
	} catch (err) {
		log.error(`Error: ${err.stack}.`);
	}
};
