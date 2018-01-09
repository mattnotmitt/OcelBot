exports.data = {
	name: 'Google Drive Fetch',
	command: 'gdrive',
	description: 'Google Drive contents listing.',
	group: 'system',
	syntax: 'gdrive [folder id]',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 2,
	anywhere: true
};

const google = require('googleapis');
const Discord = require('discord.js');
const auth = require('../config.json').gdrive_service_account;
const log = require('../lib/log.js')(exports.data.name);

const jwtClient = new google.auth.JWT(
  auth.client_email,
  null,
  auth.private_key,
  ['https://www.googleapis.com/auth/drive'],
  null
);

const checkFolder = folderID => {
	return new Promise((resolve, reject) => {
		google.drive('v3').files.get({
			auth: jwtClient,
			fileId: folderID,
			fields: 'id,modifiedTime,name,webViewLink,mimeType'
		}, (err, resp) => {
			try {
				if (!resp) {
					return reject(new Error('DoesNotExist'));
				}
				if (resp.mimeType !== 'application/vnd.google-apps.folder') {
					return reject(new Error('NotFolder'));
				}
				if (err) {
					return reject(err);
				}
			} catch (err) {
				reject(err);
			}
			google.drive('v3').files.list({
				auth: jwtClient,
				q: `'${folderID}' in parents`,
				fields: 'files(modifiedTime,mimeType,name,webViewLink)'
			}, (err, resp2) => {
				if (err) {
					reject(err);
				}
				if (resp2.files.length === 0) {
					return reject(new Error('EmptyFolder'));
				}
				resp2.parentName = resp.name;
				resp2.parentLink = resp.webViewLink;
				resp2.parentMod = resp.modifiedTime;
				resolve(resp2);
			});
		});
	});
};

exports.func = async (msg, args) => {
	try {
		if (!args[0]) {
			return msg.reply(`You haven't provided enough arguments. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`);
		}
		const folder = await checkFolder(args[0].split('/').splice(-1)[0]);
		const embed = new Discord.RichEmbed({
			author: {
				name: `Contents of ${folder.parentName}`,
				url: folder.parentLink,
				icon_url: 'https://cdn.artemisbot.uk/img/google.png?a'
			},
			color: 0x993E4D,
			timestamp: folder.parentMod,
			footer: {
				text: 'Folder last modified on '
			}
		});
		folder.files.forEach(file => {
			embed.addField(`${file.name}`, `${file.mimeType.split('/').slice(-1)[0].split('.').slice(-1)[0].toUpperCase()} | [Link](${file.webViewLink})`, true);
		});
		log.info(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has checked ${folder.parentName} (${args[0]}) in #${msg.channel.name} on ${msg.guild.name}.`);
		await msg.channel.send('', {embed});
	} catch (err) {
		if (err.message === 'NotFolder') {
			return msg.reply('The provided ID does not correspond to a folder.');
		}
		if (err.message === 'EmptyFolder') {
			return msg.reply('The provided ID is of an empty folder.');
		}
		if (err.message === 'DoesNotExist') {
			return msg.reply('The selected ID does not correspond to any known folder.');
		}
		log.error(`Something went wrong: ${err.stack}`);
		msg.reply('Something\'s gone wrong. <@132479572569620480> check the logs mate.');
	}
};
