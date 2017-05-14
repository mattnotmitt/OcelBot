const Discord = require('discord.js'),
  moment = require('moment'),
  jetpack = require('fs-jetpack'),
  chalk = require('chalk'),
  config = require('./config.json')

const bot = new Discord.Client()
bot.error = chalk.bold.red
bot.log = (msg) => {
  console.log(`${chalk.bold.magenta(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]`)} ${msg}`)
}

bot.load = (bot) => {
  const cmds = new Discord.Collection(),
    files = jetpack.list('./cmds/')
  files.forEach((f) => {
    const props = require(`./cmds/${f}`)
    bot.log(chalk.green(`Loading Command: ${props.data.name}.`))
    cmds.set(props.data.command || props.data.regex, props)
  })
  return cmds
}

bot.commands = bot.load(bot)
bot.commands.get('twitWatch').watcher(bot)

bot.on('ready', () => {
  bot.log(chalk.green(`Connected to Discord servers & ${bot.guilds.size} guilds.`))
})

bot.on('message', (msg) => {
  if (!(msg.channel.id === '275327051492229120' && (msg.content.startsWith(config.prefix) || msg.content.match(/:(.+?):/g))) || msg.author.id === bot.user.id) return
  let command = msg.content.split(' ')[0].slice(config.prefix.length),
    args = msg.content.split(' ').slice(1),
    emotes = msg.content.match(/:(.+?):/g),
    quotelist = jetpack.read('quotes.json', 'json'),
    cmd
  if (bot.commands.has(command) && (command !== 'emote' || command !== 'quote')) {
    cmd = bot.commands.get(command)
  } else if (quotelist[command]) {
    bot.commands.get('quote').func(msg, command, bot)
  } else if (emotes) {
    bot.commands.get('emote').func(msg, emotes, bot)
  }
  if (cmd) {
    if (bot.elevation(msg) >= cmd.data.permissions) {
      cmd.func(msg, args, bot)
    } else {
      msg.reply(':newspaper2: You don\'t have permission to use this command.')
    }
  }
})

bot.on('error', console.error)
bot.on('warn', console.warn)

process.on('unhandledRejection', (err) => {
  bot.log(chalk.red(`Uncaught Promise Error: \n${err.stack}`))
})

bot.login(config.token)

bot.reload = function (command) {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./cmds/${command}.js`)]
      const cmd = require(`./cmds/${command}.js`)
      bot.commands.delete(command)
      bot.commands.set(command, cmd)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

bot.enable = function (command) {
  return new Promise((resolve, reject) => {
    try {
      const cmd = require(`./cmds/${command}.js`)
      bot.commands.set(command, cmd)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

bot.disable = function (command) {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./cmds/${command}.js`)]
      bot.commands.delete(command)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

bot.elevation = function (msg) {
  if (msg.author.id === config.ownerID) return 4
  let modRole = msg.guild.roles.find('name', 'Moderator')
  let staffRole = msg.guild.roles.find('name', 'Zergling')
  let adminRole = msg.guild.roles.find('name', 'Puppet Master')
  if ((adminRole || staffRole || adminRole) && (msg.member.roles.has(modRole.id) || msg.member.roles.has(staffRole.id) || msg.member.roles.has(adminRole.id))) return 3
  let arcRole = msg.guild.roles.find('name', 'Archivist')
  if (arcRole && msg.member.roles.has(arcRole.id)) return 2
  return 0
}

bot.delReply = function (msg, message, duration) {
  duration = duration || 5000
  msg.reply(message).then((m) => {
    msg.delete(duration)
    m.delete(duration)
  })
}
