// Modules & Initialisation

exports.data = {
	name: 'Reacts Watcher',
	command: 'reacts',
	description: 'Waits for a reaction from a user with the correct role with the 📌 emoji.'
};

const log = require('../lib/log.js')(exports.data.name);
const Watcher = require('../lib/models/watcher');

let gBot;

const parseReactions = async (reaction, user) => {
	if (reaction.message.channel.type === 'text' && !(await Watcher.findOne({where: {watcherName: 'reacts'}})).disabledGuilds.includes(reaction.message.guild.id)) {
		if (reaction.emoji.name === '📌' ? await gBot.elevation(reaction.message, user) >= 2 : false) {
			if (!reaction.message.pinned) {
				await reaction.message.pin();
				await reaction.remove(user);
				log.verbose(`${(await reaction.message.guild.fetchMember(user.id)).displayName} (${user.username}#${user.discriminator}) has pinned a message using a reaction in #${reaction.message.channel.name} on ${reaction.message.guild.name}.`);
			}
		} else if (reaction.emoji.name === '❌' ? await gBot.elevation(reaction.message, user) >= 2 : false) {
			if (reaction.message.pinned) {
				await reaction.message.unpin();
				await reaction.remove(user);
				log.verbose(`${(await reaction.message.guild.fetchMember(user.id)).displayName} (${user.username}#${user.discriminator}) has unpinned a message using a reaction in #${reaction.message.channel.name} on ${reaction.message.guild.name}.`);
			}
		} else if (reaction.emoji.name === '🗑' ? await gBot.elevation(reaction.message, user) >= 3 : false) {
			if (reaction.message.author.id === gBot.user.id) {
				await reaction.message.delete();
				log.verbose(`${(await reaction.message.guild.fetchMember(user.id)).displayName} (${user.username}#${user.discriminator}) has deleted a message using a reaction in #${reaction.message.channel.name} on ${reaction.message.guild.name}.`);
			}
		}
	}
};

exports.watcher = bot => {
	// Startup process for watcher
	log.info(`${exports.data.name} has initialised successfully.`);
	gBot = bot;
	bot.on('messageReactionAdd', parseReactions);
};

exports.disable = bot => {
	bot.removeListener('messageReactionAdd', parseReactions);
};

// Declare primary functions below here
