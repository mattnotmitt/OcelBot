// Modules & Initialisation

exports.data = {
	name: 'Duty Watcher',
	command: 'onduty',
	description: 'Waits for a ping of the online duty roles.',
	disable: true
};

const log = require('../lib/log.js')(exports.data.name);
const Watcher = require('../lib/models/watcher');

const parseMessages = async message => {
	if ((await Watcher.findOne({where: {watcherName: exports.data.command}})).disabledGuilds.includes(message.guild.id)) {
		return;
	}
	if (message.mentions.roles.size === 0) {
		return;
	}
	if (!(message.guild.roles.exists('name', 'Online NT4 Helper'))) {
		message.reply(`${message.guild.name} does not have an "Online NT4 Helper" role - creating it now.`).then(m => m.delete(5000));
		await message.guild.createRole({
			name: 'Online NT4 Helper',
			mentionable: true
		});
	}
	if (!(message.guild.roles.exists('name', 'Online TBW Helper'))) {
		log.info(`${message.guild.name} does not have an "Online TBW Helper" role - creating it now.`);
		await message.guild.createRole({
			name: 'Online TBW Helper',
			mentionable: true
		});
	}
	if (message.isMentioned(message.guild.roles.find('name', 'Online NT4 Helper'))) {
		const nt4Role = message.guild.roles.find('name', 'NT4 Helper');
		const valid = nt4Role.members.filter(member => member.presence.status === 'online').array();
		if (valid.length === 0) {
			return message.channel.send('Sorry! No NT4 Helpers are online right now.');
		}
		message.channel.send(valid.map(member => `<@${member.user.id}>`).join(' '))
			.then(m => m.edit('Summoned online NT4 Helpers for you!'));
	} else if (message.isMentioned(message.guild.roles.find('name', 'Online TBW Helper'))) {
		const tbwRole = message.guild.roles.find('name', 'TBW Helper');
		const valid = tbwRole.members.filter(member => member.presence.status === 'online').array();
		if (valid.length === 0) {
			return message.channel.send('Sorry! No TBW Helpers are online right now.');
		}
		message.channel.send(valid.map(member => `<@${member.user.id}>`).join(' '))
			.then(m => m.edit('Summoned online TBW Helpers for you!'));
	}
};

exports.watcher = bot => {
	// Startup process for watcher
	log.verbose(`${exports.data.name} has initialised successfully.`);
	gBot = bot;
	bot.on('message', parseMessages);
};

exports.disable = bot => {
	bot.removeListener('message', parseMessages);
};

// Declare primary functions below here
