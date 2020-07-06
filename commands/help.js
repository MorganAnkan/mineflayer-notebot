var fs = require("fs");
var util = require("./../util.js");

function execute(username, args, bot, handler) {
  if (args[0] != null) {
    let command = null;
    command = handler.getCommand(args[0]);

    if (command == null || !handler.isValidCommand(command))
      return bot.chat(util.errorMessage(`${handler.prefix}${args[0]} is not a command!`));
    bot.chat(util.infoMessage(`Info for command &b${args[0]}`));

		util.wait(100).then(() => { bot.chat(util.infoMessage(`Description: &b${command.description}`)); });

    util.wait(100*2).then(() => { bot.chat(util.infoMessage(`Usage: &b${command.usage.replace(/{prefix}/g, handler.prefix)}`)); });
    
    util.wait(100*3).then(() => { bot.chat(util.infoMessage(`Aliases: &b${command.aliases.join("&7, &b")}`)); });

		util.wait(100*4).then(() => { bot.chat(util.infoMessage(`Enabled: ${(command.enabled) ? "&aEnabled" : "&cDisabled"}`)); });

  } else {
    handler.getCMDS().forEach((cmd, i) => {
      util.wait(100*i).then(() => {
        bot.chat(util.infoMessage(`${cmd.usage.replace(/{prefix}/g, handler.prefix)}`));
      })
    });
  }
}

module.exports = {
  aliases: ["help", "commands", "cmds"],
	description: "Help for a command.",
	usage: "{prefix}help <command>",
	enabled: true,
	execute: execute
}