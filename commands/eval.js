var util = require("./../util.js");

var perms = require("./../config.json").eval.perms;
var enabled = require("./../config.json").eval.enabled;

function execute(username, args, bot, handler) {
  if (!perms.includes(username))
    return bot.chat(util.errorMessage("No permisson to use this command."));
    if(!enabled) return bot.chat(util.colors(`&a>eval is currently disabled ;/`));
  new Promise((resolve, reject) => {
    resolve(eval(args.join(" ")));
  }).then((output) => {
    util.wait(100).then(() => bot.chat(util.colors(`&a>${output}`)))
  }).catch((err) => {
    //console.log(err);
    bot.chat(util.colors(`&c>${err}`))
  });
}

module.exports = {
  aliases: ["eval"],
	description: "Evaluate nodejs code",
	usage: "{prefix}eval <code>",
	enabled: true,
	execute: execute
}