const jetpack = require('fs-jetpack')

exports.data = {
  name: 'Message Add',
  description: 'Adds a message to the bot',
  group: 'fun',
  command: 'addmsg',
  syntax: '!addmsg [name] [msg]',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 2
}

exports.func = (msg, args, bot) => {
  console.log(args)
  console.log(args.length)
  let memelist = jetpack.read('memes.json', 'json'),
    name = args[0],
    mesg = args.slice(1).join(' ')
  if (args.length === 0) return msg.reply(`You didn't include a message or a name! The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`)
  if (args.length < 2) return msg.reply(`There are not enough arguments in this command. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`)
  if (memelist[name]) return msg.reply('That emote already exists!')
  memelist[name] = mesg
  msg.reply(`Message ${name} has been added!`)
  jetpack.write('memes.json', memelist)
}
