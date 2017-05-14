exports.data = {
  name: 'Active Agent',
  description: 'Toggles the "Active Agent" role so that users in need of help can tag you.',
  group: 'help',
  command: 'onduty',
  syntax: '!onduty',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 0
}

exports.func = async(msg, args, bot) => {
  if (!(msg.guild.available)) return bot.delReply(msg, 'The bot cannot communicate with the guild servers. :(')
  if (!(msg.guild.roles.exists('name', 'Active Agent'))) {
    msg.reply(`This guild does not have an "Active Agent" role - creating it now.`).then(m => m.delete(5000))
    await msg.guild.createRole({
      name: 'Active Agent',
      mentionable: true
    })
  }
  let dutyRole = msg.guild.roles.find('name', 'Active Agent')
  if (msg.member.roles.has(dutyRole.id)) {
    msg.member.removeRole(dutyRole)
    bot.delReply(msg, `"Active Agent" role has been removed, thank you for your help!`)
    bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has been removed from duty in #${msg.channel.name}.`)
  } else {
    msg.member.addRole(dutyRole)
    bot.delReply(msg, `You are now on duty - users will be able to ping you and other agents with this role to ask for help.`, 10000)
    bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has gone on duty in #${msg.channel.name}.`)
  }
}
