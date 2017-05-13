/* eslint-disable */
exports.data = {
  name: 'Eval Command',
  command: 'eval',
  description: 'Sends an eval',
  group: 'system',
  author: 'Matt C: matt@artemisbot.pw',
  permissions: 4
}

exports.func = async (msg, args, bot) => {
  bot.log(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has used eval in #${msg.channel.name}.`)
  var code = args.join(" ");
  try {
    var evaled = eval(code);
    if (typeof evaled !== 'string')
      evaled = require('util').inspect(evaled);
    msg.channel.sendMessage("```xl\n" + clean(evaled) + "\n```").catch(console.error);
  } catch (err) {
    msg.channel.sendMessage("`ERROR` ```xl\n" + clean(err) + "\n```").catch(console.error);
  }
};

function clean(text) {
  if (typeof(text) === "string") {
    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
  } else {
    return text;
  }
}
