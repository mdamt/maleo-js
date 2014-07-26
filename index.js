var api = require("exo_browser");
var sax = require("sax");
var session = api.exo_session();
var fs = require("fs");

var exitSignalHandler = function(e) {
  console.error("Terminating");
  process.exit(-1);
}

var initSignals = function () {
  process.on("SIGINT", exitSignalHandler);
  process.on("SIGQUIT", exitSignalHandler);
  process.on("SIGABRT", exitSignalHandler);
  process.on("SIGHUP", exitSignalHandler);
  process.on("SIGTERM", exitSignalHandler);
}


var loadPage = function(options) {
  var url = options.url; 
  console.log(url);
  var web = api.exo_browser();
  var frame = api.exo_frame({url: url, session: session});
  web.set_title(options.name);

  web.add_page(frame, function(err) {
    if (err) console.log(err);
    web.show_page(frame, function(err) {
      if (err) console.log(err);
    });
  });
}

var fail = function(e) {
  var url = "file://" + __dirname + "/views/failed/index.html?" + JSON.stringify(e);
  loadPage({
    url: url,
    name: "Maleo"
  });
}

var load = function(url) {
  var parser = sax.createStream();
  var current;
  var appName = "";
  var src;

  parser.onopentag = function(node) {
    current = node;
    if (node.name == "CONTENT" &&
        node.attributes && 
        node.attributes.SRC) {
      src = node.attributes.SRC;
    }
  };

  parser.ontext = function(text) {
    if (current && current.name && current.name == "NAME") {
      appName += text;
    }
  };

  fs.createReadStream(url + "/config.xml")
    .pipe(parser)
    .on("end", function() {
      console.log(appName.trim());
      loadPage({
        name: appName.trim(),
        url: "file://"+ url + "/" + src
      });
    });
}

var main = function () {
  var argv = process.argv.splice(2);

  for (var i = 0; i < argv.length; i ++) {
    try {
      var stats = fs.statSync(argv[i]);
      if (stats.isDirectory()) {
        console.log(stats.isDirectory(), argv[i]);
        stats = fs.statSync(argv[i] + "/config.xml");
        load (argv[i]);
        break;
      }
    } catch(e) {
      fail(e);
      return;
    }
  }
}

main();
