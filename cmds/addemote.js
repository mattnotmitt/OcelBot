exports.data = {
	name: 'Emote Add',
	description: 'Adds an emote to the bot',
	group: 'emotes',
	command: 'addemote',
	syntax: 'addemote [name] [url]',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 2
};

const jetpack = require('fs-jetpack');
const uuidv4 = require('uuid/v4');
const request = require('request-promise-native');
const snek = require('snekfetch');

const log = require('../lib/log.js')(exports.data.name);
const Emote = require('../lib/models/emote');

exports.func = async (msg, args) => {
	try {
		await Emote.sync();
		const guildId = msg.server.sister || msg.guild.id;
		const name = args[0];
		const url = args[1];
		let ext;
		if (args.length === 0) {
			return msg.reply(`You didn't include a link or a emote name! The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`);
		}
		if (args.length !== 2) {
			return msg.reply(`There are not enough arguments in this command. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`);
		}
		if (await Emote.findOne({where: {guildId, name}})) {
			return msg.reply('That emote already exists!');
		}
		log.info(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has added emote ${name} in #${msg.channel.name} on ${msg.guild.name}.`);
		switch (url.split('.').slice(-1)[0]) {
			case 'png':
				ext = '.png';
				break;
			case 'gif':
				ext = '.gif';
				break;
			case 'jpg':
				ext = '.jpg';
				break;
			case 'jpeg':
				ext = '.jpeg';
				break;
			default:
				return msg.reply('This link is not png, jpg, jpeg or gif.');
		}
		const filename = name + ext;
		const response = await snek.get(url);
		if (response.status !== 200) {
			msg.reply(`That link is invalid - Status Code: ${response.status}.`);
		} else if (!response.headers['content-type'].match(/image\/(png|gif|jpg|jpeg)/)) {
			msg.reply(`Invalid content-type: \`\`\`${response.headers['content-type']}\`\`\``);
		} else if (response.headers['content-length'] / (1024 * 1024) > 2) {
			msg.reply(`That file is too big (${Number(response.headers['content-length'] / (1024 * 1024)).toPrecision(3)} MB)!`);
		} else {
			jetpack.dir(`./emotes/${guildId}`);
			jetpack.write(`./emotes/${guildId}/${filename}`, response.body);
			Emote.create({
				name,
				path: `${guildId}/${filename}`,
				guildId
			});
			msg.reply(`Emote :${name}: has been added.`);
		}
	} catch (err) {
		if (err.status) {
			msg.reply(`Failed to add emote when fetching image: ${err.status}: ${err.statusText}`);
			log.warn(`Failed to fetch emote image: ${err.status}: ${err.statusText}`);
		} else {
			msg.reply(`Failed to add emote.`);
			log.error(`Failed to add emote: ${err.stack}`);
		}
	}
};
