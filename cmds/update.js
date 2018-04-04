exports.data = {
	name: 'Waking Titan Update Image',
	command: 'update',
	description: 'Updates an image message.',
	group: 'wakingTitan',
	syntax: 'wt update [message]',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 2,
	anywhere: 2
};
/*
const Canvas = require('canvas');
const jetpack = require('fs-jetpack');
const moment = require('moment');
const log = require('../lib/log.js')(exports.data.name);

const repeat = {};

const genImage = (text, channelID, bot) => {
	return new Promise(async (resolve, reject) => {
		try {
			const canvas = new Canvas(500, 125);
			const ctx = canvas.getContext('2d');
			ctx.font = '35px GeosansLight';
			ctx.textAlign = 'center';
			canvas.width = ctx.measureText(text.toUpperCase()).width > ctx.measureText(`As of ${moment().utc().format('YYYY-MM-DD')}`.toUpperCase()).width ? ctx.measureText(text.toUpperCase()).width + 20 : ctx.measureText(`As of ${moment().utc().format('YYYY-MM-DD')}`.toUpperCase()).width + 20;
			ctx.fillStyle = '#808080';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(text.toUpperCase(), canvas.width / 2, 35);
			ctx.fillText(`as of ${moment().utc().format('YYYY-MM-DD')}`.toUpperCase(), canvas.width / 2, 75);
			ctx.fillText(`at ${moment().utc().format('HH:mm')} UTC`.toUpperCase(), canvas.width / 2, 115);
			const img = canvas.toBuffer();
			jetpack.write(`/var/www/cdn/img/${channelID}.png`, img);
			Const out = jetpack.createWriteStream(`/var/www/cdn/img/${channelID}.png`);
			const stream = canvas.pngStream();
			stream.on('data', chunk => {
				out.write(chunk);
			});
			stream.on('end', () => {
				resolve();
			});
			stream.on('err', err => {
				reject(err);
			}); 
			const data = jetpack.read('cmdData.json', 'json');
			if (data.update[channelID]) {
				const message = await bot.channels.get(channelID).fetchMessage(data.update[channelID].id);
				await message.edit('', {embed: {
					image: {url: `https://cdn.artemisbot.uk/img/${channelID}.png?${Math.random()}`},
					color: 0x993E4D
				}});
			} else {
				await bot.channels.get(channelID).send('', {embed: {
					image: {url: `https://cdn.artemisbot.uk/img/${channelID}.png?${Math.random()}`},
					color: 0x993E4D
				}}).then(m => {
					data.update[channelID] = {id: m.id, msg: text};
					jetpack.write('cmdData.json', data);
				});
			}
		} catch (err) {
			reject(err);
		}
	});
};
*/
exports.func = async (msg, args, bot) => {
	/*
	try {
		try {
			clearInterval(repeat[msg.guild.id]);
		} catch (err) {
            // DO fuck all
		}
		log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has updated the image with the text "${args.join(' ')}" in #${msg.channel.name} on ${msg.guild.name}.`);
		await genImage(args.join(' '), msg.channel.id, bot);
		repeat[msg.guild.id] = setInterval(async () => {
			await genImage(args.join(' '), msg.channel.id, bot);
		}, 5 * 60 * 1000);
	} catch (err) {
		log.error(`Something went wrong: ${err.stack}`);
		msg.reply('Something\'s gone wrong. <@132479572569620480> check the logs mate.');
	}*/
};
/*
exports.startup = async bot => {
	const data = jetpack.read('cmdData.json', 'json');
	for (const chan of Object.keys(data.update)) {
		genImage(data.update[chan].msg, chan, bot);
		repeat[chan] = setInterval(async () => {
			genImage(data.update[chan].msg, chan, bot);
		}, 5 * 60 * 1000);
	}
};
*/