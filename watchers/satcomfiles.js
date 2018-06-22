exports.data = {
	name: 'SatCom Uplink Files Watcher',
	command: 'satcomfiles'
};

const Discord = require('discord.js');
const _ = require('lodash');
const moment = require('moment');
const Twit = require('twit');
const config = require('../config.json');
const SatComFiles = require('../lib/models/satcomfiles.js');
const getFiles = async params => {
	try {
		let response = await snek.get('http://api.satcom-70.com/dash/weeklyrewards');
		response = JSON.parse(sleeperData.body).message.list;
		if (response) {
			return response;
		}
		return response;
	} catch (err) {
		log.error(`Uh-oh. Sqbika can't code...: ${err.stack}`);
		return 'error'; // How to throw the staticly typed funcional Promise structure out of the window and set everything on fire with oil.
	}
};

const deformat = (string) => {
    return string.split(',').map(ele => praseFloat(ele));
}

const format = (input) => {
    return input.map(ele => parseFloat(ele.progress)).join(',');
}

const log = require('../lib/log.js')(exports.data.name);

let repeat;

// Const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const T = new Twit(config.WTTwitter);

const checkSatComFiles = async bot => {
	try {
		await SatComFiles.sync();
		const lastFiles = (await SatComFiles.findOne({
            order: [ [ 'createdAt', 'DESC' ]],
        })).data;
        lastFiles = deformat(lastFiles);
        const newFiles = getFiles().map(ele => parseFloat(ele.progress));
		log.debug(`Checking files.`);
		const result = await Promise.all(newFiles.map(async (file, ind) => {
			return new Promise(async (resolve, reject) => {
				try {
					if (_.isEqual(file, lastFiles[ind])) {
						return resolve(false);
					}
					log.info(`${ind+1} file percentage has increased.`);
					if (file == 1 && lastFiles[ind] !== 1) {
						const embed = new Discord.RichEmbed({
							author: {
								name: `SatCom File ${ind+1} has been unlocked.`,
								icon_url: 'https://cdn.artemisbot.uk/img/hexagon.png',
								url: 'https://uplink.satcom-70.com/dashboard/'
							},
							title: `**> \`SatCom File ${ind+1} has been unlocked.\`**`,
							color: 0x00FC5D,
							footer: {
								text: `Watching Titan | ${moment().utc().format("dddd, MMMM Do YYYY, h:mm:ss a")}`,
								icon_url: 'https://cdn.artemisbot.uk/img/watchingtitan.png'
							}
						});
						await Promise.all((await SatComFiles.findAll().map(watcher =>
							bot.channels.get(watcher.channelID).send('', {embed})
						)));
						await T.post('statuses/update', {status: `Satcom file ${ind+1} has finished on https://uplink.satcom-70.com/dashboard/ #WakingTitan`});
					}
					await Promise.all((await Sleepers.findAll().map(watcher =>
						watcher.update({data: format(file)})
					)));
					resolve(true);
				} catch (err) {
					log.error(`Something went wrong: ${err.stack}`);
					reject(err);
				}
			});
		}));
		if (!result.includes(true)) {
			log.debug('No sleepers have changed.');
		}
	} catch (err) {
		log.error(`Failed to check all sleepers: ${err.stack}`);
	}
	repeat = setTimeout(async () => {
		checkSatComFiles(bot);
	}, 15 * 1000);
};

exports.watcher = bot => {
	this.disable();
	repeat = setTimeout(async () => {
		checkSleepers(bot);
	}, 15 * 1000);
	log.verbose(`${exports.data.name} has initialised successfully.`);
};

exports.start = async (msg, bot, args) => {
	try {
		await SatComFiles.sync();
		if (await SatComFiles.findOne({where: {channelID: msg.channel.id}})) {
			return msg.reply(`I am already watching the satcom files in this channel.`);
		}
		log.info(`Now outputting satcom file updates to #${msg.channel.name} in ${msg.guild.name}.`);
        msg.reply(`Now outputting satcom file updates to this channel.`);
        data = (await getFiles()).map(ele => ele.progress);
		await SatComFiles.create({
			channelID: msg.channel.id,
            data: format(data)
		});
	} catch (err) {
		msg.reply('Couldn\'t watch the files! Check the logs.');
		log.error(`Couldn't start watching the files: ${err}`);
	}
};

exports.stop = async (msg, bot, args) => {
	const watch = await SatComFiles.findOne({where: {channelID: msg.channel.id}});
	if (watch) {
		watch.destroy();
		log.info(`No longer outputting satcom files updates to #${msg.channel.name} in ${msg.guild.name}.`);
		msg.reply(`No longer outputting satcom files updates to this channel.`);
	} else {
		return msg.reply(`This channel is not receiving updates on the satcom files.`);
	}
};

exports.list = async (msg, bot, args) => {
	const channelID = args[0] && bot.channels.has(args[0]) ? args[0] : msg.channel.id;
	const channel = bot.channels.get(args[0]) || msg.channel;
	const fields = (await SatComFiles.findAll({where: {channelID}})).map(watch => {
		return `Created ${moment(watch.createdAt).fromNow()}`;
	});
	if (fields.length > 0) {
		msg.reply('', {embed: {
			author: {
				name: `SatCom File Watcher running in #${channel.name} on ${channel.guild.name}`,
				icon_url: 'https://cdn.artemisbot.uk/img/watchingtitan.png?b'
			},
			description: fields,
			color: 0x993E4D,
			footer: {
				icon_url: 'https://cdn.artemisbot.uk/img/ocel.jpg',
				text: 'Ocel'
			}
		}});
	} else {
		msg.reply(`No SatCom File Watcher was found in ${args[0] && bot.channels.has(args[0]) ? `#${channel.name} on ${channel.guild.name}` : 'this channel'}.`);
	}
};

exports.disable = () => {
	clearTimeout(repeat);
};
