
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')


var express = require('express');
var http = require('http');
var url = require('url');
var collections = require('./collections');

var app = module.exports = express.createServer();

var get = function(urlStr, callback) {
 var u = url.parse(urlStr);
 http.get({ host: u.host, port: u.port, path: u.pathname + (u.search ? u.search : ''), headers: {'Accept': '*/*', 'User-Agent': 'curl'} },
   function(res) {
     var data = '';
     res.on('data', function(chunk) {
       data += chunk;
     }).on('end', function() {
       try {
         callback(null, data);
       }
       catch (err) {
         console.log('exception during get');
         console.log(err);
         callback(err);
       }
     });
   }).on('error', function(error){
     console.log('error during get');
     console.log(error);
     callback(error);
   });
}

var ajax = function(urlStr, callback) {
  get(urlStr, function(err, data) {
    if (err)
      callback(err);
    else
      callback(err, JSON.parse(data));
  })
}

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

var manifest = {
  version: 1,
  homepage: "http://www.cyanogenmod.com/",
  donate: "https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3283920",
  roms: [
  ]
}


app.get('/', function(req, res) {
  
});

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.indexOf(str) == 0;
  };
}
if (typeof String.prototype.endsWith != 'function') {
  String.prototype.endsWith = function (str){
    return this.slice(-str.length) == str;
  };
}

var history = {};
function refresh() {
  ajax('http://jenkins.cyanogenmod.com/job/android/api/json', function(err, data) {
    setTimeout(refresh, 300000);
    if (err)
      return;
    collections.each(data.builds, function(index, build) {
      if (history[build.number])
        return;
      ajax(build.url + 'api/json', function(err, data) {
        if (err)
          return;
        var found = false;
        var entry = {
          product: 'CyanogenModJenkins',
          addons: [
              {
                  "name": "Google Apps",
                  "url": "http://goo-inside.me/gapps/gapps-ics-20120224-signed.zip" 
              } 
          ]
        };
        collections.each(data.artifacts, function(index, artifact) {
          if (artifact.displayPath.startsWith('update-') && artifact.displayPath.endsWith('.zip')) {
            entry.url = build.url + 'artifact/archive/' + artifact.displayPath;
            return;
          }
          
          if (artifact.displayPath != 'build.prop')
            return;

          found = true;

          get(build.url + 'artifact/archive/build.prop', function(err, data) {
            if (err)
              return;
            // console.log(data);
            history[build.number] = data;
            var lines = data.split('\n');
            var version;
            collections.each(lines, function(index, line) {
              var pair = line.split('=', 2);
              if (pair.length != 2)
                return;
              var key = pair[0];
              var value = pair[1];
              if (key == 'ro.modversion') {
                console.log('ro.modversion');
                console.log(value);
                entry.modversion = value;
                version = value.split('-');
                version.pop();
                version.pop();
                entry.name = 'CyanogenMod ' + version.join(' ');
                if (version[1].indexOf('.') != -1)
                  entry.incremental = version[1].replace('.', '') * 10;
                else
                  entry.incremental = version[1];
              }
              if (key == 'ro.product.device')
                entry.device = value;
              
            });
            
            if (entry.device && entry.incremental) {
              console.log(entry);
              entry.summary = 'Build: ' + version[1];
              console.log(entry);
            }
          });
        });
        if (!found) {
          history[build.number] = data;
          return;
        }
      });
    });
  });
}

refresh();


var listenPort = process.env.PORT == null ? 3000 : parseInt(process.env.PORT);
app.listen(listenPort);
console.log('Express app started on port ' + listenPort);

