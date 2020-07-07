var name = "songinfo";
var aliases = ["si"];
var description = "Prints songinfo in chat";
var usage = "{prefix}songinfo <song>";
var enabled = true;

var util = require("./../../util.js");

var parser = require("./../../parser.js");
var instruments_map = require("./../../instruments_map.json");

function execute(bot, cmd, username, args, handler) {
  if (args.length == 0)
    return bot.chat(util.infoMessage(`Usage: ${handler.prefix}songinfo <song>`));

    bot.chat(util.infoMessage(`Attempting to get songinfo for song &b${args[0]}&7 please wait...`));
    let info = parser.songInfo("./songs/"+args[0]+(args[0].endsWith(".txt") ? "" : ".txt"));
    if(info == null) return;
    util.wait(120).then(() => bot.chat(util.infoMessage(`Total pitches &b${info.used_pitches.length}`)));
    util.wait(120*2).then(() => bot.chat(util.infoMessage(`Total instruments &b${info.used_instruments.length}`)));
    let instruments = [];
    Object.keys(info.noteblocksByInstrument).forEach((note) => {
        let thing = info.noteblocksByInstrument[note];
        instruments.push(`&r${instruments_map.lowercase[parseInt(note)]}&7/${instruments_map.blocks[note]}&r: &b${thing.length}`);
    })
    util.wait(120*3).then(() => bot.chat(util.infoMessage(`Instruments ${instruments.join("&7, ")}`)));
    let time = parser.timeConverter(info.songlength);
    let timeStr = `&b${time.h}&7h &b${time.min}&7min &b${time.sec}&7sec &b${time.ms}&7ms (&b${info.songlength}&7ticks)`;
    util.wait(120*4).then(() => bot.chat(util.infoMessage(`Song length ${timeStr}`)));

/*
the object returned:
{
used_pitches, ---> [1, 4, 5, 10, ...] (pitches list)
used_instruments, ---> [0, 5, 4, 2, ...] (instruments list numerical ids)
noteblocks_list, ---> [{instrument: 0, pitch: 3}, {instrument: 1, pitch: 6}, ...] (all the unique noteblocks needed)
noteblocksByInstrument, ---> {3: [1, 5, 6], 0: [0, 10, 11], ...} (all the pitches that a specific instrument use)
length ---> 1500 (length of the song in ticks)
}
*/

}

module.exports.name = name;
module.exports.aliases = aliases;
module.exports.description = description;
module.exports.usage = usage;
module.exports.enabled = enabled;
module.exports.execute = execute;