const path = require('path');

const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');

const CommandParts = require('telegraf-command-parts');
const LocalSession = require('telegraf-session-local');

class Telegram {
    constructor(config = {}, rder) {
        this.config = config;
        this.rder = rder;

        this.localSession = new LocalSession({
            database: path.join(__dirname,'..', 'rderbot.json')
        });

        if (!('token' in config)) throw new Error('No Telegram token provided.');

        const bot = new Telegraf(config.token);

        bot.use(this.localSession.middleware());
        bot.use(CommandParts());

        bot.command('start', ctx => {
           return ctx.reply('Select the universities you would like to follow or unfollow.', Extra.markup(m => 
                m.keyboard(rder.unis_plain.map(uni => `/uni ${uni}`)).oneTime().resize()
            ));
        });

        bot.command('quit', ctx => {
            ctx.session = null;
            ctx.reply('Goodbye!');
        });

        bot.command('uni', ctx => {
            const uniName = ctx.state.command.args;

            if (rder.unis_plain.indexOf(uniName) === -1) return ctx.reply('That university is not on the list.');

            if (!('unis' in ctx.session)) ctx.session.unis = [];

            const uniID = rder.unis.find(uni => uni.name === uniName).thread;

            const foundUni = ctx.session.unis.indexOf(uniID);

            if (foundUni !== -1) {
                ctx.session.unis.splice(foundUni, 1);
            } else {
                ctx.session.unis.push(uniID);
            }

            ctx.reply(`${foundUni !== -1 ? 'Removed' : 'Added'}! Your list: ${ctx.session.unis.map(uni => rder.unis_map[uni]).join(', ')}`);
        });

        bot.launch();

        this.bot = bot;
    }
}

module.exports = Telegram;
