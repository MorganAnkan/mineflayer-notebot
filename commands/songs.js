var util = require("./../util.js");

var parser = require("./../parser.js");
var fs = require("fs");

function execute(username, args, bot, handler) {
    var files = fs.readdirSync("./songs/");
    files.filter((file) => file.endsWith(".txt"));
    var i = 0;
    files.forEach((file) => {
        util.wait(100*i++).then(() => {
            bot.chat(util.infoMessage("Song: &e"+file));
        });
    });
}

module.exports = {
    aliases: ["songs", "songlist"],
	description: "Says all available songs in chat",
	usage: "{prefix}songs",
	enabled: true,
	execute: execute
}