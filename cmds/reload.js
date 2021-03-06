exports.data = {
	name: 'Reload Command',
	command: 'reload',
	description: 'Reloads a command.',
	group: 'system',
	syntax: 'reload [command]',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 3,
	anywhere: true
};

const log = require('../lib/log.js')(exports.data.name);

exports.func = async (msg, args, bot) => {
	try {
		let command;
		if (!args[0]) {
			return msg.reply(`You haven't provided enough arguments. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`);
		}
		if (bot.commands.has(args[0])) {
			command = args[0];
		}
		if (!command) {
			return msg.channel.send(`I cannot find the command: ${args[0]}`);
		}
		const m = await msg.channel.send(`Reloading: ${command}`);
		await bot.reload(command);
		await m.edit(`Successfully reloaded: ${command}`);
		log.info(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has reloaded ${args[0]} in #${msg.channel.name} on ${msg.guild.name}.`);
	} catch (err) {
		log.error(`Something went wrong: ${err.stack}`);
	}
};
