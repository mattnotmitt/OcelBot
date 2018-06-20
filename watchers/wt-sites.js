// ===============| Initialisation |===============

exports.data = {
	name: 'Waking Titan Sites & Glyphs',
	command: 'wt-sites'
};

// Loads required modules
const chalk = require('chalk');
const CSSselect = require('css-select');
const Discord = require('discord.js');
const exec = require('child-process-promise').exec;
const he = require('he');
const htmlparser = require('htmlparser2');
const jetpack = require('fs-jetpack');
const moment = require('moment');
const snek = require('snekfetch');
const Spreadsheet = require('edit-google-spreadsheet');
const strftime = require('strftime');
const Twit = require('twit');
const TwitterMedia = require('twitter-media');

const log = require('../lib/log.js')(exports.data.name);
const config = require('../config.json');
const Watcher = require('../lib/models/watcher');
const ReactionHandler = require('../lib/reaction-handler');

const T = new Twit(config.WTTwitter);

// Makes repeats global

const hasUpdate = {};
let repeat;
// ================| Helper Functions |================

const clean = str => {
	return str.replace(/<script[\s\S]*?>[\s\S]*?<\/script>|<link\b[^>]*>|Email:.+>|data-token=".+?"|email-protection#.+?"|<div class="vc_row wpb_row vc_row-fluid no-margin parallax.+>|data-cfemail=".+?"|<!--[\s\S]*?-->|<meta name="fs-rendertime" content=".+?">|e-mail.cloud/ig, '');
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ================| Main Functions |================

// Checks status of glyphs on wakingtitan.com
const checkGlyphs = async bot => {
	try {
		const wtSites = await Watcher.findOne({
			where: {
				watcherName: 'wt-sites'
			}
		});
		const data = wtSites.data || {
			channels: [],
			sites: {},
			glyphs: []
		};
		const req = await snek.get('https://wakingtitan.com');
		const glyphs = [];
		let change = false;
		const handler = new htmlparser.DomHandler(error => {
			if (error) {
				log.error(error);
			}
		});
		const parser = new htmlparser.Parser(handler);
		parser.write(req.body);
		parser.done();
		const disGlyph = CSSselect('a[class=glyph]', handler.dom);
		for (const element of disGlyph) {
			glyphs.push(element.attribs.style.split('(')[1].slice(0, -1));
		}
		for (let i = 0; i < glyphs.length; i++) {
			if (glyphs.sort()[i] !== data.glyphs[i]) {
				log.info(`New glyph (${data.glyphs[i]}) at wakingtitan.com`);
				const embed = new Discord.RichEmbed({
					color: 0x993E4D,
					description: 'That\'s good, innit!',
					footer: {
						icon_url: 'https://cdn.artemisbot.uk/img/watchingtitan.png',
						text: `Watching Titan | ${moment().utc().format('dddd, MMMM Do YYYY, h:mm:ss a')}`
					},
					author: {
						name: 'New glyph has activated!',
						url: 'https://wakingtitan.com',
						icon_url: 'https://cdn.artemisbot.uk/img/hexagon.jpg'
					},
					thumbnail: {
						url: `http://wakingtitan.com${glyphs.sort()[i]}`
					}
				});
				await Promise.all(data.channels.map(channel =>
						bot.channels.get(channel).send('', {embed})
				));
				const resp = await snek.get(`http://wakingtitan.com${glyphs.sort()[i]}`);
				jetpack.write(`watcherData/glyphs/glyph${glyphs.sort()[i].split('/').slice(-1)[0]}`, resp.body);
				const tm = new TwitterMedia(config.WTTwitterMedia);
				const glyphImg = await tm.uploadMedia('image', resp.body);
				await T.post('statuses/update', {
					status: 'A new glyph has been activated at wakingtitan.com! #WakingTitan',
					media_ids: glyphImg.media_id_string
				});
				change = true;
			}
		}
		if (change) {
			data.glyphs = glyphs.sort();
			wtSites.update({data});
		}
	} catch (err) {
		log.error(`Failed check for new glyphs: ${err.stack}`);
	}
};

const checkExtranetStats = async (req, timestamp) => {
	return new Promise(async (resolve, reject) => {
		try {
			const wtSites = await Watcher.findOne({
				where: {
					watcherName: 'wt-sites'
				}
			});
			const handler = new htmlparser.DomHandler(error => {
				if (error) {
					reject(error);
				}
			});
			const parser = new htmlparser.Parser(handler);
			parser.write(req.body);
			parser.done();
			const rawStats = CSSselect('div[class=num]', handler.dom);
			const stats = rawStats.map(rawStat => Number(he.decode(rawStat.children[0].data).replace(/\s/g, '')));
			const ss = await Spreadsheet.load({
				oauth2: config.spreadsheet_auth,
				spreadsheetId: '1A8zODah54JUhO6ClFs8wNVvKLpLzWwm04lzOlS9mmAU',
				worksheetId: 'od6'
			});
			const data = wtSites.data || {
				channels: [],
				sites: {},
				glyphs: [],
				extranetMessages: {},
				spreadsheetLine: 2
			};
			data.spreadsheetLine += 1;
			const line = data.spreadsheetLine;
			const lastSpreadsheetLine = (await ss.receive())[0][line - 1];
			if (lastSpreadsheetLine['3'] !== stats[0] || lastSpreadsheetLine['5'] !== stats[1] || lastSpreadsheetLine['7'] !== stats[2] || lastSpreadsheetLine['9'] !== stats[3]) {
				ss.add({
					[line]: [[
						timestamp.utc().format('Do MMMM'),
						timestamp.utc().format('hh:mmA'),
						stats[0],
						`=C${line} - C${line - 1}`,
						stats[1],
						`=E${line} - E${line - 1}`,
						stats[2],
						`=G${line} - G${line - 1}`,
						stats[3],
						`=I${line} - I${line - 1}`
					]]
				});
				await Promise.all([wtSites.update({data}), ss.send()]);
				resolve('StatsChange');
			} else {
				resolve('NoChange');
			}
		} catch (err) {
			reject(err);
		}
	});
};

const checkSite = async (site, bot) => {
	return new Promise(async (resolve, reject) => {
		try {
			let wtSites = await Watcher.findOne({
				where: {
					watcherName: 'wt-sites'
				}
			});
			let data = wtSites.data || {
				channels: [],
				sites: {},
				glyphs: [],
				extranetMessages: {}
			};
			const reqOpts = {headers: {}};
			if (site === 'https://wakingtitan.com') {
				reqOpts.headers.Cookie = 'terminal=%5B%22atlas%22%2C%22csd%22%2C%222fee0b5b-6312-492a-8308-e7eec4287495%22%2C%2205190fed-b606-4321-a52e-c1d1b39f2861%22%2C%22f7c05c4f-18a5-47a7-bd8e-804347a15f42%22%5D; archive=%5B%229b169d05-6b0b-49ea-96f7-957577793bef%22%2C%2267e3b625-39c0-4d4c-9241-e8ec0256b546%22%2C%224e153ce4-0fec-406f-aa90-6ea62e579369%22%2C%227b9bca5c-43ba-4854-b6b7-9fffcf9e2b45%22%2C%222f99ac82-fe56-43ab-baa6-0182fd0ed020%22%2C%22b4631d12-c218-4872-b414-9ac31b6c744e%22%2C%227b34f00f-51c3-4b6c-b250-53dbfaa303ef%22%2C%2283a383e2-f4fc-4d8d-905a-920057a562e7%22%2C%227ed354ba-b03d-4c56-ade9-3655aff45179%22%5D';
			} else if (site === 'https://extranet.ware-tech.cloud' || site === 'https://extranet.ware-tech.cloud/documents' || site === 'https://extranet.ware-tech.cloud/taskmanager' || site === 'https://extranet.ware-tech.cloud/supplyrequest') {
				reqOpts.headers.Cookie = 'token=fd91b1c75a6857e7fd00caf61ffc0181c1492096';
			}
			const req = await snek.get(`${site}?_=${Math.random()}`, reqOpts); // Req.body is a buffer for unknown reasons

			const timestamp = moment();
			const pageCont = clean(req.body.toString());
			const oldCont = clean(jetpack.read(`./watcherData/${data.sites[site]}-latest.html`));
			if (pageCont.replace(/\s/g, '').replace(/>[\s]+</g, '><').replace(/"\s+\//g, '"/') === oldCont.replace(/\s/g, '').replace(/>[\s]+</g, '><').replace(/"\s+\//g, '"/')) {
				// Log.debug(`No change on ${site}.`);
				return resolve(hasUpdate[site] = false);
			}
			log.verbose(`There's been a possible change on ${site}`);
			if (hasUpdate[site]) {
				return resolve(log.warn(`${site} only just had an update, there's probably a bug.`));
			}
			await delay(2000);
			const req2 = await snek.get(`${site}?_=${Math.random()}`, reqOpts);
			const pageCont2 = clean(req2.body.toString());
			if (pageCont2 !== pageCont) {
				log.verbose('Update was only temporary. Rejected broadcast protocol.');
				return resolve(hasUpdate[site] = false);
			}
			log.info(`Confirmed change on ${site}`);

			jetpack.write(`./watcherData/${data.sites[site]}-temp.html`, req.body.toString());
			const res = await exec(`~/.nvm/versions/node/v9.3.0/lib/node_modules/diffchecker/dist/diffchecker.js ./watcherData/${data.sites[site]}-latest.html ./watcherData/${data.sites[site]}-temp.html`, {
				cwd: '/home/matt/OcelBot'
			});
			let status;
			let embedDescription;
			if (res.stderr.length > 0) {
				log.error(`Could not generate diff: ${res.stderr.slice(0, -1)}`);
				embedDescription = 'The diff could not be generated.';
				status = `${site} has updated! #WakingTitan`;
			} else {
				embedDescription = `View the change [here](${res.stdout.split(' ').pop().slice(0, -1)}).`;
				status = `${site} has updated! See what's changed here: ${res.stdout.split(' ').pop().slice(0, -1)} #WakingTitan`;
			}
			const embed = new Discord.RichEmbed({
				color: 0x993E4D,
				timestamp: timestamp.toISOString(),
				description: embedDescription,
				author: {
					name: `${site.split('/').splice(2).join('/')} has updated`,
					url: site,
					icon_url: 'https://cdn.artemisbot.uk/img/hexagon.png'
				},
				footer: {
					icon_url: 'https://cdn.artemisbot.uk/img/watchingtitan.png',
					text: 'Watching Titan'
				}
			});
			let sendTweet = true;
			let extranet = false;
			if (site === 'https://extranet.ware-tech.cloud') {
				try {
					log.verbose('Checking WARE Extranet stats.');
					const statsResult = await checkExtranetStats(req2, timestamp);
					if (statsResult === 'StatsChange') {
						log.verbose('Confirmed change to WARE Extranet stats, suppressing normal broadcast.');
						embed.setAuthor(`WARE Developer Dashboard stats have updated!`, 'https://cdn.artemisbot.uk/img/hexagon.png', site);
						embed.setDescription(`Stat updates can be seen [here](https://docs.google.com/spreadsheets/d/1A8zODah54JUhO6ClFs8wNVvKLpLzWwm04lzOlS9mmAU).\n${embedDescription}`);
						sendTweet = false;
						extranet = true;
					} else {
						log.info('No change to WARE Extranet stats. Proceeding normally.');
					}
				} catch (err) {
					log.error(`Failed to check extranet stats for updates! Proceeding normally. Error: ${err.stack}`);
				}
			}
			if (site === 'https://wakingtitan.com') {
				checkGlyphs(bot);
			}
			wtSites = await Watcher.findOne({
				where: {
					watcherName: 'wt-sites'
				}
			});
			data = wtSites.data || {
				channels: [],
				sites: {},
				glyphs: [],
				extranetMessages: {}
			};
			await wtSites.update({data});
			jetpack.remove(`./watcherData/${data.sites[site]}-temp.html`);
			jetpack.write(`./watcherData/${data.sites[site]}-latest.html`, req.body.toString());
			jetpack.write(`./watcherData/${data.sites[site]}-logs/${strftime('%F - %H-%M-%S')}.html`, req.body.toString());
			if (!extranet) {
				const maxListeners = bot.getMaxListeners();
				let doPost = true;
				if (['https://www.nomanssky.com', 'https://extranet.ware-tech.cloud'].includes(site)) {
					doPost = false;
					const helpers = await Promise.all(config.helpers.map(helperID => {
						return bot.fetchUser(helperID);
					}));
					const onlineHelpers = helpers.filter(helper => {
						const result = () => {
							if (['dnd', 'offline'].includes(helper.presence.status)) {
								log.debug(`Checking ${helper.username}#${helper.discriminator}. User ${helper.presence.status}, not contacting.`);
								return false;
							}
							log.debug(`Checking ${helper.username}#${helper.discriminator}. User ${helper.presence.status}, contacting.`);
							return true;
						};
						// Console.log(result());
						return result();
					});
					// Console.log(onlineHelpers);
					const reactQueries = onlineHelpers.map(async helper => {
						bot.setMaxListeners(maxListeners + 1);
						const dm = await helper.createDM();
						log.debug(`Contacting ${helper.username}#${helper.discriminator}.`);
						return ReactionHandler.reactQuery({
							embed: {
								author: {
									icon_url: 'https://cdn.artemisbot.uk/img/watchingtitan.png',
									name: 'Watching Titan'
								},
								title: `${site} update confirmation`,
								description: `${embedDescription}\nDo you think this is an important update? (please, please, please, check the diff if it exists.) Please vote using the reactions below.`,
								color: 2212073
							},
							type: 'y/n'
						}, helper.id, dm);
					});
					log.verbose(`Consulting ${reactQueries.length} helpers: ${onlineHelpers.map(helper => `${helper.username}#${helper.discriminator}`).join(', ')}.`);
					const raceResult = await Promise.race(reactQueries);
					bot.setMaxListeners(maxListeners);
					doPost = raceResult.result;
					const raceWinner = await bot.fetchUser(raceResult.userID);
					log.verbose(`Race resolved by ${raceWinner.username}#${raceWinner.discriminator}, result ${raceResult.result ? 'APPROVED' : 'DENIED'}.`);
					config.helpers.forEach(async helperID => {
						const helper = await bot.fetchUser(helperID);
						if (['dnd', 'offline'].includes(helper.presence.status)) {
							return;
						}
						const dm = await helper.createDM();
						dm.send(`The above update has been ${raceResult.result ? 'APPROVED' : 'DENIED'} by ${raceWinner.username}#${raceWinner.discriminator}. Broadcast ${raceResult.result ? 'going ahead.' : 'suppressed.'}`);
					});
				}

				if (!doPost) {
					return resolve(hasUpdate[site] = false);
				}

				await Promise.all(data.channels.map(async channel => {
					const m = await bot.channels.get(channel).send('', {embed});
					try {
						if (extranet) {
							if (data.extranetMessages[channel]) {
								log.verbose('Deleting previous update message!');
								(await bot.channels.get(channel).fetchMessage(data.extranetMessages[channel])).delete();
							}
							data.extranetMessages[channel] = m.id;
						}
					} catch (err) {
						log.warn(`Unable to delete old update message for extranet: ${err.stack}`);
					}
				}));
				if (sendTweet) {
					await T.post('statuses/update', {
						status
					});
				}
				await snek.get(`https://web.archive.org/save/${site}`);
				return resolve(hasUpdate[site] = true);
			}
			return resolve(hasUpdate[site] = false);
		} catch (err) {
			if (err.status) {
				log.error(`Failed to check site ${site}. ${err.status}: ${err.statusText}`);
			} else {
				log.error(`Failed to check site ${site}: ${err.stack}`);
			}
			return reject(err);
		}
	});
};

// Checks for updates on waking titan sites
const querySites = async bot => {
	await Watcher.sync();
	const wtSites = await Watcher.findOne({
		where: {
			watcherName: 'wt-sites'
		}
	});
	const data = wtSites.data || {
		channels: [],
		sites: {},
		glyphs: [],
		extranetMessages: {}
	};
	try {
		log.debug(`Checking sites: ${Object.values(data.sites).join(', ')}`);
		const result = await Promise.all(Object.keys(data.sites).map(site => checkSite(site, bot)));
		if (!result.includes(true)) {
			log.debug('No changes on any sites.');
		}
		repeat = setTimeout(async () => {
			querySites(bot);
		}, 90 * 1000);
	} catch (err) {
		if (err.status) {
			log.warn(`Failed to access a site. Will retry in 90 seconds.`);
			repeat = setTimeout(async () => {
				querySites(bot);
			}, 90 * 1000);
		} else {
			log.error(`Site query failed. ${exports.data.name} has been disabled for safety.`);
			bot.channels.get('338712920466915329').send(`Site query failed, ${exports.data.name} disabled.`);
		}
	}
};

// Starts intervals
exports.watcher = async bot => {
	// In case of restarting this watcher, kill all loops
	this.disable();
	log.verbose(chalk.green(`${exports.data.name} has initialised successfully.`));
	repeat = setTimeout(async () => {
		querySites(bot);
	}, 30 * 1000); // Do this after 30 seconds (not an interval because the bot sets a new timeout when previous execution is complete)
};

exports.start = async (msg, bot, args) => {
	await Watcher.sync();
	const wtSites = await Watcher.findOne({
		where: {
			watcherName: 'wt-sites'
		}
	});
	const data = wtSites.data || {
		channels: [],
		sites: {},
		glyphs: [],
		extranetMessages: {}
	};
	if (args[0]) {
		if (!args[1]) {
			return msg.reply('You must supply an alias for this site.');
		}
		if (Object.keys(data.sites).map(site => site.replace(/https?:\/\//g, '')).includes(args[0].replace(/https?:\/\/|\//g, ''))) {
			return msg.reply('Already watching this site.');
		}
		if (Object.values(data.sites).includes(args[1])) {
			return msg.reply('Already watching a site with this alias.');
		}
		log.debug(`Attempting to enable global watching of ${args[0]} in #${msg.channel.name} on ${msg.guild.name}.`);
		try {
			const site = await snek.get(args[0]);
			log.debug('Fetched page.');
			jetpack.write(`./watcherData/${args[1]}-latest.html`, site.body.toString());
			jetpack.write(`./watcherData/${args[1]}-logs/${strftime('%F - %H-%M-%S')}.html`, site.body.toString());
			log.debug('Saved page.');
			data.sites[args[0]] = args[1];
			log.debug('Cached address for future searches.');
			wtSites.update({data});
			log.debug(`Now globally watching ${args[1]} (${args[0]}).`);
			return msg.reply('Now globally watching this site.');
		} catch (err) {
			log.error(`Failed to add new site: ${err}`);
			return msg.reply('Failed to find specified site.');
		}
	} else {
		if (data.channels.includes(msg.channel.id)) {
			return msg.reply('Already watching for Waking Titan site & glyph changes in this channel.');
		}
		data.channels.push(msg.channel.id);
		msg.reply('Now watching for Waking Titan site & glyph changes in this channel.');
		log.info(`Now watching in #${msg.channel.name} on ${msg.guild.name}.`);
		wtSites.update({data});
	}
};

exports.disable = () => {
	clearTimeout(repeat);
};
