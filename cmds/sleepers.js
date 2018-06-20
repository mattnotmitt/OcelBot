exports.data = {
	name: 'Sat-Com Uplink Sleepers Sleeper Commands',
	command: 'sleepers',
	description: 'Checks value of a Sat-Com Uplink Sleeper.',
	group: 'WakingTitan',
	syntax: 'sleepers [sleeper-name]',
	author: 'Sqbika: sqbika@gmail.com',
	anywhere: 2,
	permissions: 0
};

const moment = require('moment');
const snek = require('snekfetch');
const log = require('../lib/log.js')(exports.data.name);

const cache = {};

exports.func = async (msg, args) => {
	try {
		let resp;
		if (args.length === 0) {
			return msg.reply(`You haven't provided enough arguments. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`);
		}
		log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has sent "${args.join(' ')}" to Waking Titan in #${msg.channel.name} on ${msg.guild.name}.`);
		msg.channel.startTyping();
		if (cache[args.join(' ')]) {
			if (moment().diff(moment.unix(cache[args.join(' ')].last), 'minutes') >= 1) {
				log.debug('Cached for too long, requesting.');
				resp = await this.runCommand(args);
				cache[args.join(' ')] = {resp, last: moment().unix()};
			} else {
				log.debug('Not cached for long enough');
				resp = cache[args.join(' ')].resp;
			}
		} else {
			log.debug('Not cached before - requesting.');
			resp = await this.runCommand(args);
			cache[args.join(' ')] = {resp, last: moment().unix()};
		}
		msg.channel.stopTyping(true);
		if (!(resp instanceof Object)) {
			return msg.reply('Sleeper not found, or an error occurred.');
		}
		msg.channel.send('', {embed: {
			title: `Sleeper ${resp.name} - Status: ${resp.status}`,
			description: `ID: ${resp.id}
Unlocked: ${resp.is_memory_unlocked === '1' ? 'Yes' : 'No'}
Extracted: ${resp.is_extracted === '1' ? 'Yes' : 'No'}
${resp.patient_file ? `[Patient file](${resp.patient_file})\n` : ''}${resp.patient_support_url ? `[Reddit thread](${resp.patient_support_url})\n` : ''}${resp.csd_intervention_url ? `[CSD Thread](${resp.csd_intervention_url})\n` : ''}`,
			color: 0x00FC5D,
			footer: {
				icon_url: 'https://cdn.artemisbot.uk/img/watchingtitan.png',
				text: 'SatCom-70 Uplink Sleepers'
			},
			timestamp: moment().toISOString(),
			url: 'http://uplink.satcom-70.com/dashboard/',
			fields: resp.blocks ? resp.blocks.map(block => {
				return {name: `${block.svg_element_name.split('_').map(word => {
					return word.toUpperCase();
				}).join(' ')} ${block.is_active ? '✅' : '❌'}`, value: (block.label.length > 0 ? `**${block.label}**\n` : '') + 'Corrupted: ' + (block.is_corrupted === '1' ? 'Yes' : 'No'), inline: true};
			}) : []
		}});
	} catch (err) {
		log.error(`Something went wrong: ${err.stack}`);
		msg.reply('Something\'s gone wrong. <@132479572569620480> check the logs mate.');
		msg.channel.stopTyping(true);
	}
};

exports.runCommand = async params => {
	try {
		const sleeper = await this.resolveSleeper(params.join(' '));
		// Console.log(sleeper);
		if (!sleeper) {
			return 'SleeperNotFound';
		}
		let sleeperData = await snek.get('http://api.satcom-70.com/dash/sleeper/' + sleeper.id);
		sleeperData = JSON.parse(sleeperData.body).sleeper;
		if (sleeperData) {
			return sleeperData;
		}
		return sleeper;
	} catch (err) {
		log.error(`Uh-oh. Sqbika can't code...: ${err.stack}`);
		return 'error'; // How to throw the staticly typed funcional Promise structure out of the window and set everything on fire with oil.
	}
};

exports.resolveSleeper = sleeper => {
	return new Promise(async (resolve, reject) => {
		try {
			let sleepers = await snek.get('http://api.satcom-70.com/dash/sleeper/');
			sleepers = JSON.parse(sleepers.body).sleepers;
			resolve(sleepers.find((slep => {
				// Console.log(slep);
				// console.log(sleeper);
				return slep.name.toLowerCase() === sleeper.toLowerCase();
			})));
		} catch (err) {
			reject(err); // How to throw the staticly typed funcional Promise structure out of the window and set everything on fire with oil.
		}
	});
};
