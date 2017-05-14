const jetpack = require('fs-jetpack')

exports.data = {
  name: 'Quote Add',
  description: 'Adds a quote to the bot',
  group: 'fun',
  command: 'addquote',
  syntax: '!addquote [name] [quote]',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 2
}

exports.func = (msg, args, bot) => {
  let quotelist = jetpack.read('quotes.json', 'json'),
    name = args[0],
    mesg = args.slice(1).join(' ')
  if (args.length === 0) return msg.reply(`You didn't include a quote or a name! The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`)
  if (args.length < 2) return msg.reply(`There are not enough arguments in this command. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`)
  if (quotelist[name]) return msg.reply('That quote already exists!')
  bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has added the quote ${name} in #${msg.channel.name}.`)
  quotelist[name] = mesg
  msg.reply(`Quote ${name} has been added!`)
  jetpack.write('quotes.json', quotelist)
}
