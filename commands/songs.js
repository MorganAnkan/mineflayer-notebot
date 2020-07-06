var name = "songs";
var aliases = ["songlist"];
var description = "Says all available songs in chat";
var usage = "{prefix}songs";
var enabled = true;

var util = require("./../util.js");

var parser = require("./../parser.js");
var fs = require("fs");

function execute(bot, cmd, username, args, handler) {
    var files = fs.readdirSync("./songs/");
    files.filter((file) => file.endsWith(".txt"));
    var i = 0;
    files.forEach((file) => {
        util.wait(100*i++).then(() => {
            bot.chat(util.infoMessage("Song: &e"+file));
        });
    });
}

module.exports.name = name;
module.exports.aliases = aliases;
module.exports.description = description;
module.exports.usage = usage;
module.exports.enabled = enabled;
module.exports.execute = execute;