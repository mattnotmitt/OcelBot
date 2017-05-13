const jetpack = require('fs-jetpack')

exports.data = {
  name: 'Memes',
  description: 'Sends a meme/message to the channel specified.',
  group: 'fun',
  command: 'meme',
  author: 'Matt C: matt@artemisbot.pw'
}

exports.func = (msg, meme, bot) => {
  let memelist = jetpack.read('memes.json', 'json')
  if (memelist[meme] && msg.channel.id === '257151961449627648') {
    bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has used meme ${meme} in #${msg.channel.name}.`)
    msg.channel.send(memelist[meme])
  }
}
