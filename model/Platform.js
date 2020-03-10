const path = require('path');
const EventEmitter = require('events');

class PlatformEmitter extends EventEmitter {}

class Platform {
    constructor(config = {}, rder) {
        this.config = config;
        this.rder = rder;

        this.events = new PlatformEmitter();
    }

    isAdmin(user) {
        throw new Error('isAdmin not implemented.');
    }

    sendHype() {
        throw new Error('sendHype not implemented.');
    }

    sendUniList(user, prefix, unis = []) {
        throw new Error('sendUniList not implemented.');
    }

    sendMessage(user, message, links = []) {
        throw new Error('sendMessage not implemented.');
    }
}

module.exports = Platform;
