const jetpack = require('fs-jetpack'),
  Discord = require('discord.js')

exports.data = {
  name: 'Emote List',
  description: 'Lists available emotes.',
  group: 'emotes',
  command: 'emotelist',
  syntax: '!emotelist',
  author: 'Matt: matt@artemisbot.uk',
  permissions: 0
}

exports.func = async(msg, args, bot) => {
  let emotelist = jetpack.read('emotes.json', 'json'),
    emotes,
    dm
  bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has listed the availiable emotes in #${msg.channel.name}.`)
  emotes = new Discord.RichEmbed({
    title: '__Emotes from the A&S Discord Server__',
    color: 2212073
  })
  for (let emote in emotelist) {
    emotes.addField(`:${emote}:`, `Used: ${emotelist[emote].used} time(s)`, true)
  }
  dm = await msg.author.createDM()
  dm.send('', {
    embed: emotes
  }).then(() => bot.delReply(msg, 'I have DMed you with the avaliable emotes in this server.')).catch((err) => {
    bot.log(bot.error(`Could not DM user: ${err}.`))
    msg.reply(`I could not DM you, please check your settings.`)
  })
}
