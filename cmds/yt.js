/*
 * Name: YouTube Embeds
 * Author: Matt C [matt@artemisbot.uk]
 * Description: Creates embeds for YouTube Videos, Channels and Playlists.
 */

exports.data = {
	name: 'YouTube Embeds',
	nick: 'youtube',
	command: 'yt',
	description: 'Creates embeds for YouTube Videos from ID - NOT LINK YET.',
	group: 'embeds',
	author: 'Matt C: matt@artemisbot.uk',
	syntax: 'yt [id]',
	permissions: 0,
	anywhere: true
};

const request = require('request-promise-native');
const moment = require('moment');
const humanize = require('humanize-duration');

const config = require('../config.json');
const log = require('../lib/log')(exports.data.name);

exports.func = async (msg, args) => {
	try {
		const options = {
			url: 'https://www.googleapis.com/youtube/v3',
			key: config.youtubeKey
		};
		if (!args[0]) {
			return msg.reply(`You haven't provided enough arguments. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`);
		}
		let searchResult = await request(`${options.url}/videos?key=${options.key}&id=${args[0]}&part=statistics,snippet,contentDetails`);
		searchResult = JSON.parse(searchResult).items[0];
		if (!searchResult) {
			return msg.reply('There was nothing found with that video ID.');
		}
		msg.channel.stopTyping();
		let channelInfo = await request(`${options.url}/channels?key=${options.key}&id=${searchResult.snippet.channelId}&part=statistics,snippet`);
		channelInfo = JSON.parse(channelInfo).items[0];
		const embed = {
			author: {
				name: searchResult.snippet.title,
				url: `https://youtube.com/watch?v=${searchResult.id}`,
				icon_url: channelInfo.snippet.thumbnails.default.url
			},
			color: 16655651,
			thumbnail: {url: searchResult.snippet.thumbnails.default.url},
			fields: [
				{
					name: 'Channel',
					value: `[${channelInfo.snippet.title}](https://www.youtube.com/channel/${searchResult.snippet.channelId})`,
					inline: true
				},
				{
					name: 'Duration',
					value: humanize(moment.duration(searchResult.contentDetails.duration)),
					inline: false
				},
				{
					name: 'Views',
					value: parseInt(searchResult.statistics.viewCount, 10).toLocaleString(),
					inline: true
				},
				{
					name: 'Upload Date',
					value: moment(searchResult.snippet.publishedAt).format('Do MMMM YYYY, h:mm:ss a'),
					inline: true
				}
			],
			footer: {
				text: `Powered by YouTube API. Took ${moment().diff(msg.createdAt)} ms.`,
				icon_url: 'https://cdn.artemisbot.uk/img/youtube.png'
			}
		};
		await msg.channel.send('', {embed});
	} catch (err) {
		msg.reply('Couldn\'t get requested YouTube video.');
		log.error(`Failed to get YouTube video: ${err.stack}`);
		msg.channel.stopTyping(true);
	}
};
