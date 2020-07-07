var name = "stop";
var aliases = ["cancel"];
var description = "Stops the current song/tuning";
var usage = "{prefix}stop";
var enabled = true;

var util = require("./../../util.js");

var parser = require("./../../parser.js");

function execute(bot, cmd, username, args, handler) {
    if(!parser.isTuning() && !parser.isPlaying()) {
        bot.chat(util.errorMessage("No song is playing..."));
    } else if(parser.isTuning()) {
        parser.setcancelTune(true);
        bot.chat(util.infoMessage("Stopped tuning!"));
    } else if(parser.isPlaying()) {
        parser.setcancelPlay(true);
        bot.chat(util.infoMessage("Stopped playing!"));
    }
}

module.exports.name = name;
module.exports.aliases = aliases;
module.exports.description = description;
module.exports.usage = usage;
module.exports.enabled = enabled;
module.exports.execute = execute;