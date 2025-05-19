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

    if (this.isClosed) {
      return;
    }

    this.isPaused = true;
    this.emit('pause');
  }

  resume() {

    if (this.isClosed) {
      return;
    }

    this.isPaused = false;
    this.consume();
    this.emit('resume');
  }

  consume() {

    if (this.queue.length === 0) {
      return;
    }

    for (let i = 0; i < this.rateLimit; i++) {

      if (this.queue.length === 0) {
        break;
      }

      const data = this.queue.shift();

      this.emit('data', data);
    } 

    this.pause();

    if (this.queue.length == 0) {
      if (!this.isClosed) {
        this.emit('empty');
      }
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
    if (this.queue.length == 0) {
      this.emit('close');
    }
  }
};
