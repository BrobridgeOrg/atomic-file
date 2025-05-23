const applySchema = require('./lib/schema');
const atomicSDK = require('@brobridge/atomic-sdk');
const Reader = require('./reader');
const OutputQueue = require('./output_queue');

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
    encoding: {
      type: 'string',
      default: 'none'
    },
    bufferSize: {
      type: 'number',
      default: 64 * 1024
    },
    outputMode: {
      type: 'string',
      default: 'direct'
    },
    outputFormat: {
      type: 'string',
      default: 'single'
    },
    maxLinesOfBatch: {
      type: 'number',
      default: 1000
    },
    flowControl: {
      type: 'string',
      default: 'default'
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

  function readFile(filename, config, callback) {
    switch(config.outputMode) {
    case 'string':
        break;
    }
  }

  function ReadFileNode(config) {
    var fs = require('fs');
    var path = require('path');

    RED.nodes.createNode(this, config);
    var node = this;

    // configuration preparation
    config = applySchema(config, schema);

    // Register the node as a Atomic Component
    atomicSDK.registerAtomicComponent(node);
    atomicSDK.enableSessionManager(node);

    // Get the session manager
    let sm = node.atomic.getModule('SessionManager');

    node.on('input', function(msg, send, done) {

      var filename = getFilename(msg, config);
      if (!filename) {
        return done(new Error('No filename specified'));
      }

      if (filename && RED.settings.fileWorkingDirectory && !path.isAbsolute(filename)) {
        filename = path.resolve(path.join(RED.settings.fileWorkingDirectory, filename));
      }

      // check if file exists
      fs.stat(filename, function(err, stats) {
        if (err) {
          return done(new Error('File not found: ' + filename));
        }

        // check if file is a directory
        if (stats.isDirectory()) {
          return done(new Error('File is a directory: ' + filename));
        }

        let readStream = fs.createReadStream(filename, {
          highWaterMark: config.bufferSize,
        })
          .on('error', function(err) {
            node.error('Error reading file: ' + filename);
            done(err);
          })

        let outputType = 'string';
        let streamMode = false;
        switch(config.outputMode) {
        case 'string':
            streamMode = false;
            outputType = 'string';
            break;
        case 'line':
            streamMode = true;
            outputType = 'string';
            break;
        case 'buffer':
            streamMode = false;
            outputType = 'buffer';
            break;
        case 'bufferStream':
            streamMode = true;
            outputType = 'buffer';
            break;
        }

        // Preparing the reader for the output
        let reader = new Reader(outputType, streamMode, {
          encoding: config.encoding,
          linesOfBatch: (config.outputFormat == 'batch') ? config.maxLinesOfBatch : 0,
        });

        // Create a session for the reader
        let session = (config.flowControl == 'enable') ? sm.createSession() : null;
        if (session) {
          // Bind the session to the read stream
          session.readStream = readStream;

          // Bind to original message for complete detection
          msg.atomicSession = session.id;
        }

        let outputQueue = new OutputQueue();
        outputQueue
          .on('data', function(data) {

            // Preparing message to send
            let m = Object.assign({}, msg);

            if (session) {
              session.bindMessage(m);
            }

            m.payload = data;
            send(m);
          })
          .on('empty', function() {
            readStream.resume();
          })
          .on('pause', function() {
            readStream.pause();
          })
          .on('close', function() {
            if (session) {
              session.close();
            }
          });

        if (session) {
          session.on('resume', function() {
            outputQueue.resume();
          });

          session.on('close', function() {
            done()
          });
        }

        readStream
          .pipe(reader)
          .on('data', function(data) {
            outputQueue.push(data);
          })
          .on('end', function() {
            outputQueue.close();
          });
      });
    });

    node.on('close', function() {

      // Release all sessions
      for (let session of sm.sessions) {
        session.close();
        session.readStream.close();
      }

      atomicSDK.releaseNode(node);
    });
  }

  RED.nodes.registerType('Read File', ReadFileNode);
}
