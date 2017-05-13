exports.data = {
  name: 'Reload Command',
  command: 'reload',
  description: 'Reloads a command.',
  group: 'system',
  author: 'Matt C: matt@artemisbot.pw',
  permissions: 4
}

exports.func = async(msg, args, bot) => {
  let command
  if (bot.commands.has(args[0])) command = args[0]
  bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has reloaded command ${command} in #${msg.channel.name}.`)
  if (!command) return msg.channel.sendMessage(`I cannot find the command: ${args[0]}`)
  msg.channel.sendMessage(`Enabling: ${command}`)
    .then((m) => {
      bot.reload(command)
        .then(() => {
          m.edit(`Successfully reloaded: ${command}`)
        })
        .catch(e => m.edit(`Command reload failed: ${command}\n\`\`\`${e.stack}\`\`\``))
    })
}
