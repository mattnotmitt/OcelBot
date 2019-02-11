const request = require('request-promise-native');
const snek = require('snekfetch');
const Discord = require('discord.js');
const moment = require('moment');
const Jimp = require('jimp');
const log = require('../lib/log.js')('LastFM Query');
const LastFMDB = require('../lib/models/lastfm');

const LastFM = {
	data: {
		name: 'LastFM Query',
		command: 'lastfm',
		description: 'LastFM functions',
		group: 'fun',
		syntax: 'lastfm [function] [optional:username]',
		author: 'Matt C: matt@artemisbot.uk',
		permissions: 0,
		anywhere: true
	},

	struct: {
		nowplaying: {

		},
		cjkFont: null,
		font: null,
		default: {}
	},

	SPOT_TOKEN: null,
	TYPE_OPTIONS: ['albums', 'artists', 'tracks'],

	TIMESCALE_OPTIONS: {
		overall: 'overall',
		'7day': 'in the past seven days',
		'1month': 'in the past month',
		'3month': 'in the past three months',
		'6month': 'in the past six months',
		'12month': 'in the past year'
	},

	_r: bot => request.defaults({
		baseUrl: `https://ws.audioscrobbler.com/2.0/?api_key=${bot.config.lfmKey}&format=json&`,
		json: true
	}),

	_truncate: (text, max) => {
		return text.substr(0, max - 1) + (text.length > max ? '...' : '');
	},

	_getUserData: async user => {
		LastFMDB.sync();
		return LastFMDB.findOne({
			where: {
				userId: user
			}
		});
	},

	/**
	 * Escapes parenthesis in link
	 *
	 * @private
	 * @param {string} link
	 * @returns {string} Cleaned link
	 */

	_safeLink: link => {
		return link.replace(/\(/g, '%28').replace(/\)/g, '%29');
	},

	_userValid: async (user, bot) => {
		return LastFM._r(bot)(`&method=user.getinfo&user=${user}`).message !== 'User not found';
	},

	/**
	 * Fetches link to track on Spotify
	 *
	 * @private
	 * @param {object} bot
	 * @param {string} artist
	 * @param {string} title
	 * @returns {string} Spotify URL
	 */

	_getSpotifyLink: (bot, artist, title) => {
		return new Promise(async (resolve, reject) => {
			try {
				log.debug('Searching for track on Spotify!');
				if (LastFM.SPOT_TOKEN ? moment().diff(LastFM.SPOT_TOKEN.made, 'seconds') > LastFM.SPOT_TOKEN.expire : true) {
					log.debug('Token expired. Making request to Spotify.');
					const tokenReq = await snek.post('https://accounts.spotify.com/api/token?grant_type=client_credentials')
						.set('Authorization', `Basic ${Buffer.from(`${bot.config.spotifyCid}:${bot.config.spotifySecret}`).toString('base64')}`)
						.set('Content-Type', 'application/x-www-form-urlencoded');
					LastFM.SPOT_TOKEN = {
						token: tokenReq.body.access_token,
						expire: tokenReq.body.expires_in,
						made: moment()
					};
					log.debug('Token acquired.');
				}
				log.debug('Searching for song.');
				const spotReq = await snek.get(`https://api.spotify.com/v1/search?q=track:${title.split(' ').slice(0, 10).join(' ')}%20artist:${artist.split(' ').slice(0, 10).join(' ')}&type=track`).set('Authorization', `Bearer ${LastFM.SPOT_TOKEN.token}`);
				if (spotReq.body.tracks.items.length > 0) {
					log.debug('Song found!');
					return resolve(spotReq.body.tracks.items[0].external_urls.spotify);
				}
				log.debug('Song not found.');
				return resolve(null);
			} catch (err) {
				log.error('Couldn\'t get song link.');
				reject(err);
			}
		});
	},
	_getNowPlaying: async (msg, args, bot) => {
		try {
			const userData = await LastFM._getUserData(msg.author.id);
			if (!args[1] && !userData) {
				msg.channel.stopTyping(true);
				return msg.reply('You must either have a linked last.fm account or provide a username in your command.');
			}
			const user = args[1] || userData.lfmUsername;
			if (!(await LastFM._userValid(user, bot))) {
				msg.channel.stopTyping(true);
				return msg.reply('Specified user does not exist.');
			}
			log.debug('Found user.');
			const songData = (await LastFM._r(bot)(`&method=user.getRecentTracks&user=${user}`)).recenttracks.track[0];
			if (!songData) {
				return msg.reply(`${user} has never scrobbled anything.`);
			}
			log.debug('Fetched nowplaying data.');
			let spotifyLink;
			try {
				spotifyLink = await LastFM._getSpotifyLink(bot, songData.artist['#text'], songData.name);
			} catch (err) {
				spotifyLink = null;
			}
			const embed = new Discord.RichEmbed({
				color: 0xD51007,
				fields: [
					{
						name: 'Song',
						value: `[${songData.name}](${LastFM._safeLink(songData.url)})` || 'None',
						inline: true
					},
					{
						name: 'Album',
						value: songData.album['#text'] || 'None',
						inline: true
					},
					{
						name: 'Artist',
						value: songData.artist['#text'] || 'None',
						inline: true
					}
				],
				thumbnail: {
					url: songData.image[1]['#text']
				},
				footer: {
					text: `Powered by the last.fm & Spotify API. Took ${moment().diff(msg.createdAt)} ms.`
				}
			});
			try {
				if (songData['@attr'].nowplaying) {
					embed.setAuthor(`Now playing on last.fm for ${user}`, 'https://cdn.artemisbot.uk/img/lastfm.png', `https://last.fm/user/${user}`);
				}
			} catch (err) {
				embed.setAuthor(`Last played on last.fm for ${user}`, 'https://cdn.artemisbot.uk/img/lastfm.png', `https://last.fm/user/${user}`);
			}
			if (spotifyLink) {
				embed.addField('Spotify', `[Link](${spotifyLink})`, true);
			}
			log.debug('Created embed data.');
			await msg.channel.stopTyping(true);
			await msg.channel.send('', embed);
			log.debug('Sent embeds.');
		} catch (err) {
			await msg.channel.stopTyping(true);
			msg.reply(`Couldn't get nowplaying.`);
			log.error(`Couldn't get nowplaying: ${err.stack}`);
		}
	},

	_linkAccount: async (msg, args, bot) => {
		if (args.length !== 2) {
			msg.channel.stopTyping(true);
			return msg.reply('You must provide a LastFM username to link it to your Discord account.');
		}
		const userData = await LastFMDB.findOne({
			where: {
				userId: msg.author.id
			}
		});
		if (!(await LastFM._userValid(args[1], bot))) {
			msg.channel.stopTyping(true);
			return msg.reply('Specified user does not exist.');
		}
		if (userData) {
			await userData.update({
				lfmUsername: args[1]
			});
		} else {
			await LastFMDB.create({
				userId: msg.author.id,
				lfmUsername: args[1]
			});
		}
		msg.channel.stopTyping(true);
		await msg.reply(`Your Discord account has successfully been linked with LastFM account ${args[1]}.`);
	},

	_parseArgs: async (msg, args, bot) => {
		const userData = await LastFM._getUserData(msg.author.id);
		const type = LastFM.TYPE_OPTIONS.includes(args[1]) ?
			args[1] :
			(LastFM.TYPE_OPTIONS.includes(args[2]) ?
				args[2] :
				(LastFM.TYPE_OPTIONS.includes(args[3]) ?
					args[3] :
					'tracks'));
		const timescale = Object.keys(LastFM.TIMESCALE_OPTIONS).includes(args[2]) ?
			args[2] :
			(Object.keys(LastFM.TIMESCALE_OPTIONS).includes(args[3]) ?
				args[3] :
				(Object.keys(LastFM.TIMESCALE_OPTIONS).includes(args[1]) ?
					args[1] :
					'overall'));
		const user = ((type === (args[1] || 'tracks') && timescale === (args[2] || 'overall')) || (type === (args[2] || 'tracks') && timescale === (args[1] || 'overall'))) ?
			(args[3] || userData.lfmUsername) :
			(((type === (args[2] || 'tracks') && timescale === (args[3] || 'overall')) || (type === (args[3] || 'tracks') && timescale === (args[2] || 'overall'))) ?
				(args[1] || userData.lfmUsername) :
				(((type === (args[1] || 'tracks') && timescale === (args[3] || 'overall')) || (type === (args[3] || 'tracks') && timescale === (args[1] || 'overall'))) ?
					(args[2] || userData.lfmUsername) :
					userData.lfmUsername));

		if (!LastFM.TYPE_OPTIONS.includes(type)) {
			msg.channel.stopTyping(true);
			return msg.reply(`${type} is an invalid top10 type. Please choose one from \`${LastFM.TYPE_OPTIONS.join(' | ')}\``);
		}

		if (!Object.keys(LastFM.TIMESCALE_OPTIONS).includes(timescale)) {
			msg.channel.stopTyping(true);
			return msg.reply(`${timescale} is an invalid top10 timescale. Please choose one from \`${Object.keys(LastFM.TIMESCALE_OPTIONS).join(' | ')}\``);
		}

		if (!(await LastFM._userValid(user, bot))) {
			msg.channel.stopTyping(true);
			return msg.reply('Specified user does not exist.');
		}
		log.debug('Found user.');
		return {type, timescale, user};
	},

	_getTop10: async (msg, args, bot) => {
		try {
			if (args[1] === 'help') {
				msg.channel.stopTyping(true);
				await msg.reply(`Parameters for this sub-command (\`*\` denotes the default if omitted):
	**type:** \`albums | artists | tracks (*)\`
	**timescale:** \`overall (*) | 7day | 1month | 3month | 6month | 12month\``);
			} else {
				const {type, timescale, user} = await LastFM._parseArgs(msg, args, bot);
				let top10 = await LastFM._r(bot)(`&method=user.gettop${type}&user=${user}&period=${timescale}&limit=10`);
				const embed = new Discord.RichEmbed({
					author: {
						name: `Top 10 ${type} ${LastFM.TIMESCALE_OPTIONS[timescale]} for ${user}`,
						icon_url: 'https://cdn.artemisbot.uk/img/lastfm.png',
						url: `https://last.fm/user/${user}`
					},
					color: 0xD51007,
					footer: {
						text: `Powered by the last.fm API. Took ${moment().diff(msg.createdAt)} ms.`
					}
				});
				top10 = top10[`top${type}`][type.slice(0, -1)];
				// Console.log(top10);
				for (const thing of top10) {
					const name = type === 'artists' ? `${thing.name}` : `${thing.name} - ${thing.artist.name}`;
					const inline = true;
					/* If (top10.indexOf(thing) < (top10.length >= 10 ? 9 : top10.length)) {
						const nextName = type === 'artists' ? `${top10[top10.indexOf(thing) + 1].name}` : `${top10[top10.indexOf(thing) + 1].name} - ${top10[top10.indexOf(thing) + 1].artist.name}`;
						inline = name.length < 30 ? nextName.length < 60 : nextName.length < 40;
					}
					Console.log(inline); */
					embed.addField(name, `[Played ${thing.playcount} time${thing.playcount === 1 ? '' : 's'}](${LastFM._safeLink(thing.url)})`, inline);
				}
				msg.channel.stopTyping(true);
				await msg.channel.send('', embed);
			}
		} catch (err) {
			await msg.channel.stopTyping(true);
			msg.reply(`Couldn't get top10.`);
			log.error(`Couldn't get top10: ${err.stack}`);
		}
	},

	_getCollage: async (msg, args, bot) => {
		try {
			if (args[1] === 'help') {
				msg.channel.stopTyping(true);
				await msg.reply(`Parameters for this sub-command (\`*\` denotes the default if omitted):
	**type:** \`albums | artists | tracks (*)\`
	**timescale:** \`overall (*) | 7day | 1month | 3month | 6month | 12month\``);
			} else {
				if (LastFM.struct.cjkFont === null) {
					log.verbose('First load of collage, loading CJK Font.');
					LastFM.struct.cjkFont = await Jimp.loadFont('./static/CJK_fix.fnt');
					log.verbose('Successful.');
				}
				if (LastFM.struct.font === null) {
					log.verbose('First load of collage, loading font.');
					LastFM.struct.font = await Jimp.loadFont('./static/VCR_OSD_MONO_1.001.fnt');
					log.verbose('Successful.');
				}
				const {type, timescale, user} = await LastFM._parseArgs(msg, args, bot);
				// Console.log(`&method=user.gettop${type}&user=${user}&period=${timescale}&limit=9`);
				const top9 = (await LastFM._r(bot)(`&method=user.gettop${type}&user=${user}&period=${timescale}&limit=9`))[`top${type}`][type.slice(0, -1)];
				const [collage, overlay, images] = await Promise.all([
					Jimp.create(1200, 900, 0x000000FF),
					Jimp.create(250, 75, 0x000000FF),
					Promise.all(top9.map(el => {
						// Console.log(el.name, el.image[2]['#text'].length > 0 ? el.image[2]['#text'] : './static/nocover.png');
						return Jimp.read(el.image[3]['#text'].length > 0 ? el.image[3]['#text'] : './static/nocoverlarge.png');
					}))
				]);
				for (let i = 0; i < top9.length; i++) {
					const el = top9[i];
					const x = (i % 3);
					const y = Math.ceil((i + 1) / 3) - 1;
					const name = LastFM._truncate((type === 'artists' ? `${el.name}` : `${el.name}`), 28);
					const aName = LastFM._truncate((type === 'artists' ? ` ` : `${el.artist.name}`), 28);
					// Console.log(name, aName);
					await collage.composite(images[i], x * 300, y * 300)
						// .print(name. ? LastFM.struct.cjkFont : LastFM.struct.font, 920, (y * 300) + 89 + (x * 64), name.replace(/\s/g, "").length === 0 ? LastFM._truncate(type === 'artists' ? `${el.name}` : `${el.name}`) : name)
						// .print(aName.replace(/\s/g, "").length === 0 ? LastFM.struct.cjkFont : LastFM.struct.font, 920, (y * 300) + 89 + 18 + (x * 64), aName.replace(/\s/g, "").length === 0 ? LastFM._truncate(type === 'artists' ? ` ` : `${el.artist.name}`) : aName);
						.print(LastFM.struct.cjkFont, 920, (y * 300) + 69 + (x * 64), name)
						.print(LastFM.struct.cjkFont, 920, (y * 300) + 69 + 18 + (x * 64), aName);
						/* .composite(overlay, (x * 300) + 25, (y * 300) + 200, {
							mode: Jimp.BLEND_SOURCE_OVER,
							opacitySource: 0.5,
							opacityDest: 1
						}); */
				}
				const rand = Math.random();
				const embed = new Discord.RichEmbed({
					author: {
						name: `Collage of ${type} ${LastFM.TIMESCALE_OPTIONS[timescale]} for ${user}`,
						icon_url: 'https://cdn.artemisbot.uk/img/lastfm.png',
						url: `https://last.fm/user/${user}`
					},
					color: 0xD51007,
					image: {
						url: `attachment://${user}_collage_${rand}.png`
					},
					footer: {
						text: `Powered by the last.fm API. Took ${moment().diff(msg.createdAt)} ms.`
					}
				});
				msg.channel.stopTyping(true);
				return msg.channel.send('', {
					embed,
					files: [{
						attachment: await collage.getBufferAsync(Jimp.MIME_PNG),
						name: `${user}_collage_${rand}.png`
					}]
				});
			}
		} catch (err) {
			await msg.channel.stopTyping(true);
			msg.reply(`Couldn't get top10.`);
			log.error(`Couldn't get top10: ${err.stack}`);
			console.error(err);
		}
	},

	func: async (msg, args, bot) => {
		try {
			msg.channel.startTyping();
			if (args.length === 0) {
				msg.channel.stopTyping(true);
				return msg.reply(`You must provide a function to this command. View available functions with \`lastfm help\`.`);
			}
			log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has done a ${args[0]} on last.fm in #${msg.channel.name} on ${msg.guild.name}.`);
			switch (args[0].toLowerCase()) {
				case 'nowplaying': {
					LastFM._getNowPlaying(msg, args, bot);
					break;
				} case 'link': {
					LastFM._linkAccount(msg, args, bot);
					break;
				} case 'top10': {
					LastFM._getTop10(msg, args, bot);
					break;
				} case 'collage': {
					LastFM._getCollage(msg, args, bot);
					break;
				} case 'help': {
					const embed = new Discord.RichEmbed({
						color: 2212073,
						title: 'LastFM Query Command',
						description: `*Where username is optional, you must have linked your LastFM account to your Discord account.*`,
						fields: [
							{
								name: '`lastfm link [username]`',
								value: 'Links your Discord and last.fm accounts.'
							},
							{
								name: '`lastfm nowplaying [optional:username]`',
								value: 'Fetches currently playing/last played song for user.'
							},
							{
								name: '`lastfm top10 [help | optional:type] [optional:timescale] [optional:username]`',
								value: 'Fetches your top10 albums/tracks/artists over a timescale. See `lastfm top10 help` for more information.'
							}
						]
					});
					msg.channel.stopTyping(true);
					await msg.channel.send('', embed);
					break;
				} default:
					msg.channel.stopTyping(true);
					break;
			}
		} catch (err) {
			msg.channel.stopTyping(true);
			msg.reply('Couldn\'t do the thing you wanted me to do.');
			log.error(`Something went wrong: ${err.stack}.`);
		}
	}

};

module.exports = LastFM;
