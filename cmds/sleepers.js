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

const request = require('request-promise-native');
const moment = require('moment');
const log = require('../lib/log.js')(exports.data.name);
const sleepersDB = require('../lib/sleepers.json');
const snek = require('snekfetch');

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
				resp = await this.runCommand(args[0], args.slice(1));
				cache[args.join(' ')] = {resp, last: moment().unix()};
			} else {
				log.debug('Not cached for long enough');
				resp = cache[args.join(' ')].resp;
			}
		} else {
			log.debug('Not cached before - requesting.');
			resp = await this.runCommand(args[0], args.slice(1));
			cache[args.join(' ')] = {resp, last: moment().unix()};
		}
		msg.channel.stopTyping(true);
		msg.channel.send('', {embed: {
			title: `Sleeper ${resp.name}`,
            description: `ID: ${resp.id}
Unlocked: ${resp.is_memory_unlocked ? "Yes" : "No"}
Done: ${resp.is_extracted ? "Yes" : "No"}
[Patient file](${resp.patient_file})
[Reddit thread](${resp.patient_support_url})
[CSD Thread](${resp.csd_intervention_url})
            `,
			color: 0x00FC5D,
			footer: {
				icon_url: 'https://cdn.artemisbot.uk/img/watchingtitan.png',
				text: 'SatCom-70 Uplink Sleepers'
			},
			timestamp: moment().toISOString(),
            url: 'http://uplink.satcom-70.com/dashboard/',
            fields: resp.blocks.map(block => {return {name: block.svg_element_name, value: "Corrupted: " + (block.is_corrupted ? "Yes" : "No") + "\nUnlocked: " + (block.is_active ? "Yes" : "No")}})
		}});
	} catch (err) {
		log.error(`Something went wrong: ${err.stack}`);
		msg.reply('Something\'s gone wrong. <@132479572569620480> check the logs mate.');
		msg.channel.stopTyping(true);
	}
};

exports.runCommand = async (command, params) => {
		try {
            var sleeperData = await snek.get('http://api.satcom-70.com/dash/sleeper/' + this.resolveSleeper(params[0]).id);
            return JSON.parse(sleeperData.body).sleeper;
		} catch (err) {
            log.error(`Uh-oh. Sqbika can't code...: ${err.stack}`);
            return "error"; //How to throw the staticly typed funcional Promise structure out of the window and set everything on fire with oil.
		}
};

exports.resolveSleeper = async (sleeper) => {
    try {
        var sleepers = await snek.get('http://api.satcom-70.com/dash/sleeper/');
        sleepers = JSON.parse(sleepers.body).sleepers;
        return sleepers.find((slep => {
            return slep.name.toLowerCase() == sleeper.toLowerCase();
        }));
    } catch (err) {
        log.error(`Uh-oh. Sqbika can't code...: ${err.stack}`);
        return "error"; //How to throw the staticly typed funcional Promise structure out of the window and set everything on fire with oil.
    }
}
