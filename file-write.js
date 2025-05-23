const applySchema = require('./lib/schema');

module.exports = function(RED) {

  const schema = {
    flowControllable: {
      type: 'boolean',
      default: true
    },
    name: {
      type: 'string',
      default: ''
    },
    filename: {
      type: 'string',
      default: ''
    },
    filenameType: {
      type: 'string',
      default: 'str'
    },
    overwrite: {
      type: 'boolean',
      default: false
    },
    autoCreateDir: {
      type: 'boolean',
      default: false
    },
    encoding: {
      type: 'string',
      default: 'none'
    }
  };

  function getFilename(msg, config) {

    // get filename based on type
    switch(config.filenameType) {
    case 'str':
      return config.filename;
    case 'msg':
      if (msg.filename) {
        return msg.filename;
      } else if (msg.payload && msg.payload.filename) {
        return msg.payload.filename;
      }
      break;
    case 'env':
      if (msg.env && msg.env[config.filename]) {
        return msg.env[config.filename];
      } else if (process.env[config.filename]) {
        return process.env[config.filename];
      }
      break;
    }

    return null;
  }

  function WrtieFileNode(config) {
    var fs = require('fs');
    var path = require('path');
    var iconv = require('iconv-lite');

    RED.nodes.createNode(this, config);
    var node = this;

    // configuration preparation
    config = applySchema(config, schema);

    // Current available streams
    var streams = {};

    node.on('input', function(msg, send, done) {

      var filename = getFilename(msg, config);
      if (!filename) {
        return done(new Error('No filename specified'));
      }

      if (filename && RED.settings.fileWorkingDirectory && !path.isAbsolute(filename)) {
        filename = path.resolve(path.join(RED.settings.fileWorkingDirectory, filename));
      }

      var dir = path.dirname(filename);
      if (!fs.existsSync(dir)) {
        if (!config.autoCreateDir) {
          return done(new Error('Directory does not exist: ' + dir));
        }

        // create directory if it does not exist
        var err = fs.mkdirSync(dir);
        if (err) {
          return done(new Error('Error creating directory: ' + err));
        }
      }

      // check if file exists
      fs.stat(filename, function(err, stats) {

        if (!err) {
          // check if file is a directory
          if (stats.isDirectory()) {
            return done(new Error('File is a directory: ' + filename));
          }
        }

        // Check if file is opened already
        let writeStream = streams[filename];

        // If file is opened and overwrite is set to true, close the stream
        if (config.overwrite && writeStream) {

          // Close existing stream
          writeStream.end();
          writeStream = null;
        }

        if (!writeStream) {

          // Open file for writing
          writeStream = fs.createWriteStream(filename, {
            encoding: 'binary',
            flags: config.overwrite ? 'w' : 'a',
            autoClose: true
          });
          streams[filename] = writeStream;

          writeStream.on('error', function(err) {
            node.error(err, msg);
            done(err);
          });
        }

        let data = msg.payload;

        // Data type conversion
        if (typeof data === "object" && !Buffer.isBuffer(data)) {
          data = JSON.stringify(data);
        } else if (typeof data === "boolean" || typeof data === "number") {
          data = data.toString();
        }

        // Newline logic
        const isLastStringPart = msg.hasOwnProperty("parts") &&
          msg.parts.type === "string" &&
          (msg.parts.count === msg.parts.index + 1);

        if (node.appendNewline && !Buffer.isBuffer(data) && !isLastStringPart) {
          data += os.EOL;
        }

        // Encoding logic
        let buf = null;
        if (config.encoding !== 'none') {
          buf = iconv.encode(data, config.encoding);
        } else {
          buf = Buffer.from(data);
        }

        // Write to file
        writeStream.write(buf, function() {
          send(msg);
          done();
        });
      });
    });

    node.on('close', function() {

      // Close all streams
      for (let filename in streams) {
        if (streams.hasOwnProperty(filename)) {
          streams[filename].end();
          delete streams[filename];
        }
      }
    });
  }

  RED.nodes.registerType('Write File', WrtieFileNode);
}
