# mineflayer-notebot

A minecraft bot that can play most if not all .mid files from a **direct** download link. The bot can also play songs from the wwe client notebot format.

## Installation

1. Download npm and [nodejs](https://nodejs.org/en/download/) then install both softwares.
2. Download mineflayer-notebot by clicking the the green button which says "Code" or by clicking [here](https://github.com/MorganAnkan/mineflayer-notebot/archive/master.zip).
3. Extract the .zip file you downloaded.
4. Install dependecies using this command in command prompt:

```bash
cd C:/to/the/directory/where/thedownloadedproject/is
npm install mineflayer @tonejs/midi
```

## Usage

#### *Some important commands*:
 - `%playurl <direct .mid/.midi download link>`
 - plays midi files from a url [bitmidi](https://bitmidi.com/) is a pretty popular website for midi files but it isnt limited to only bitmidi a simple example: `%playurl https://bitmidi.com/uploads/104840.mid` should start to play Astronomia / Coffin dance meme
 - `%play <premade song>`
 - plays wwe format songs the bot is based on the wwe format so it can play basically anything from wwe clients notebot (**not .nbs files**) simple example: `%play nyancat` should start to play Nyancat
 - `%songs`
 - lists all premade songs in chat
 - `%help`
 - more info about all commands


## Config

```js
{
  "bot": {
    "username": "notebot",// username of the bot (only cracked currently)
    "host": "localhost",// ip of the server the bot will connect to
    "port": 25565 // port of the server the bot will connect to
  },
  "settings": {
    "tune_speed": 80,// at which interval the bot will tune in
    "colors_enabled": false,// if the server supports "&" color codes this makes chat more pretty
    "save_downloaded_songs": false,// save downloaded songs in notebot format in ./songs/
    "max_download_bytes": 10485760// max size for the %playurl midi file in bytes
  },
  "commands_perms": [// permission for higher level commands
    "The_Cosmic_",
    "MorganAnkan"
  ],
  "eval": {
    "perms": [// permission for eval
      "The_Cosmic_",
      "MorganAnkan"
    ],
    "enabled": false// WARNING: THIS IS VERY DANGEROUS TO LEAVE TRUE EVEN WITH THE PERMISSION SYSTEM
                    // DO NOT EDIT THIS IF YOU DONT KNOW WHAT YOU ARE DOING
  }
}
```
