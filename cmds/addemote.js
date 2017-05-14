const jetpack = require('fs-jetpack'),
  request = require('request')

exports.data = {
  name: 'Emote Add',
  description: 'Adds an emote to the bot',
  group: 'emotes',
  command: 'addemote',
  syntax: '!addemote [name] [url]',
  author: 'Matt C: matt@artemisbot.pw',
  permissions: 2
}

exports.func = (msg, args, bot) => {
  let emotelist = jetpack.read('emotes.json', 'json'),
    name = args[0],
    url = args[1],
    ext
  if (args.length === 0) return msg.reply(`You didn't include a link or a emote name! The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`)
  if (args.length !== 2) return msg.reply(`There are not enough arguments in this command. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`)
  if (emotelist[name]) return msg.reply('That emote already exists!')
  bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has added emote ${name} in #${msg.channel.name}.`)
  switch (url.split('.').slice(-1)[0]) {
    case 'png':
      ext = '.png'
      break
    case 'gif':
      ext = '.gif'
      break
    case 'jpg':
      ext = '.jpg'
      break
    default:
      return msg.reply('This link is not png, jpg or gif.')
  }
  let filename = name + ext
  var stream = request(url).on('response', function (response) {
    if (response.statusCode !== 200) {
      msg.reply(`That link is invalid - Status Code: ${response.statusCode}.`)
    } else if (!response.headers['content-type'].match(/image\/(png|gif|jpg|jpeg)/)) {
      msg.reply(`Invalid content-type: \`\`\`${response.headers['content-type']}\`\`\``)
    } else if (response.headers['content-length'] / (1024 * 1024) > 1) {
      msg.reply(`That file is too big (${Number(response.headers['content-length'] / (1024 * 1024)).toPrecision(3)} MB)!`)
    } else {
      stream.pipe(jetpack.createWriteStream(`/home/OcelBot/emotes/${filename}`)).on('finish', function () {
        emotelist[name] = {
          file: filename,
          used: 0
        }
        msg.reply(`Emote :${name}: has been added.`)
        jetpack.write('emotes.json', emotelist)
      })
    }
  }).on('error', function (err) {
    console.error(err)
    msg.channel.send('', {code: err.message})
  })
}
