var util = require("./../util.js");

var perms = require("./../config.json").commands_perms;

function execute(username, args, bot, handler) {
  if (!perms.includes(username))
    return bot.chat(util.errorMessage("No permission to use this command."));
  if (args.length == 0)
    return bot.chat(util.infoMessage(`Usage: ${handler.prefix}reload <command>`));

  let result = handler.reload(args[0]);

  if (result.status == "success")
    bot.chat(util.infoMessage(result.message));
  else
    bot.chat(util.errorMessage(result.message));
}

module.exports = {
  aliases: ["reload"],
	description: "Reload a command",
	usage: "{prefix}reload <command>",
	enabled: true,
	execute: execute
}