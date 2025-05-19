const fs = require('fs');
const { Transform } = require('stream');
const iconv = require("iconv-lite");

module.exports = class Reader extends Transform {

  constructor(outputType = 'string', streamMode = false, options = {}) {
    super({ objectMode: true });
    this.outputType = outputType;
    this.streamMode = streamMode;
    this.options = Object.assign({
      encoding: 'none',
      linesOfBatch: 0,
    }, options);

    this._cleanup();

    if (this.options.encoding !== 'none') {
      this._decode = (data) => {
        return iconv.decode(data, this.options.encoding);
      };
    }
  }

  _decode(data) {
    return data.toString();
  }

  _cleanup() {
    switch(this.outputType) {
      case 'string':
        this.buffer = '';
        this._transform = this._stringTransform;
        this._flush = this._stringFlush;
        break;
      case 'buffer':
        this.buffer = Buffer.from('');
        this._transform = this._bufferTransform;
        this._flush = this._bufferFlush;
        break;
      default:
        throw new Error('Invalid output type. Use "string" or "buffer".');
    }

    if (this.options.linesOfBatch > 0) {
      this.lines = [];
    }
  }

  _stringTransform(chunk, encoding, callback) {

    this.buffer += this._decode(chunk);

    if (this.streamMode) {

      let parts = this.buffer.split(/\r?\n/);

      // reserve the last part in case it is not complete
      this.buffer = parts.pop();

      for (const line of parts) {

        // push the line if we are not batching
        if (this.options.linesOfBatch <= 0) {
          this.push(line);
          continue;
        }

        this.lines.push(line);

        // Batch the lines if we have enough
        if (this.lines.length >= this.options.linesOfBatch) {
          let batch = this.lines.splice(0, this.options.linesOfBatch);
          this.push(batch);
        }
      }

      return callback();
    }

    callback();
  }

  _bufferTransform(chunk, encoding, callback) {

    if (this.streamMode) {
      this.push(chunk);
    } else {
      this.buffer = Buffer.concat([ this.buffer, chunk ]);
    }

    callback();
  }

  _stringFlush(callback) {

    if (this.options.linesOfBatch <= 0) {
      this.push(this.buffer);
    } else {
      this.push([...this.lines]);
    }

    this._cleanup();

    callback();
  }

  _bufferFlush(callback) {

    if (this.buffer.length) {
      let buffer = this.buffer;
      this.push(buffer);
    }

    this._cleanup();

    callback();
  }
}
