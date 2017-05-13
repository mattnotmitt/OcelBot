exports.data = {
  name: 'Disable Command',
  command: 'disable',
  description: 'Disables a command.',
  group: 'system',
  author: 'Matt C: matt@artemisbot.pw',
  permissions: 4
}

exports.func = (msg, args, bot) => {
  let command
  bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has disabled ${args[0]} in #${msg.channel.name}.`)
  if (bot.commands.has(args[0])) command = args[0]
  if (!command) return msg.channel.sendMessage(`I cannot find the command: ${args[0]}`)
  msg.channel.sendMessage(`Enabling: ${command}`)
    .then((m) => {
      bot.disable(command)
        .then(() => m.edit(`Successfully disabled: ${command}`))
        .catch(e => m.edit(`Command disable failed: ${command}\n\`\`\`${e.stack}\`\`\``))
    })
}
