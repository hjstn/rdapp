const path = require('path');
const EventEmitter = require('events');

class PlatformEmitter extends EventEmitter {}

class Platform {
    constructor(config = {}, rder) {
        this.config = config;
        this.rder = rder;

        this.events = new PlatformEmitter();
    }

    sendHype() {
        throw new Error('sendHype not implemented.');
    }
}

module.exports = Platform;
