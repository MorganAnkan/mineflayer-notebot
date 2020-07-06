var util = require("./../util.js");

var parser = require("./../parser.js");
var mapper = require("./../block-mapper.js");
var instruments_map = require("./../instruments_map.json");

function execute(username, args, bot, handler) {
  var sang = `./songs/${args[0]}` + (args[0].endsWith(".txt") ? "" : ".txt");
  let info = parser.songInfo(sang);
  if (info == null) {
    bot.chat(util.errorMessage(`Failed to get songinfo for ${args[0]}`));
    return;
  }

  let noteblocks = mapper.mapnoteblocks(bot);
  if (noteblocks.length == 0) {
    bot.chat(util.errorMessage(`No noteblocks found!`));
    return;
  }

  Object.keys(info.noteblocksByInstrument).forEach(id => {
    let instruments_arr = info.noteblocksByInstrument[id];

    noteblocks.forEach(noteblock => {
      if (noteblock.instrumentid == id) {
        instruments_arr.shift();
      }
    });

  });


  let missing_instruments = Object.keys(info.noteblocksByInstrument).map(key => info.noteblocksByInstrument[key]).filter(instrument => instrument.length > 0);

  if (missing_instruments.length > 0) {
    //missing instruments

    let missing = {};
    Object.keys(info.noteblocksByInstrument).forEach(key => {
      if (info.noteblocksByInstrument[key].length > 0)
        missing[key] = info.noteblocksByInstrument[key].length;
    });

    let send = Object.keys(missing).map(key => {

      return `&r${instruments_map.lowercase[key]}/&7${instruments_map.blocks[key]} &r(&c${missing[key]}&r)`;

    }).join(", ");
    var message = [];
    Object.keys(missing_instruments).forEach(instrument => {
      console.log(missing_instruments[instrument])
      message.push(`&r${instruments_map.lowercase[instrument]}&7/${instruments_map.blocks[instrument]}&r: &b${missing_instruments[instrument]}`);
    });
    message = message.join(", ");

    bot.chat(util.infoMessage(`Missing: ${send}`));
  } else {
    //there are all the instruments
    bot.chat(util.infoMessage(`The bot has all &b${info.used_instruments.length}&7 instruments required to play the song &b${args[0]}`));
  }

}

module.exports = {
  aliases: ["check", "canplay"],
  description: "Check if a song can be played",
  usage: "{prefix}check <song>",
  enabled: true,
  execute: execute
}