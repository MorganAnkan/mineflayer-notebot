var https = require("https");
var http = require("http");
var fs = require('fs');
var config = require("./config.json");

var maxDownloadBytes = config.settings.max_download_bytes; //deafults to 10mb

function download(url, dest, cb) {

  var file = null;
  var httpOrHttps = https;
  url.startsWith("https:") ? httpOrHttps = https : httpOrHttps = http;

  var request = httpOrHttps.get(url, (response) => {
    console.log("Download started! url: "+url);
    var size;
    try {
    size = parseInt(response.headers["content-length"]);
    } catch(e) {size = null;}

    if(response.headers["content-disposition"] != null && dest == undefined) {//get name from headers if it exists
      dest = "./"+response.headers["content-disposition"].toString().split("filename=")[1].replace(/\//g, "").replace(/\"/g, "").replace(/\'/g, "").replace(/\`/g, "");
    }
    if(dest == undefined || dest == "./") {
      if(url.toLowerCase().endsWith(".mid") || url.toLowerCase().endsWith(".midi")) {
        var split = url.split("/");
        dest = "./"+split[split.length - 1];
      } else {
        dest = "./song.mid";
      }
    }
    if(fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }
    file = fs.createWriteStream(dest);
    
    if (size != null) {
      if (size > maxDownloadBytes) {
        if (cb) cb(`File was too big max allowed ${formatBytes(maxDownloadBytes)} (${maxDownloadBytes}) Recieved ${formatBytes(size)} (${size}) [header]`);
        request.abort();
        fs.unlink(dest, () => { });
        return;
      }
    }

    response.on("data", (data) => {
      size = 0;
      size += data.length;

      if (size > maxDownloadBytes) {
        if (cb) cb(`File was too big max allowed ${formatBytes(maxDownloadBytes)} (${maxDownloadBytes}) Recieved ${formatBytes(size)} (${size}) [data.length]`);

        request.abort();
        fs.unlink(dest);
        return;
      }
    }).pipe(file);

    response.on("error", (err) => {
      request.abort();
      fs.unlink(dest, () => { });
      if (cb) cb(err.message);
    })

    file.on("finish", () => {
      file.close(() => {
        cb(undefined, dest);
      });
    });

  }).on("error", (err) => {
    request.abort();
    fs.unlink(dest, () => { });
    if (cb) cb(err.message);
  });
};

module.exports.download = download;

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}