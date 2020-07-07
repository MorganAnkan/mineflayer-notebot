var name = "reload";
var aliases = [];
var description = "Reload a command";
var usage = "{prefix}reload";
var enabled = true;

var util = require("./../../util.js");

var perms = require("./../../config.json").commands_perms;

function execute(bot, cmd, username, args, handler) {
  if (!perms.includes(username))
    return bot.chat(util.errorMessage("No permission to use this command."));

  let result = handler.reload(args[0]);

  if (result.status == "success")
    bot.chat(util.infoMessage(result.message));
  else
    bot.chat(util.errorMessage(result.message));
}


module.exports.name = name;
module.exports.aliases = aliases;
module.exports.description = description;
module.exports.usage = usage;
module.exports.enabled = enabled;
module.exports.execute = execute;