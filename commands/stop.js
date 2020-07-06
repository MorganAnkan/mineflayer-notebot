var util = require("./../util.js");

var parser = require("./../parser.js");

function execute(username, args, bot, handler) {
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

module.exports = {
    aliases: ["stop", "cancel"],
	description: "Stops the current song/tuning",
	usage: "{prefix}stop",
	enabled: true,
	execute: execute
}