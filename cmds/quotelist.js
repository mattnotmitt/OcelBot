const jetpack = require('fs-jetpack'),
  Discord = require('discord.js')

exports.data = {
  name: 'Quote List',
  description: 'Lists available quotes.',
  group: 'quotes',
  command: 'quotelist',
  syntax: '!quotelist',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 0
}

exports.func = async(msg, args, bot) => {
  let quotelist = jetpack.read('quotes.json', 'json'),
    quotes,
    dm
  bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has listed the available quotes in #${msg.channel.name}.`)
  quotes = new Discord.RichEmbed({
    title: '__Quotes in the A&S Discord Server__',
    color: 2212073
  })
  for (let quote in quotelist) {
    quotes.addField(`!${quote}:`, quotelist[quote])
  }
  dm = await msg.author.createDM()
  dm.send('', {
    embed: quotes
  }).then(() => bot.delReply(msg, 'I have DMed you with the avaliable quotes in this server.')).catch((err) => {
    bot.log(bot.error(`Could not DM user: ${err}.`))
    bot.delReply(msg, `I could not DM you, please check your settings.`)
  })
}
