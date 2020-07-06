var name = "instrument";
var aliases = ["instrumentinfo","instinfo","instinf"];
var description = "Instrument info";
var usage = "{prefix}instrument <instrumentid/string>";
var enabled = true;

var util = require("./../util.js");
var instruments_map = require("./../instruments_map.json");
var parser = require("./../parser.js");

function execute(bot, cmd, username, args, handler) {// TODO: maybe blocks too but would need a better instrument map for blocks
    if(args.length == 0) return bot.chat(util.errorMessage(`Usage: ${handler.prefix}instrument <instrumentid/string>`));
    var joined = args.join("_").toLowerCase();
    if(isNumber(args[0])) {
        var instToFind = parseInt(args[0]);
        if(instToFind > Object.keys(instruments_map.lowercase).length-1) {
            return bot.chat(util.errorMessage(`Cant find any info for instrument ${instToFind}`));
        }
        bot.chat(util.infoMessage(`Info for instrument &b${instToFind}`));
        util.wait(80).then(() => bot.chat(util.infoMessage(`As integer &b${instToFind}`)));
        util.wait(80*2).then(() => bot.chat(util.infoMessage(`Block &b${instruments_map.blocks[instToFind]}`)));
        util.wait(80*3).then(() => bot.chat(util.infoMessage(`Instrument name &b${instruments_map.lowercase[instToFind]}`)));
    } else if(Object.keys(instruments_map.reverse_lowercase).includes(joined)) {
        bot.chat(util.infoMessage(`Info for instrument &b${joined}`));
        util.wait(80).then(() => bot.chat(util.infoMessage(`As integer &b${instruments_map.reverse_lowercase[joined]}`)));
        util.wait(80*2).then(() => bot.chat(util.infoMessage(`Block &b${instruments_map.blocks[instruments_map.reverse_lowercase[joined]]}`)));
        util.wait(80*3).then(() => bot.chat(util.infoMessage(`Instrument name &b${joined}`)));
    } else return bot.chat(util.errorMessage(`Cant find any info for instrument ${joined}`));
}

function isNumber(str) {
    if(typeof str == "number") return true;
    try {
        return !isNaN(parseInt(str));
    } catch(notNumber) {
        return false;
    }
}

module.exports.name = name;
module.exports.aliases = aliases;
module.exports.description = description;
module.exports.usage = usage;
module.exports.enabled = enabled;
module.exports.execute = execute;