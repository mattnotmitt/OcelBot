class ReactionHandler {
	static reactQuery(query, userID, channel) {
		this.reactTypes = {
			'y/n': {
				'☑': true,
				'❌': false
			}
		};
		return new Promise(async (resolve, reject) => {
			try {
				// console.log("New query!");
				const dMsg = await channel.send('', {embed: query.embed});
				await Promise.all(Object.keys(this.reactTypes[query.type]).map(emote => dMsg.react(emote)));
				const response = await dMsg.awaitReactions((react, user) => {
					console.log(react.emoji.name);
					console.log(Object.keys(this.reactTypes[query.type]));
					if (user.id === userID && Object.keys(this.reactTypes[query.type]).includes(react.emoji.name)) {
						// console.log("Valid react.");
						return true;
					}
					return false;
				}, {max: 1});
				const result = this.reactTypes[query.type][response.first().emoji.name];
				// console.log("Resolving");
				resolve({
					result,
					userID
				});
			} catch (err) {
				reject(err);
			}
		});
	}
}

module.exports = ReactionHandler;
