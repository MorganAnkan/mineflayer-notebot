var name = "nowplaying";
var aliases = ["np","current"];
var description = "Says info about the song that is playing";
var usage = "{prefix}nowplaying";
var enabled = true;

var parser = require("./../../parser.js");
var util = require("./../../util.js");

function execute(bot, cmd, username, args, handler) {
    if(!parser.isPlaying()) {
        bot.chat(util.infoMessage(`Bot is currently not playing anything`));
        return;
    }
    var np = parser.getNowPlaying();
    bot.chat(util.infoMessage(`Now playing &e${np.song_name}`));

    let currtime = parser.timeConverter(np.time.current);
    let fulltime = parser.timeConverter(np.time.full);

    let timeStrc = timeToStr(currtime, np.time.current);
    let timeStrf = timeToStr(fulltime, np.time.full);

    util.wait(120).then(() => {bot.chat(util.infoMessage(`Current time: ${timeStrc}`))});
    util.wait(120*2).then(() => {bot.chat(util.infoMessage(`Full time: ${timeStrf}`))});
    util.wait(120*3).then(() => {bot.chat(util.infoMessage(`Added by: &b${np.addedBy}`))});
    if(np.url != undefined) { 
        util.wait(120*4).then(() => {bot.chat(util.infoMessage(`URL: &b${np.url}`))});
    }
}

function timeToStr(time, ticks) {
    return `&b${time.h}&7h &b${time.min}&7min &b${time.sec}&7sec &b${time.ms}&7ms (&b${ticks}&7ticks)`;
}

module.exports.name = name;
module.exports.aliases = aliases;
module.exports.description = description;
module.exports.usage = usage;
module.exports.enabled = enabled;
module.exports.execute = execute;