// ================| Initialisation |================

exports.data = {
	name: 'Waking Titan Sites & Glyphs',
	command: 'wt-sites'
};

// Loads required modules
const chalk = require('chalk');
const CSSselect = require('css-select');
const Discord = require('discord.js');
const exec = require('child-process-promise').exec;
const htmlparser = require('htmlparser2');
const jetpack = require('fs-jetpack');
const moment = require('moment');
const request = require('request-promise-native');
const strftime = require('strftime');
const Twit = require('twit');

const log = require('../lib/log.js')(exports.data.name);
const config = require('../config.json');
const Watcher = require('../lib/models/watcher');

const T = new Twit(config.WTTwitter);

// Makes repeats global

const hasUpdate = {
	'https://echo-64.com': false,
	'https://atlas-65.com': false,
	'https://superlumina-6c.com': false,
	'https://myriad-70.com': false,
	'https://multiverse-75.com': false,
	'https://wakingtitan.com': false,
	'http://csd.atlas-65.com': false,
	'https://project-wt.com': false,
	'https://www.nomanssky.com': false
};
let repeat;

// ================| Helper Functions |================

const clean = str => {
	return str.replace(/<script[\s\S]*?>[\s\S]*?<\/script>|<link\b[^>]*>|Email:.+>|data-token=".+?"|email-protection#.+"|<div class="vc_row wpb_row vc_row-fluid no-margin parallax.+>|data-cfemail=".+?"|<!--[\s\S]*?-->/ig, '');
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ================| Main Functions |================

// Checks status of glyphs on wakingtitan.com
const checkGlyphs = async bot => {
	try {
		await Watcher.sync();
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
		const body = await request({
			url: 'https://wakingtitan.com'
		});
		const glyphs = [];
		let change = false;
		const handler = new htmlparser.DomHandler(error => {
			if (error) {
				log.error(error);
			}
		});
		const parser = new htmlparser.Parser(handler);
		parser.write(body);
		parser.done();
		const disGlyph = CSSselect('a[class=glyph]', handler.dom);
		for (const element of disGlyph) {
			glyphs.push(element.attribs.style.split('(')[1].slice(0, -1));
		}
		for (let i = 0; i < glyphs.length; i++) {
			if (glyphs.sort()[i] !== data.glyphs[i]) {
				log.info('New glyph at wakingtitan.com');
				const embed = new Discord.RichEmbed({
					color: 0x993E4D,
					timestamp: moment().toISOString(),
					description: 'That\'s good, innit!',
					footer: {
						icon_url: 'https://cdn.artemisbot.uk/img/ocel.jpg',
						text: 'Ocel'
					},
					author: {
						name: 'New glyph has activated!',
						url: 'https://wakingtitan.com',
						icon_url: 'http://i.imgur.com/PFQODUN.png'
					},
					thumbnail: {
						url: `http://wakingtitan.com${glyphs.sort()[i]}`
					}
				});
				for (const channel of data.channels) {
					await bot.channels.get(channel).send('', {
						embed
					});
				}
				const resp = await request({
					url: `http://wakingtitan.com${glyphs.sort()[i]}`,
					encoding: null
				});
				const img = Buffer.from(resp, 'utf8');
				jetpack.write(`watcherData/glyphs/glyph${glyphs.sort()[i].split('/').slice(-1)[0]}`, img);
				const uploadResult = await T.post('media/upload', {
					media_data: img.toString('base64')
				});
				setTimeout(async () => {
					const result = await T.post('media/metadata/create', {
						media_id: uploadResult.data.media_id_string,
						alt_text: {
							text: 'Glyph from wakingtitan.com.'
						}
					});
					T.post('statuses/update', {
						status: 'A new glyph has been activated at wakingtitan.com! #WakingTitan',
						media_ids: result.data.media_id_string
					});
				}, 30 * 1000);
				change = true;
			}
		}
		if (change) {
			data.glyphs = glyphs.sort();
			wtSites.update({data});
		}
	} catch (err) {
		log.error(exports.data.name, err);
	}
};

const checkSite = async (site, bot) => {
	return new Promise(async (resolve, reject) => {
		try {
			await Watcher.sync();
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
			const cookJar = request.jar();
			if (site === 'https://wakingtitan.com') {
				cookJar.setCookie(request.cookie('archive=%5B%229b169d05-6b0b-49ea-96f7-957577793bef%22%2C%2267e3b625-39c0-4d4c-9241-e8ec0256b546%22%2C%224e153ce4-0fec-406f-aa90-6ea62e579369%22%2C%227b9bca5c-43ba-4854-b6b7-9fffcf9e2b45%22%2C%222f99ac82-fe56-43ab-baa6-0182fd0ed020%22%2C%22b4631d12-c218-4872-b414-9ac31b6c744e%22%2C%227b34f00f-51c3-4b6c-b250-53dbfaa303ef%22%2C%2283a383e2-f4fc-4d8d-905a-920057a562e7%22%5D'), site);
			}
			const body = await request({
				url: site,
				jar: cookJar
			});
			const pageCont = clean(body);
			const oldCont = clean(jetpack.read(`./watcherData/${data.sites[site]}-latest.html`));
			if (pageCont.replace(/\s/g, '').replace(/>[\s]+</g, '><').replace(/"\s+\//g, '"/') === oldCont.replace(/\s/g, '').replace(/>[\s]+</g, '><').replace(/"\s+\//g, '"/')) {
				log.debug(`No change on ${site}.`);
				return resolve(hasUpdate[site] = false);
			}
			log.verbose(`There's been a possible change on ${site}`);
			await delay(5000);
			const body2 = await request({
				url: site,
				jar: cookJar
			});
			const pageCont2 = clean(body2);
			if (pageCont2 !== pageCont) {
				log.verbose('Update was only temporary. Rejected broadcast protocol.');
				return resolve(hasUpdate[site] = false);
			}
			if (hasUpdate[site]) {
				resolve(log.verbose('Site only just had an update, there\'s probably a bug.'));
			}
			log.info(`Confirmed change on ${site}`);
			const embed = new Discord.RichEmbed({
				color: 0x993E4D,
				timestamp: moment().toISOString(),
				author: {
					name: `${site.split('/').splice(2).join('/')} has updated`,
					url: site,
					icon_url: 'http://i.imgur.com/PFQODUN.png'
				},
				footer: {
					icon_url: 'https://cdn.artemisbot.uk/img/ocel.jpg',
					text: 'Ocel'
				}
			});
			jetpack.write(`./watcherData/${data.sites[site]}-temp.html`, body);
			const res = await exec(`~/.nvm/versions/node/v9.3.0/lib/node_modules/diffchecker/dist/diffchecker.js ./watcherData/${data.sites[site]}-latest.html ./watcherData/${data.sites[site]}-temp.html`, {
				cwd: '/home/matt/OcelBot'
			});
			let status;
			if (res.stderr.length > 0) {
				log.error(`Could not generate diff: ${res.stderr.slice(0, -1)}`);
				embed.setDescription('The diff could not be generated.');
				status = `${site} has updated! #WakingTitan`;
			} else {
				embed.setDescription(`View the change [here](${res.stdout.split(' ').pop().slice(0, -1)}).`);
				status = `${site} has updated! See what's changed here: ${res.stdout.split(' ').pop().slice(0, -1)} #WakingTitan`;
			}
			if (site === 'https://wakingtitan.com') {
				checkGlyphs(bot);
			}
			await T.post('statuses/update', {
				status
			});
			for (const channel of data.channels) {
				await bot.channels.get(channel).send('', {
					embed
				});
			}
			await request(`https://web.archive.org/save/${site}`);
			jetpack.remove(`./watcherData/${data.sites[site]}-temp.html`);
			jetpack.write(`./watcherData/${data.sites[site]}-latest.html`, body);
			jetpack.write(`./watcherData/${data.sites[site]}-logs/${strftime('%F - %H-%M-%S')}.html`, body);
			return resolve(hasUpdate[site] = true);
		} catch (err) {
			log.error(`Failed to check site ${site}: ${err}`);
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
		glyphs: []
	};
	try {
		await Promise.all(Object.keys(data.sites).map(site => checkSite(site, bot)));
	} catch (err) {
		log.error(`Failed to query sites: ${err}`);
	}
};

// Starts intervals
exports.watcher = async bot => {
	// In case of restarting this watcher, kill all loops
	this.disable();
	log.verbose(chalk.green(`${exports.data.name} has initialised successfully.`));
	repeat = setInterval(async () => {
		querySites(bot);
	}, 30 * 1000); // Repeat every 30 seconds
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
		glyphs: []
	};
	console.log(args);
	if (args[0]) {
		if (!args[1]) {
			return msg.reply('You must supply an alias for this site.');
		}
		if (Object.keys(data.sites).map(site => site.replace(/https?:\/\//g, '')).includes(args[0].replace(/https?:\/\/|\//g, ''))) {
			return msg.reply('Already watching this site.');
		}
		if (Object.values(data.wtSites.sites).includes(args[1])) {
			return msg.reply('Already watching a site with this alias.');
		}
		try {
			const body = await request(args[0]);
			jetpack.write(`./watcherData/${args[1]}-latest.html`, body);
			jetpack.write(`./watcherData/${args[1]}-logs/${strftime('%F - %H-%M-%S')}.html`, body);
			data.sites[args[0]] = args[1];
			wtSites.update({data});
			return msg.reply('Now globally watching this site.');
		} catch (err) {
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
	clearInterval(repeat);
};
