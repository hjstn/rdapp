const keys = require('./keys');
const config = require('./config');

const fs = require('fs');
const path = require('path');

const { CommentStream } = require("snoostorm");
const Snoowrap = require("snoowrap");

const HypeMeter = require('./core/HypeMeter');
const Telegram = require('./core/Telegram');
const Storage = require('./core/Storage');

const reddit = new Snoowrap({
    userAgent: 'Rder',
    clientId: keys.reddit_id,
    clientSecret: keys.reddit_secret,
    refreshToken: keys.reddit_refresh
});

const unis = fs.readFileSync(path.join(__dirname, './unis.csv'), { encoding: 'utf8' }).split('\n').map(uni => {
    const uni_data = uni.trim().split(',');

    return { name: uni_data[0], thread: uni_data[1] };
});

class Rder {
    constructor(unis = []) {
        this.unis = unis;
        this.unis_plain = unis.map(uni => uni.name);
        this.unis_ids = unis.map(uni => uni.thread);

        this.unis_map = {};
        this.unis.forEach(uni => this.unis_map[uni.thread] = uni.name);

        this.activity = {};
        this.unis_ids.forEach(unis_id => this.activity[unis_id] = []);

        this.announced = [];
        
        this.unis_plain.forEach(uni => this.activity[uni] = []);

        this.storage = new Storage(path.join(__dirname, config.storage));

        this.hypeMeter = new HypeMeter(config.hypeMeter);
        this.telegram = new Telegram({ ...config.telegram, ...keys.telegram }, this);

        const decisionStream = new CommentStream(reddit, { subreddit: "ApplyingToCollege", pollTime: 2000 });
        decisionStream.on('item', item => {
            if (this.unis_ids.indexOf(item.link_id) < 0) return;

            const itemHype = this.hypeMeter.isHype(item.body);

            if (itemHype) {
                this.addActivity(item.link_id, item.author.name);
            }
            console.log(`[Activity][${this.humanName(item.link_id)}][${itemHype}] Comment by ${item.author.name}.`);
        });
    }

    uniNameExists(name) {
        return this.unis_plain.indexOf(name) > -1;
    }

    getUniIDFromName(name) {
        const uni = this.unis.find(uni => uni.name === name);

        if (!uni) return undefined;
        return uni.thread;
    }

    humanName(id) {
        return `${id}/${this.unis_map[id]}`;
    }

    deleteUser(user) {
        this.storage.deleteUser(user);
        this.telegram.sendMessage(user, 'Goodbye!');
    }

    updateUser(user, id) {
        const userObject = this.storage.getUser(user);
        
        const uniIndex = userObject.unis.indexOf(id);

        if (uniIndex < 0) {
            userObject.unis.push(id);
        } else {
            userObject.unis.splice(uniIndex, 1);
        }

        this.telegram.sendMessage(user, `${uniIndex !== -1 ? 'Removed' : 'Added'}! Your list: ${userObject.unis.map(uni => this.unis_map[uni]).join(', ')}`);

        this.storage.updateUser(user, userObject);
    }

    addActivity(id, author) {
        if (this.activity[id].indexOf(author) < 0) {
            this.activity[id].push(author);
            console.log(`[Activity][${this.humanName(id)}] Adding activity (${this.activity[id].length}).`);
        } else {
            console.log(`[Activity][${this.humanName(id)}] Same user, not adding activity (${this.activity[id].length}).`)
        }

        setTimeout(() => {
            const activityIndex = this.activity[id].indexOf(author);
            
            if (activityIndex > -1) {
                this.activity[id].splice(activityIndex, 1);
                console.log(`[Activity][${this.humanName(id)}] Removing activity (${this.activity[id].length}).`);
            }
        }, config.activity.timeout);

        this.checkHype(id);
    }

    checkHype(id) {
        if (this.activity[id].length < config.activity.threshold) {
            console.log(`[Activity][${this.humanName(id)}] Failed the hype check (${this.activity[id].length}).`);
        } else {
            this.announceHype(id);
        }
    }

    announceHype(id) {
        if (this.announced.indexOf(id) > -1) return;

        console.log(`[Activity][${this.humanName(id)}] Announcing hype (${this.activity[id].length}).`);

        this.storage.allUsers().forEach(userObject => {
            if (userObject.unis.indexOf(id) > -1) {
                this.telegram.sendHype(userObject.id, {
                    id,
                    name: this.unis_map[id],
                    activity: this.activity[id],
                    timeout: config.activity.timeout
                });
            }
        });

        this.announced.push(id);
        setTimeout(() => {
            const announcedIndex = this.announced.indexOf(id);

            if (announcedIndex > -1) this.announced.splice(announcedIndex, 1);
        }, 2 * config.activity.timeout);
    }
}

const rder = new Rder(unis);
