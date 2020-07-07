var name = "eval";
var aliases = [];
var description = "Evaluate nodejs code";
var usage = "{prefix}eval <code>";
var enabled = true;

var util = require("./../../util.js");

var perms = require("./../../config.json").eval.perms;
var enabled = require("./../../config.json").eval.enabled;

function execute(bot, cmd, username, args, handler) {
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

module.exports.name = name;
module.exports.aliases = aliases;
module.exports.description = description;
module.exports.usage = usage;
module.exports.enabled = enabled;
module.exports.execute = execute;