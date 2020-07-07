var name = "help";
var aliases = ["commands","cmds"];
var description = "Help for a command.";
var usage = "{prefix}help <command>";
var enabled = true;

var util = require("./../../util.js");

function execute(bot, cmd, username, args, handler) {

  if (args[0] == null) {
    let categories = handler.getCategories();

    let num = 0;
    let a = 0;
    categories.forEach((category) => {
      let category_ = handler.getCategory(category);
      if(category_ == null) return;
      if (category_.enabled) {
        let commands = Object.keys(category_.commands).map(key => category_.commands[key]).filter(cmd => cmd.enabled).map(cmd => cmd.usage.replace(/{prefix}/g, handler.prefix));
        util.wait(100*num++).then(() => { bot.chat(util.colors(`${a++ % 2 == 0 ? "&b" : "&3"}&l${util.firstLetterUppercase(category)}:&7 ${commands.join("&r, &7")}`)); });
      }
    });
  } else {
    if (handler.isCommand(args[0])) {
      let command = handler.info(args[0]);

      bot.chat(util.infoMessage(`Info for command &b${args[0]}`));

      util.wait(100).then(() => { bot.chat(util.infoMessage(`Description: &b${command.description}`)); });

      util.wait(100*2).then(() => { bot.chat(util.infoMessage(`Usage: &b${command.usage.replace(/{prefix}/g, handler.prefix)}`)); });
      
      util.wait(100*3).then(() => { bot.chat(util.infoMessage(`Aliases: &b${command.aliases.join("&7, &b")}`)); });

      util.wait(100*4).then(() => { bot.chat(util.infoMessage(`Enabled: ${(command.enabled) ? "&aEnabled" : "&cDisabled"}`)); });
    } else
      bot.chat(util.errorMessage(`${handler.prefix}${args[0]} is not a command!`));
  }
}

module.exports.name = name;
module.exports.aliases = aliases;
module.exports.description = description;
module.exports.usage = usage;
module.exports.enabled = enabled;
module.exports.execute = execute;