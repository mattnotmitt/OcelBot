const uuidv4 = require('uuid/v4');
const EmoteDB = require('./lib/models/emote');
const emoteList = require('./emotes.json');
const Database = require('./lib/db');

Database.start();
EmoteDB.sync();

Object.keys(emoteList).forEach(async guildId => {
	Object.keys(emoteList[guildId]).forEach(async emoteName => {
		EmoteDB.create({
			emoteID: uuidv4(),
			name: emoteName,
			path: `${guildId}/${emoteList[guildId][emoteName].file}`,
			guildId
		}).then(() => console.log('done'));
	});
});
