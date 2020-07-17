var fs = require("fs");
var util = require("./util.js");
var instruments_map = require("./instruments_map.json");
var config = require("./config.json");
var indexjs = require("./index.js");
var handler = require("./command-handler.js");

var playing = false;
var tuning = false;
var interval = null;

var nowPlaying = {
  "song_name": undefined,
  "time": {
    "current": -1,
    "full": -1
  },
  "url": undefined,
  "addedBy": undefined
};

var cancelTune = false;
var cancelPlay = false;

function resetNowPlaying() {
  nowPlaying = {
    "song_name": undefined,
    "time": {
      "current": -1,
      "full": -1
    },
    "url": undefined,
    "addedBy": undefined
  };
}

function isValidFile(file) {
  if(file == null) return false;
	return fs.existsSync(file) && fs.statSync(file).isFile();
}

function parse(file) {
 if (!isValidFile(file)) {
   console.log(`File ${file} is not a valid file!`);
   return null;
 }

  let data = fs.readFileSync(file).toString();
  
  if (data == null || typeof(data) != "string")
    return null;

  data = data.split("\n").map(line => line.replace(/\r/, "")); 

  /*data = data.filter(line => {
    if (line == null) return false;
    let split = line.split(":");
    try {
    let tick = parseInt(split[0]);
    let pitch = parseInt(split[1]);
    let instrument = parseInt(split[2]);
    return tick != null && pitch != null && instrument != null;
    } catch(e) {
      return false;
    }

  });*/

  let parsed = [];
  data.forEach((line) => {
    let split = line.split(":");
    if(split[0] == null || split[1] == null || split[2] == null) return;

    let tick = parseInt(split[0]);
    let pitch = parseInt(split[1]);
    let instrument = parseInt(split[2]);

    parsed.push({tick, pitch, instrument});
  });

  return parsed;
}


function songInfo(file) {
  if (!isValidFile(file)) {
    console.log(`Error: ${file} is invalid!`);
    return null;
  }
  // lines shit
  let lines = fs.readFileSync(file)
  if (lines instanceof Buffer) lines = lines.toString();
  if (lines == null || typeof(lines) != "string") return null;

  lines = lines.split("\n").map(line => line.replace(/\r/, ""));
  
  //filter out bad lines
  lines = lines.filter(line => {
    if (line == null) return false;
    let split = line.split(":");
    let tick = split[0];
    let pitch = split[1];
    let instrument = split[2];

    return !(isNaN(tick) || pitch < 0 || pitch > 24 || instrument < 0 || instrument > 15);
  });

  if (lines.length == 0) {
    console.log(`Error: ${file} is invalid!`);
    return null;
  }

  let used_pitches = [];
  let used_instruments = [];
  let noteblocks_list = [];
  let noteblocksByInstrument = {}; 

  let songlength = 0;

  lines.forEach(line => {
    let split = line.split(":");
    if(split[0] == undefined || split[1] == undefined || split[2] == undefined) return; 
    let tick = parseInt(split[0]);
    let pitch = parseInt(split[1]);
    let instrument = parseInt(split[2]);

    if (!used_pitches.includes(pitch)) 
      used_pitches.push(pitch);

    if (!used_instruments.includes(instrument)) 
      used_instruments.push(instrument);
      
    if (noteblocks_list.filter(obj => obj.pitch == pitch && obj.instrument == instrument).length == 0) 
      noteblocks_list.push({pitch, instrument});

    if (noteblocksByInstrument[instrument] == null)
      noteblocksByInstrument[instrument] = [instrument];
    else if (!noteblocksByInstrument[instrument].includes(pitch))
      noteblocksByInstrument[instrument].push(pitch);

    if (tick > songlength)
      songlength = tick;
  });

  return {
    used_pitches,
    used_instruments,
    noteblocks_list,
    noteblocksByInstrument,
    minimunNoteblocks: used_pitches.length,
    songlength
  };
}

function tuneNoteblocks(file, noteblocks_1, instruments_enabled = false, callback = null) {
  tuning = true;
  if(callback == null) callback = function(res, err) {if(res){console.log(res)} if(err){console.log(err)} };

  if (!isValidFile(file)) {
    if(file.toString().startsWith("http")) {
      callback(undefined, `${file} appears to be a invalid notebot file, try ${handler.prefix}playurl`); //Tells the user to use the playurl command if it starts with "http"
    }
		callback(undefined, `The file ${file} could not be found!`);
    tuning = false;
    resetNowPlaying();
		return;
  }

  var noteblocks = util.clone(noteblocks_1);
  var info = songInfo(file);
  if(info == null) {
    callback(undefined, `Failed to get songinfo for ${file}`);
    tuning = false;
    resetNowPlaying();
    return;
  }

  if (noteblocks.length < info.minimunNoteblocks) {
    callback(undefined, `${file} needs atleast ${info.minimunNoteblocks} noteblocks, ${info.minimunNoteblocks - noteblocks.length} are missing`);
    tuning = false;
    resetNowPlaying();
		return;
  }

  var pitches = info.used_pitches;
  var tuned = [];
  var untuned = [];
  var tuneLater = [];
  var nbByInst = info.noteblocksByInstrument;

  if(!instruments_enabled) {
    noteblocks.forEach((noteblock) => {
      if (pitches.includes(noteblock.pitch) && !tuned.includes(noteblock)) {
        tuned.push(noteblock);
        util.remove(noteblocks, noteblock);

      }
      if(pitches.length == 0) {
        tuning = false;
        callback("Done tuning!", undefined);
        return;
      } 
    });
  } else {
    noteblocks.forEach((noteblock) => {
      if (nbByInst[noteblock.instrumentid] == null) return;

      if(nbByInst[noteblock.instrumentid].includes(noteblock.pitch)) {
        tuned.push(noteblock);
        var idx = nbByInst[noteblock.instrumentid].indexOf(noteblock.pitch);
        nbByInst[noteblock.instrumentid].splice(idx, 1);
      } else {
        untuned.push(noteblock);
      }
    });

    untuned.forEach((noteblock) => {
      if (nbByInst[noteblock.instrumentid].length > 0 && !tuned.includes(noteblock)) {
        let pitch = nbByInst[noteblock.instrumentid].shift();
        tuneLater.push({noteblock, pitch});
      }
    })

    var missing_instruments = Object.keys(nbByInst).map(key => nbByInst[key]).filter(instrument => instrument.length > 0);

    if (missing_instruments.length > 0) {
      let missing = {}; 
      Object.keys(nbByInst).forEach(key => {
        if (nbByInst[key].length > 0)
          missing[key] = nbByInst[key].length;
      });

      let message = Object.keys(missing).map(key => {
        return `&r${instruments_map.lowercase[key]}/&7${instruments_map.blocks[key]} &r(&c${missing[key]}&r)`; 
      }).join(", ");

      console.log(`Missing Instruments: ${message}`);
      callback(undefined, `Missing Instruments: ${util.colors(message)}`);

      instruments_enabled = false;
    }
  }

  function next() {
    if (instruments_enabled) {
      if(tuneLater[0] == null) {
        tuning = false;
        cancelTune = false;
        callback("Done tuning!", undefined);
        return;
      }
      if (tuneLater[0].noteblock != null)
      tuneNoteblock(tuneLater[0].noteblock, tuneLater[0].pitch, (success) => {
        tuned.push(tuneLater[0].noteblock);
        tuneLater.shift();  
        if(cancelTune) {
          callback(undefined, undefined);
          cancelTune = false;
          tuning = false;
          resetNowPlaying();
          return;
        }    
        if (tuneLater.length > 0) {
          next();
        } else {
          tuning = false;
          cancelTune = false;
          callback("Done tuning!", undefined);
				}
      });
    } else {
      if(noteblocks[0] == null || pitches[0] == null) return;
    
      tuneNoteblock(noteblocks[0], pitches[0], (success) => {
        tuned.push(noteblocks[0]);
        pitches.shift();
        noteblocks.shift();
        if(cancelTune) {
          callback(undefined, undefined);
          cancelTune = false;
          tuning = false;
          resetNowPlaying();
          return;
        }  
        if(pitches.length > 0) {
          next();
        } else {
          tuning = false;
          cancelTune = false;
          callback("Done tuning!", undefined);
				}
      });
    }
  }
	next();

}

function tuneNoteblock(block, pitch, callback) {
  if(block == null) {
    callback(false);
    return;
  }
	if(block.pitch == pitch) {
		callback(true);
		return;
	}

  let play_times = 0;
  if (pitch - block.pitch < 0)
    play_times = 25-(block.pitch-pitch);
  else
    play_times = pitch-block.pitch;
  var timeouts = []
  for (i = 0; i < play_times; i++) {
    if(cancelTune) {
      for(i = 0; i < timeouts.length; i++) {
        clearTimeout(timeouts[i]);
      }
      callback(false);
      cancelTune = false;
      tuning = false;
      resetNowPlaying();
      return;
    }  
    timeouts[i] = setTimeout(() => {
      indexjs.getBot()._client.write('block_place', {
        location: block.position,
        direction: 1,
        hand: 0,
        cursorX: 0.5,
        cursorY: 0.5,
        cursorZ: 0.5
      });    
    }, config.settings.tune_speed*i);

		if(i == play_times-1) {
			setTimeout(() => {
				callback(true);
			}, config.settings.tune_speed*i);
		}
    
  } 

  block.pitch = pitch;

}

function timeConverter(duration) {
  duration = duration * 50;//1 tick = 50ms
  let milliseconds = parseInt((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  return {
    h: hours,
    min: minutes,
    sec: seconds,
    ms: milliseconds
  }
}

function play(bot, noteblocks, file) {
  if (playing == true || tuning == true)
    return false;
	if (!isValidFile(file)) 
		return false;
	playing = true;

  var parsed = parse(file);
  var info = songInfo(file);
  let tick = 0;

  if(info !== null) {
    nowPlaying.time.full = info.songlength;
  }

	interval = setInterval(function() {
    if (interval != this) {
      clearInterval(this);
			return;
    }
    if (Object.keys(parsed).length <= 1) {
      bot.chat(util.infoMessage(`Finished playing`));
      clearInterval(this);
      interval = null;
      playing = false;
      cancelPlay = false;
      resetNowPlaying();
			return;
    }

    parsed.forEach((note, i, arr) => {
      if(cancelPlay) {
        clearInterval(this);
        cancelPlay = false;
        playing = false;
        resetNowPlaying();
        return;
      }
      
      var foundBlock = null;

      if (tick >= note.tick) {
        noteblocks.forEach(noteblock => {
          if (noteblock.pitch == note.pitch && noteblock.instrumentid == note.instrument) {
            foundBlock = noteblock;
          }
        });
        arr.splice(i, 1);
        if(foundBlock == null) {
          console.log("not found:", note);
        } else {
          playNoteblock(bot, foundBlock);
        }
      }

    });

    tick++;
    nowPlaying.time.current = tick;
  }, 1000/20); // every tick = 50ms

}

function playNoteblock(bot, noteblock) {
  bot._client.write('block_dig', {
    status: 0,
    location: noteblock.position,
    face: 1
  });
  bot._client.write('block_dig', {
    status: 1,
    location: noteblock.position,
    face: 1
  });
}

module.exports.timeConverter = timeConverter;
module.exports.tuneNoteblocks = tuneNoteblocks;
module.exports.tuneNoteblock = tuneNoteblock;
module.exports.parse = parse;
module.exports.play = play;
module.exports.songInfo = songInfo;
module.exports.isValidFile = isValidFile;

module.exports.getNowPlaying = () => {return nowPlaying};
module.exports.editNowPlaying = (song_name, current, full, url, addedBy) => {
  song_name != undefined ? nowPlaying.song_name = song_name : undefined;
  current != undefined ? nowPlaying.time.current = current : undefined;
  full != undefined ? nowPlaying.time.full = full : undefined;
  url != undefined ? nowPlaying.url = url : undefined;
  addedBy != undefined ? nowPlaying.addedBy = addedBy : undefined;
};

module.exports.isTuning = () => {return tuning};
module.exports.isPlaying = () => {return playing};
module.exports.setcancelTune = (b) => {cancelTune = b};
module.exports.setcancelPlay = (b) => {cancelPlay = b};