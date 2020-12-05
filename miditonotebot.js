var { Midi } = require("@tonejs/midi");
var { isValidFile } = require("./parser.js");

var fs = require("fs");

var compiledTracks = [];
var timeConstant = (5 / 3) * 12;// 20
var midi;

const instrumentOffsets = [
    54, //harp
    0, //basedrum
    0, //snare
    0, //hat
    30, //bass
    66, //flute
    78, //bell
    42, //guitar
    78, //chime
    78, //xylophone
    54, //iron xylophone
    66, //cow bell
    30, //didgeridoo
    54, //bit
    54, //banjo
    54, //electric piano
];

/*
Note structure:
{
    midi: 70,
    velocity: 0.7559055118110236,
    noteOffVelocity: 0,
    ticks: 82016,
    durationTicks: 480
  }
*/
function fixFileName(f) {
    if (f.includes("/")) {
        var len = f.split("/").length;
        f = f.split("/")[len - 1];
    }
    return f.replace(".midi", "").replace(".mid", "");
}

function toNotebot(midiFile, cb) {
    if (!isValidFile(midiFile) || midiFile.indexOf(".mid") == -1) {
        throw new Error(`${midiFile} is a invalid file!`);
    }
    var midiFileName = fixFileName(midiFile);//for output later
    var midiData = fs.readFileSync(midiFile);
    try {
        midi = new Midi(midiData);
    } catch(e) {
        cb(undefined, e);
        return;
    }
    console.log(`Converting Midi file ${midi.name == "" ? midiFile : midi.name} to notebot format`);

    compileMIDI(midi);
    var lines = [];
    for (var i = 0; i < compiledTracks.length; i++) {
        for (var j = 0; j < compiledTracks[i].length; j++) {
            lines.push(compiledTracks[i][j]);
        }
    }

    var finalString = "";
    for (var i = 0; i < lines.length; i++) {
        finalString += lines[i] + (i === lines.length - 1 ? "" : "\n");

    }
    var songout = "./songs/" + midiFileName + ".txt";
    fs.writeFileSync(songout, finalString);
    console.log("Done! wrote song to ./songs/" + midiFileName + ".txt");
    fs.unlink(midiFile, () => {});
    midi = undefined;
    compiledTracks = undefined;
    finalString = "";
    cb(songout);
}
module.exports.toNotebot = toNotebot;

function isPercussion(channel) {
    return channel == 9; //channel 10 reserved for percussion
}

function compileMIDI(midi) {

    compiledTracks = [];

    for (var i = 0; i < midi.tracks.length; i++) {
        compiledTracks[i] = [];
    }

    for (var i = 0; i < midi.tracks.length; i++) {
        if (midi.tracks[i].notes.length == 0) {// no notes
            console.log(`skipping midi track ${midi.tracks[i].name} (track: ${i}) due to no notes`)
            continue;
        }

        // then loop through again to compile
        if (curInstrument !== null) {
            for (var j = 0; j < midi.tracks[i].notes.length; j++) {
                var curInstrument = getMinecraftInstrument(midi.tracks[i].instrument.number, midi.tracks[i], 0, midi.tracks[i].notes[j] == undefined ? undefined : midi.tracks[i].notes[j].midi);
                compileNoteFromTrack(i, j, curInstrument);
            }
        }

    }

}

function compileNoteFromTrack(trackNum, curNote, curInstrument) {

    if (midi.tracks[trackNum].notes[curNote] == undefined)
        return;
    // done playing this track

    var noteTime = Math.floor(midi.tracks[trackNum].notes[curNote].time * timeConstant); //convert seconds to minecraft ticks

    if (isPercussion(midi.tracks[trackNum].channel)) {
        // has to check this again for every note if this track is percussion because percussion can use different notes for different drums
        var useInstrument = getMinecraftInstrument(midi.tracks[trackNum].instrument.number, midi.tracks[trackNum], curNote);
    } else {
        var useInstrument = curInstrument;
    }

    if (useInstrument == undefined)
        return;
    compiledTracks[trackNum].push(`${noteTime}:${convertNote(midi.tracks[trackNum].notes[curNote].midi, midi.tracks[trackNum])}:${useInstrument}`);

}

function convertNote(noteVal, midiTrack) {
    if(isPercussion(midiTrack.channel)) return 0;

    if (instrumentOffsets[instrumentVal] == 0) {
        console.log("tried to tune a percussion instrument (this shouldn't happen)");
    }

    noteVal -= instrumentOffsets[instrumentVal];
    if (noteVal < 0) {
        noteVal = (noteVal + 25*10) % 25;
        console.log("note looped over on negative side (this shouldn't happen)");
    }
    if (noteVal > 24) {
        noteVal %= 25;
        console.log("note looped over on positive side (this shouldn't happen)");
    }
    return noteVal;

}

function getMinecraftInstrument(instrumentNumber, midiTrack, drumNoteNumber, midiPitch) {

    if (isPercussion(midiTrack.channel)) {
        if (midiTrack.notes.length > 0) {
            var drumId = midiTrack.notes[drumNoteNumber].midi;

            // TODO: drumid 24-34 & 82-87 
            // https://jazz-soft.net/demo/GeneralMidiPerc.html


            if (drumId == 35 || drumId == 36 || drumId == 41 || drumId == 43
                || drumId == 45 || drumId == 47 || drumId == 48 || drumId == 50
                || drumId == 58) return 1; //basedrum

            if (drumId == 37 || drumId == 38 || drumId == 40 || drumId == 49
                || drumId == 56 || drumId == 60 || drumId == 61 || drumId == 67
                || drumId == 68 || drumId == 70 || drumId == 78 || drumId == 79) return 2; //snare

            if (drumId == 39 || drumId == 42 || drumId == 44 || drumId == 46
                || drumId == 51 || drumId == 52 || drumId == 53 || drumId == 54
                || drumId == 55 || drumId == 57 || drumId == 59 || drumId == 62
                || drumId == 63 || drumId == 64 || drumId == 65 || drumId == 66
                || drumId == 69 || drumId == 71 || drumId == 72 || drumId == 73
                || drumId == 74 || drumId == 75 || drumId == 76 || drumId == 77
                || drumId == 80 || drumId == 81) return 3; //hat

            // default to basedrum if nothing found
            return 1; //basedrum
        }
    }

    //normal midi instruments https://jazz-soft.net/demo/GeneralMidi.html

    var MCInstrument = undefined;

    if (midiPitch != undefined) {//TODO: make this a bit smaller/less if statements


        /* reference:
        if (midiPitch >= 30 && midiPitch <= 54) {//low (bass, digeridoo)
            MCInstrument = 0;
        } else if (midiPitch >= 54 && midiPitch <= 78) {//medium (harp, iron xylophone, bit, banjo, pling)
            MCInstrument = 0;
        } else if (midiPitch >= 78 && midiPitch <= 102) {//high (bells, chimes, xylophone)
            MCInstrument = 0;
        } */
        if (instrumentNumber >= 0 && instrumentNumber <= 7) {// Piano

            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 4; //bass
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 0; //harp
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bells
            }

        } else if (instrumentNumber >= 8 && instrumentNumber <= 15) {// Chromatic Percussion
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 4; //bass
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 10; //iron xylophone
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 9; // xylophone
            }

        } else if (instrumentNumber >= 16 && instrumentNumber <= 23) {// Organ
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 13; //bit
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } else if (instrumentNumber >= 24 && instrumentNumber <= 31) {// Guitar
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 13; //bit
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } else if (instrumentNumber >= 32 && instrumentNumber <= 39) {// Bass
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 13; //bit
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } else if (instrumentNumber >= 40 && instrumentNumber <= 47) {// Strings
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 13; //bit
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } else if (instrumentNumber >= 48 && instrumentNumber <= 55) { // Ensemble
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 13; //bit
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } else if (instrumentNumber >= 56 && instrumentNumber <= 63) {// Brass
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 13; //bit
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } else if (instrumentNumber >= 64 && instrumentNumber <= 71) {// Reed
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 13; //bit
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } else if (instrumentNumber >= 72 && instrumentNumber <= 79) {// Pipe
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 13; //bit // maybe flute in the future
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } else if (instrumentNumber >= 80 && instrumentNumber <= 87) {// Synth Lead
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 13; //bit
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } else if (instrumentNumber >= 88 && instrumentNumber <= 95) {// Synth Pad
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 13; //bit
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } else if (instrumentNumber >= 96 && instrumentNumber <= 103) {// Synth Effects
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 13; //bit
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } else if (instrumentNumber >= 104 && instrumentNumber <= 111) {// Ethnic
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 13; //bit
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } else if (instrumentNumber >= 112 && instrumentNumber <= 119) {// Percussive
            if (midiPitch >= 30 && midiPitch <= 54) {
                MCInstrument = 12; //digeridoo
            } else if (midiPitch >= 54 && midiPitch <= 78) {
                MCInstrument = 10; //iron xylophone
            } else if (midiPitch >= 78 && midiPitch <= 102) {
                MCInstrument = 6; //bell
            }

        } /*else if (instrumentNumber >= 120 && instrumentNumber <= 127) {// Sound Effects
            if (midiPitch >= 30 && midiPitch <= 54) {//low (bass, digeridoo)
                MCInstrument = 0;
            } else if (midiPitch >= 54 && midiPitch <= 78) {//medium (harp, iron xylophone, bit, banjo, pling)
                MCInstrument = 0;
            } else if (midiPitch >= 78 && midiPitch <= 102) {//high (bells, chimes, xylophone)
                MCInstrument = 0;
            }
        }*/ // very unlikley to see in a midi file so just be harp...
    }

    // default to undefined if nothing found
    return MCInstrument;
}