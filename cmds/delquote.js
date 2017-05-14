const jetpack = require('fs-jetpack')

exports.data = {
  name: 'Delete Quote',
  description: 'Deletes the specified quote.',
  group: 'quotes',
  command: 'delquote',
  syntax: '!delquote [msg_name]',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 3
}

exports.func = (msg, args, bot) => {
  let quotelist = jetpack.read('quotes.json', 'json'),
    name = args[0]
  if (args.length !== 1) return msg.reply(`There are not enough arguments in this command. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`)
  if (!quotelist[name]) return msg.reply('The selected quote does not exist.')
  bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has deleted quote ${name} in #${msg.channel.name}.`)
  delete quotelist[name]
  jetpack.write('quotes.json', quotelist)
  msg.reply(`Quote ${name} has been deleted :(`)
}
