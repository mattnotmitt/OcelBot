const Twit = require('twit'),
  moment = require('moment'),
  Discord = require('discord.js'),
  config = require('../config.json'),
  jetpack = require('fs-jetpack')

const T = new Twit({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token: config.access_token,
  access_token_secret: config.access_token_secret
})

let botStream

exports.data = {
  name: 'Twitter Watcher',
  command: 'twitWatch',
  description: 'Creates a watcher for tweets.',
  group: 'watchers',
  syntax: '!twitWatch [operation] [more-args]',
  author: 'Matt C: matt@artemisbot.pw',
  permissions: 4
}

// Handles adding and removing of followed Twitter accounts
exports.func = async (msg, args, bot) => {
  if (args[0] === 'start') {
    let name, userId
    if (!(args[1].match(/^[0-9]+$/))) {
      name = args[1]
      userId = (await T.get('users/show', {screen_name: args[1]})).data.id_str
    } else {
      userId = args[1]
      name = (await T.get('users/show', {user_id: args[1]})).data.screen_name
    }
    let config = jetpack.read('config.json', 'json')
    config.twitWatch[userId] = {name: name, channel: msg.channel.id, replies: args[2]}
    jetpack.write('config.json', config)
    msg.reply(`I am now watching ${name} in this channel.`)
    this.watcher(bot)
  }
}

// Watches the specified twitter accounts
exports.watcher = (bot) => {
  const watch = (jetpack.read('config.json', 'json')).twitWatch
  try {
    botStream.stop()
    // log("oh good")
  } catch (e) {
    // console.error(e)
  }
  botStream = T.stream('statuses/filter', {
    follow: getFollowList(watch)
  })
  botStream.on('tweet', (tweet) => {
    // log(tweet.user.id_str)
    if (tweet.user.id_str in watch && (!tweet.in_reply_to_user_id || watch[tweet.user.id_str].replies)) {
      log(`User ${tweet.user.screen_name} has just tweeted at ${tweet.created_at}.`)
      const embed = new Discord.RichEmbed({
        color: 0x00ACED,
        author: {
          name: `${tweet.user.name} - @${tweet.user.screen_name}`,
          icon_url: tweet.user.profile_image_url,
          url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
        },
        description: tweet.text,
        timestamp: (new Date(tweet.created_at)).toISOString(),
        footer: {
          text: `|`,
          icon_url: 'https://artemisbot.co.uk/i/nb7ko.png'
        }
      })
      bot.channels.get(watch[tweet.user.id_str].channel).send('', {embed: embed})
    }
  })
}
const getFollowList = (watch) => {
  let follow = []
  if (Object.keys(watch).length > 0) {
    for (let user in watch) {
      log(`Channel ${watch[user].channel} is watching user ${watch[user].name}.`)
      follow.push(user)
    }
  }
  return follow
}

const log = (msg) => {
  console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] | ${exports.data.name} | ${msg}`)
}
