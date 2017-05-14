const jetpack = require('fs-jetpack')

exports.data = {
  name: 'Quotes',
  description: 'Sends a quote to the channel specified.',
  group: 'quotes',
  command: 'quote',
  author: 'Matt C: matt@artemisbot.pw'
}

exports.func = (msg, quote, bot) => {
  let quotelist = jetpack.read('quotes.json', 'json')
  if (quotelist[quote] && msg.channel.id === '275327051492229120') {
    bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has used quote ${quote} in #${msg.channel.name}.`)
    msg.channel.send(quotelist[quote])
  }
}
