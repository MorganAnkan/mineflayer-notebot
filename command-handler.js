var fs = require("fs");
var util = require("./util.js");

var prefix = "%";
var folder = `${__dirname}/commands/`;

var cmds = [];

function getCommand(cmdname) {
  var command = null;
  cmds.forEach((c) => {
    if (includesArrForEach(c.aliases, cmdname)) {
      command = c;
    }
  });
  return command;
};

function setup() {
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    console.log(`The folder ${folder} doesnt exist creating a new one.`);
    fs.mkdirSync(folder);
  }
  reloadCMDS();

  if (cmds.length == 0) {
    console.log("hmm no commands were found but yes");
  }

}

function reloadCMDS() {
  cmds = [];
  fs.readdirSync(folder).forEach((cfile) => {
    try {
      var command = require(`${folder}/${cfile}`);
      command.requirePath = `${folder}/${cfile}`;
      if (isValidCommand(command)) {
        cmds.push(command);
      } else {
        console.log(`invalid command file ${cfile}`);
      }
    } catch (e) {
      console.log(`Failed to load cmd ${cfile}`, e);
    }
  })
}

function execute(cmd, username, args, bot) {
  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    console.log(`The folder ${folder} doesnt exist creating a new one.`);
    fs.mkdirSync(folder);
  }

  if (cmd.match(/([^a-zA-Z]+)/) != null)
    return util.Error("Only letters a-Z are allowed in commands!", "invalid_characters");

  let command = null;

  command = getCommand(cmd);

  if (command == null) {
    return util.Error(`Command ${prefix}${cmd} doesnt exist!`, "not_found");
  }

  if (!command.enabled) {
    return util.Error(`This command is disabled`, "command_diabled");
  }

  try {
    command.execute(username, args, bot, this);
    return util.Success(`Executed succssfully!`);
  } catch (err) {
    console.log(err);
    return util.Error(`A error occured while executing: ${err.message}`, "execute_error");
  }

}

function reload(cmd) {
  var c = getCommand(cmd);
  if(c == null) return util.Error(`The command ${prefix}${cmd} doesnt exist!`);

  let path = c.requirePath;

  if (!fs.existsSync(path) || !fs.statSync(path).isFile())
    return util.Error(`The command ${prefix}${cmd} doesnt exist!`);

  try {
    delete require.cache[require.resolve(path)];
    util.remove(cmds, cmd);
    cmds.push(require(path));
    return util.Success(`Successfully reloaded &b${prefix}${cmd}`);
  } catch (err) {
    return util.Error(`Couldn't reload ${prefix}${cmd}`, "reload_error");
  }

}

function includesArrForEach(arr, str) {
  var f = false;
  arr.forEach((a) => {
    if (a == str) f = true;
  });
  return f;
}

function isValidCommand(command) {
  return command != null && typeof (command.execute) == "function" && typeof (command.description) == "string" &&
    typeof (command.usage) == "string" && typeof (command.enabled) == "boolean" && typeof (command.aliases) == "object";
}

module.exports.getCMDS = () => {return cmds};

module.exports.getCommand = getCommand;
module.exports.reloadCMDS = reloadCMDS;
module.exports.setup = setup;
module.exports.prefix = prefix;
module.exports.execute = execute;
module.exports.reload = reload;
module.exports.isValidCommand = isValidCommand;