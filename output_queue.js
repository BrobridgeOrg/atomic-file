const { EventEmitter } = require('events');

module.exports = class OutputQueue extends EventEmitter {

  constructor() {
    super();
    this.isClosed = false;
    this.isPaused = false;
    this.rateLimit = 1;
    this.queue = [];
  }

  pause() {
    this.isPaused = true;
    this.emit('pause');
  }

  resume() {
    this.isPaused = false;
    this.emit('resume');
    this.consume();
  }

  consume() {
    for (let i = 0; i < this.rateLimit; i++) {

      if (this.queue.length === 0) {
        continue;
      }

      const data = this.queue.shift();

      this.emit('data', data);
    } 

    this.pause();

    if (this.queue.length == 0) {
      this.emit('empty');
    }
  }

  getLength() {
    return this.queue.length;
  }

  push(data) {
    this.queue.push(data);

    if (!this.isPaused) {
      this.consume();
    }
  }

  drain() {
    for (let data of this.queue) {
      this.emit('data', data);
    }

    this.queue = [];
  }

  close() {
    this.isClosed = true;
    this.drain();
    this.emit('close');
  }
};
