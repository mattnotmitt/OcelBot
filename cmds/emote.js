const jetpack = require('fs-jetpack')

exports.data = {
  name: 'Emotes',
  description: 'Sends an emote to the channel specified.',
  group: 'emotes',
  command: 'emote',
  author: 'Matt C: matt@artemisbot.pw'
}

exports.func = (msg, emotes, bot) => {
  let emotelist = jetpack.read('emotes.json', 'json')
  emotes = emotes.filter((e, i, s) => i === s.indexOf(e)).slice(0, 2)
  emotes.forEach(emote => {
    let emoteData = emotelist[emote.substring(1, emote.length - 1)]
    if (emoteData) {
      bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has used emote ${emote} in #${msg.channel.name}.`)
      msg.channel.send('', {file: `./emotes/${emoteData.file}`})
      emotelist[emote.substring(1, emote.length - 1)].used++
      jetpack.write('emotes.json', emotelist)
    }
  })
}
