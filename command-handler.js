var fs = require("fs");
var path = require("path");

var is_initilized = false;
var commands = {};
var categories = {};

//main functions
function load(prefix = "%", directory = "./commands") {
  //setup global variable
  this.prefix = prefix;
  this.directory = directory;

  //initiliaze command handler
  let categories_ = [];
  let aliases = [];
  if (!isDirectory(directory))
    fs.mkdirSync(directory);

  if (categories["default"] == null)
    categories["default"] = { enabled: true, commands: {} };
  fs.readdirSync(directory).forEach(file => {
    let absolute_path = path.resolve(`${directory}/${file}`);

    if (isDirectory(absolute_path) && path.parse(absolute_path).name != "default") {
      categories_.push(absolute_path);
      return;
    }

    let required = loadCommand(absolute_path);
    if (required == null)
      return;

    if (commands[required.name] == null) {
      commands[required.name] = required;
      categories[required.category].commands[required.name] = required;
    }
    if (required.aliases.length != 0)
      aliases.push(required);

  });

  categories_.forEach(category => {
    if (categories[path.parse(category).name] == null)
      categories[path.parse(category).name] = { enabled: true, commands: {} };

    fs.readdirSync(category).forEach(file => {
      let absolute_path = path.resolve(`${category}/${file}`);

      let required = loadCommand(absolute_path, path.parse(category).name);
      if (required == null)
        return;

      if (commands[required.name] == null) {
        commands[required.name] = required;
        categories[required.category].commands[required.name] = required;
      }


      if (required.aliases.length != 0)
        aliases.push(required);
    });
  });

  aliases.forEach(command => {
    command.aliases.forEach(alias => {
      if (commands[alias] == null)
        commands[alias] = command;
    });
  });

  is_initilized = true;
}

function loadCommand(absolute_path, category = "default") {
  if (!isFile(absolute_path) || path.parse(absolute_path).ext != ".js")
    return;
  let file = path.parse(absolute_path).base;


  try {
    let required = require(absolute_path);
    if (!isValid(required)) {
      console.log(`Command ${file} is invalid!`)
      return;
    }
    required.path = absolute_path;
    required.category = category;

    return required;
  } catch (err) {
    console.log(`Couldnt load ${file}:\n ${err}`);
    return;
  }
}

function execute(bot, cmd, username, args, ...custom) {


  if (!is_initilized)
    return error(`The command ahndler was not initlized!`, "not_init");

  if (!isCommand(cmd))
    return error(`Invalid command ${cmd}!`, "invalid_command");

  let cmd_info = info(cmd);

  if (!cmd_info.enabled)
    return error(`Command ${cmd} is currently disabled!`);

  try {
    let output = cmd_info.execute(bot, cmd, username, args, this, ...custom);
    return success(output);
  } catch (err) {
    console.log(`Error while executing ${cmd} (args: [${args.join(", ")}])!`);
    console.log(err.stack);
    return error(`Error while executing the command!`);
  }

}

function reload(command) {
  if (!is_initilized)
    return error(`The command ahndler was not initlized!`, "not_init");

  if (command == null) {
    try {
      Object.keys(commands).forEach(key => {
        let command = commands[key];
        delete require.cache[command.path];
      });
    } catch (err) { }
    commands = {};
    categories = {};
    load();
    return success(`successfully reloaded all commands!`);
  } else {
    let cmd_info = info(command);
    if (cmd_info == null)
      return error(`${this.prefix}${command} doesnt exist or was not loaded before!`);

    try {
      let path = cmd_info.path;
      let category = cmd_info.category;
      let aliases = cmd_info.aliases;

      aliases.forEach(alias => {
        if (commands[alias] == cmd_info)
          delete commands[alias];
      });

      delete commands[cmd_info.name];
      delete categories[cmd_info.category].commands[cmd_info.name];
      delete require.cache[cmd_info.path];

      let required = loadCommand(path, category);
      if (required == null)
        return;

      if (commands[required.name] == null) {

        commands[required.name] = required;
        categories[required.category].commands[required.name] = required;
      }


      if (required.aliases.length != 0) {
        required.aliases.forEach(alias => {
          if (commands[alias] == null)
            commands[alias] = required;
        });
      }

      return success(`Successfully reloaded ${this.prefix}${command}`);
    } catch (err) {
      console.log(`Error while realoding ${command}!`);
      console.log(err.stack);
      return error(`Couldn't reload ${this.prefix}${command}`, "reload_error");
    }
  }
}


//utility functions
function isCommand(command) {
  return commands[command] != null;
}

function info(command) {
  if (!isCommand(command))
    return null;
  return commands[command];
}

function getCategory(category) {
  if (categories[category] != null && Object.keys(categories[category].commands).length == 0)
    return null;
  return categories[category];
}

function getCategories() {
  return Object.keys(categories);
}

function success(message) {
  return { status: "success", message };
}

function error(message, code = "unknown") {
  return { status: "error", message, code };
}

function isFile(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function isDirectory(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
}

function isValid(command) {
  return command != null && typeof command.execute == "function" && typeof command.name == "string" && typeof command.description == "string" && typeof command.usage == "string" && typeof command.enabled == "boolean" && Array.isArray(command.aliases);
}

//module.exports
module.exports = load;
module.exports.reload = reload;
module.exports.execute = execute;
module.exports.isCommand = isCommand;
module.exports.getCategories = getCategories;
module.exports.getCategory = getCategory;
module.exports.info = info;
module.exports.prefix = "%";
module.exports.directory = "./commands";
