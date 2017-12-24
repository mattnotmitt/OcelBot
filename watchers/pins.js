// Modules & Initialisation

exports.data = {
	name: 'Pin Reacts Watcher',
	command: 'pins',
	description: 'Waits for a reaction from a user with the correct role with the 📌 emoji.'
};

const log = require('../lib/log.js')(exports.data.name);

exports.watcher = bot => {
  // Startup process for watcher
	log.info(`${exports.data.name} has initialised successfully.`);
	bot.on('messageReactionAdd', async (reaction, user) => {
		if (reaction.emoji.name === '📌' && await bot.elevation(reaction.message, user) >= 2) {
			if (!reaction.message.pinned) {
				await reaction.message.pin();
				await reaction.remove(user);
				log.verbose(`${(await reaction.message.guild.fetchMember(user.id)).displayName} (${user.username}#${user.discriminator}) has pinned a message using a reaction in #${reaction.message.channel.name} on ${reaction.message.guild.name}.`);
			}
		} else if (reaction.emoji.name === '❌' && await bot.elevation(reaction.message, user) >= 2) {
			if (reaction.message.pinned) {
				await reaction.message.unpin();
				await reaction.remove(user);
				log.verbose(`${(await reaction.message.guild.fetchMember(user.id)).displayName} (${user.username}#${user.discriminator}) has unpinned a message using a reaction in #${reaction.message.channel.name} on ${reaction.message.guild.name}.`);
			}
		}
	});
};

exports.disable = () => {
	// Nothing
};

// Declare primary functions below here
