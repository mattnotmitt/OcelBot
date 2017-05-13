const jetpack = require('fs-jetpack')

exports.data = {
  name: 'Delete Emote',
  description: 'Deletes the specified emote.',
  group: 'emotes',
  command: 'delemote',
  syntax: '!delemote [emote_name]',
  author: 'Matt C: matt@artemisbot.pw',
  permissions: 3
}

exports.func = (msg, args, bot) => {
  let emotelist = jetpack.read('emotes.json', 'json'),
    name = args[0]
  if (args.length !== 1) return msg.reply(`There are not enough arguments in this command. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`)
  if (!emotelist[name]) return msg.reply('The selected emote does not exist.')
  bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has deleted emote ${name} in #${msg.channel.name}.`)
  jetpack.remove(`./emotes/${emotelist[name].file}`)
  delete emotelist[name]
  jetpack.write('emotes.json', emotelist)
  msg.reply(`Emote ${name} has been deleted :(.`)
}
