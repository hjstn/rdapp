const keys = require('./keys');
const config = require('./config');

const fs = require('fs');
const path = require('path');

const { CommentStream } = require("snoostorm");
const Snoowrap = require("snoowrap");

const Markup = require('telegraf/markup');

const HypeMeter = require('./core/HypeMeter');
const Telegram = require('./core/Telegram');

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

class RDER {
    constructor(unis = []) {
        this.unis = unis;
        this.unis_plain = unis.map(uni => uni.name);
        this.unis_threads = unis.map(uni => uni.thread);

        this.unis_map = {};
        this.unis.forEach(uni => this.unis_map[uni.thread] = uni.name);

        this.activity = {};
        this.announced = [];
        
        this.unis_plain.forEach(uni => this.activity[uni] = []);

        this.hypeMeter = new HypeMeter(config.hypeMeter);
        this.telegram = new Telegram({ token: keys.telegram }, this);

        const decisionStream = new CommentStream(reddit, { subreddit: "ApplyingToCollege", pollTime: 2000 });
        decisionStream.on('item', item => {
            if (this.unis_threads.indexOf(item.link_id) === -1) return;

            const itemHype = this.hypeMeter.isHype(item.body);

            if (itemHype) {
                this.addActivity(item.link_id);
            }
            console.log(`[Activity][${this.humanName(item.link_id)}][${itemHype}] Comment by ${item.author.name}.`);
        });
    }

    humanName(id) {
        return `${id}/${this.unis_map[id]}`;
    }

    addActivity(id) {
        if (!(id in this.activity) || this.activity[id] < 0) this.activity[id] = 0;

        this.activity[id]++;
        console.log(`[Activity][${this.humanName(id)}] Adding activity (${this.activity[id]}).`);

        setTimeout(() => {
            this.activity[id]--;
            console.log(`[Activity][${this.humanName(id)}] Removing activity (${this.activity[id]}).`);
        }, config.activity.timeout);

        this.checkHype(id);
    }

    checkHype(id) {
        if (this.activity[id] < config.activity.threshold) {
            console.log(`[Activity][${this.humanName(id)}] Failed the hype check (${this.activity[id]}).`);
        } else {
            this.announceHype(id);
        }
    }

    announceHype(id) {
        if (this.announced.indexOf(id) !== -1) return;

        console.log(`[Activity][${this.humanName(id)}] Announcing hype (${this.activity[id]}).`);

        this.telegram.localSession.DB.get('sessions').value().forEach(session => {
            const uniName = this.unis_map[id];
            if (session.data.unis.indexOf(uniName) !== -1) {
                this.telegram.bot.telegram.sendMessage(session.id.split(':')[0],
                `${uniName} passed the hype check. Maybe decisions are out (${this.activity[id]} in ${config.activity.timeout}ms).`,
                Markup.inlineKeyboard([
                    Markup.urlButton('Check', `https://www.reddit.com/r/ApplyingToCollege/comments/${id.slice(3)}/`)
                ]).extra());
            }
        });

        this.announced.push(id);
        setTimeout(() => {
            const announcedIndex = this.announced.indexOf(id);

            if (announcedIndex !== -1) this.announced.splice(announcedIndex, 1);
        }, 2 * config.activity.timeout);
    }
}

const rder = new RDER(unis);
