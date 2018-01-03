exports.data = {
	name: 'Operation',
	group: '',
	command: 'operation',
	syntax: 'operation [function] [params]',
	help: {
		author: 'Matt C: matt@artemisbot.uk',
		description: 'Commands to do with operation roles',
		functions: {
			create: {
				description: 'Creates a new operation in the current guild.',
				params: '[operation]'
			},
			join: {
				description: 'Joins the specified operation in the current guild.',
				params: '[operation]'
			},
			leave: {
				description: 'Leaves the specified operation in the current guild.',
				params: '[operation]'
			},
			alert: {
				description: 'Alerts all assigned agents of the specified operation in the current guild.',
				params: '[operation]'
			}
		}
	},
	asOnly: true,
	anywhere: true,
	permissions: 0
};
const Operation = require('../lib/models/operation');
const log = require('../lib/log.js')(exports.data.name);

exports.func = async (msg, args) => {
	Operation.sync();
	switch (args[0]) {
		case ('create'): {
			if (msg.elevation >= 3) {
				if (!args[1]) {
					return msg.reply('Provide an operation name.');
				}
				if (await Operation.findOne({where: {name: {$iLike: args[1].toLowerCase()}, guildID: msg.guild.id}})) {
					return msg.reply(`There is already an operation with the name \`${args[1]}\` in ${msg.guild.name}.`);
				}
				const role = await msg.guild.createRole({
					name: args[1],
					mentionable: false
				});
				await Operation.create({
					name: args[1],
					roleID: role.id,
					guildID: msg.guild.id
				});
				log.info(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has created operation ${args[1]} in #${msg.channel.name} on ${msg.guild.name}.`);
				return msg.reply(`Operation \`${args[1]}\` initialised! Join it with \`ocel operation join ${args[1]}\`.`);
			}
			return msg.reply(':newspaper2: You don\'t have permission to use this operation command.');
		} case ('delete'): {
			if (msg.elevation >= 3) {
				if (!args[1]) {
					return msg.reply('Provide an operation name.');
				}
				const op = await Operation.findOne({where: {name: {$iLike: args[1].toLowerCase()}, guildID: msg.guild.id}});
				if (!op) {
					return msg.reply(`There is not an operation with the name \`${args[1]}\` in ${msg.guild.name}.`);
				}
				const opRole = msg.guild.roles.get(op.roleID);
				opRole.setMentionable(true).then(async role => {
					await msg.channel.send(`Attention agents; Operation <@&${role.id}> is complete! You have all been unassigned from duty for this operation.`);
					await Promise.all([role.delete(), op.destroy()]);
				});
				return log.info(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has deleted operation ${args[1]} in #${msg.channel.name} on ${msg.guild.name}.`);
			}
			return msg.reply(':newspaper2: You don\'t have permission to use this operation command.');
		} case ('join'): {
			try {
				if (msg.elevation >= 3 || msg.server.permitChan.includes(msg.channel.id)) {
					if (!args[1]) {
						return msg.reply('Provide an operation name.');
					}
					const op = await Operation.findOne({where: {name: {$iLike: args[1].toLowerCase()}, guildID: msg.guild.id}});
					if (!(op)) {
						return msg.reply(`There no operation with the name \`${args[1]}\` in ${msg.guild.name}.`);
					}
					if (msg.member.roles.has(op.roleID)) {
						return msg.reply(`You are already assigned to Operation \`${op.name}\` in ${msg.guild.name}.`);
					}
					const opRole = msg.guild.roles.get(op.roleID);
					await msg.member.addRole(opRole);
					log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has joined operation ${op.name} in #${msg.channel.name} on ${msg.guild.name}.`);
					return msg.reply(`You have been assigned to Operation ${op.name}. Good luck agent.`);
				}
				break;
			} catch (err) {
				log.error(`Could not assign user to an operation: ${err}`);
				return msg.reply(`Could not assign you to this operation. Contact Agent <@132479572569620480> for help.`);
			}
		} case ('leave'): {
			try {
				if (msg.elevation >= 3 || msg.server.permitChan.includes(msg.channel.id)) {
					if (!args[1]) {
						return msg.reply('Provide an operation name.');
					}
					const op = await Operation.findOne({where: {name: {$iLike: args[1].toLowerCase()}, guildID: msg.guild.id}});
					if (!(op)) {
						return msg.reply(`There no operation with the name \`${args[1]}\` in ${msg.guild.name}.`);
					}
					if (!msg.member.roles.has(op.roleID)) {
						return msg.reply(`You are not assigned to Operation \`${op.name}\` in ${msg.guild.name}.`);
					}
					const opRole = msg.guild.roles.get(op.roleID);
					await msg.member.removeRole(opRole);
					log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has left operation ${op.name} in #${msg.channel.name} on ${msg.guild.name}.`);
					return msg.reply(`You have been dismissed from Operation ${op.name}.`);
				}
				break;
			} catch (err) {
				log.error(`Could not remove user from an operation: ${err}`);
				return msg.reply(`Failed to remove you from this operation. Contact Agent <@132479572569620480> for help.`);
			}
		} case ('alert'): {
			try {
				if (msg.elevation >= 2) {
					if (!args[1]) {
						return msg.reply('Provide an operation name.');
					}
					const op = await Operation.findOne({where: {name: {$iLike: args[1].toLowerCase()}, guildID: msg.guild.id}});
					if (!(op)) {
						return msg.reply(`There no operation with the name \`${args[1]}\` in ${msg.guild.name}.`);
					}
					const opRole = msg.guild.roles.get(op.roleID);
					opRole.setMentionable(true).then(async role => {
						await msg.channel.send(`Attention agents, new intel in Operation <@&${role.id}>!`);
						await opRole.setMentionable(false);
					});
					return log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has alerted agents assigned to ${op.name} in #${msg.channel.name} on ${msg.guild.name}.`);
				}
				return msg.reply(':newspaper2: You don\'t have permission to use this operation command.');
			} catch (err) {
				log.error(`Could not alert operation agents: ${err}`);
				return msg.reply(`Failed to alert operation agents. Contact Agent <@132479572569620480> for help.`);
			}
		} case ('list'): {
			if (msg.elevation >= 3 || msg.server.permitChan.includes(msg.channel.id)) {
				msg.reply('Active operations in this guild are `TidalVortex`.');
			}
			break;
		} case ('help'): {
			if (msg.elevation >= 3 || msg.server.permitChan.includes(msg.channel.id)) {
				msg.reply('Available operation commands in this guild are `create, delete, join, leave, alert, list, help`');
			}
			break;
		} default: {
			msg.reply(`Unknown operation command. View \`ocel operation help\` for possible commands.`);
			break;
		}
	}
};
