exports.data = {
  name: 'Enable Command',
  command: 'enable',
  description: 'Enables a new/disabled command.',
  syntax: '!enable [command]',
  group: 'system',
  author: 'Matt C: matt@artemisbot.pw',
  permissions: 4
}

exports.func = async (msg, args, bot) => {
  const command = args[0]
  if (args.length !== 1) return msg.reply(`You haven't provided enough arguments. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`)
  bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has enabled ${command} in #${msg.channel.name}.`)
  msg.channel.sendMessage(`Enabling: ${command}`)
    .then((m) => {
      bot.enable(command)
        .then(() => m.edit(`Successfully enabled: ${command}`))
        .catch((e) => m.edit(`Command enable failed: ${command}\n\`\`\`${e.stack}\`\`\``))
    })
}
