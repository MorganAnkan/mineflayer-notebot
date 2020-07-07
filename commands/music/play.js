var name = "play";
var aliases = ["p"];
var description = "Play a notebot song";
var usage = "{prefix}play <song>";
var enabled = true;

var blockmapper = require("./../../block-mapper.js");
var parser = require("./../../parser.js");
var util = require("./../../util.js");

function execute(bot, cmd, username, args, handler) {
	if(args.length == 0) {
		bot.chat(util.errorMessage(`Usage: ${handler.prefix}play <song>`));
		return;
	}
	if(bot.player.gamemode != 0) {
		bot.chat(util.errorMessage("Bot is not in survival mode!"));
		return;
	}
	if(parser.isPlaying() == true) {
		bot.chat(util.errorMessage("Bot is already playing a song"));
		return;
	}
	if(parser.isTuning() == true) {
		bot.chat(util.errorMessage("Bot is tuning"));
		return;
	}

	var file = `./songs/${args[0]}`;
	if(!args[0].endsWith(".txt")) {
		file += ".txt";
	}

	if(!parser.isValidFile(file)) {
		bot.chat(util.errorMessage(`${args[0]} appears to be a invalid notebot file`));
		return;
	}

	var test = file.match(/\\/g); test == null ? 0 : test;

	if(file.match(/\//g).length > 2 || test > 0) {// so people dont try to go outside of the ./songs/ directory
		bot.chat(util.errorMessage("no dont even try with that dir"));
		return;
	}

	let noteblocks = blockmapper.mapnoteblocks(bot);
	bot.chat(util.infoMessage(`Found &b${noteblocks.length}&7 noteblocks!`));

	parser.tuneNoteblocks(file, noteblocks, true, (success, error) => {
		if(success) {
			util.wait(80).then(() => bot.chat(util.infoMessage(success)));
			util.wait(200).then(() => {
				var songName = args[0].replace(".txt", "");
				parser.editNowPlaying(songName, 0, undefined, undefined, username);
				bot.chat(util.infoMessage(`Now playing &e${songName}`));
				parser.play(bot, noteblocks, file);
			});
		} else if(error) {
			util.wait(80).then(() => bot.chat(util.errorMessage(error)));
		} else {
			console.log(`The playing of song ${file} has been cancelled manually`);
			util.wait(80).then(() => bot.chat(util.infoMessage(`The playing of song &b${file.replace("./songs/", "").replace(".txt", "")}&7 has been cancelled manually`)));
		}
	});

}

module.exports.name = name;
module.exports.aliases = aliases;
module.exports.description = description;
module.exports.usage = usage;
module.exports.enabled = enabled;
module.exports.execute = execute;