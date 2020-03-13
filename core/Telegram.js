const path = require('path');
const EventEmitter = require('events');

const Platform = require('../model/Platform');

const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');

const CommandParts = require('telegraf-command-parts');

class Telegram extends Platform {
    constructor(...args) {
        super(...args);

        if (!('token' in this.config)) throw new Error('No Telegram token provided.');

        const bot = new Telegraf(this.config.token);

        bot.use(CommandParts());

        bot.command('start', ctx => {
            this.sendUniList(ctx.from.id, 'uni', this.rder.unis_plain);
        });

        bot.command('quit', ctx => {
            this.rder.deleteUser(ctx.from.id);
        });

        bot.command('uni', ctx => {
            const name = ctx.state.command.args;

            if (!this.rder.uniNameExists(name)) return this.sendMessage(ctx.from.id, 'That university is not on the list.');

            const id = this.rder.getUniIDFromName(name);
            if (!id) return this.sendMessage(ctx.from.id, 'Could not find university ID. Contact the admin.');

            this.rder.updateUser(ctx.from.id, id);
        });
 

        bot.command('announce', ctx => {
            if (!this.isAdmin(ctx.from.id)) return;

            const name = ctx.state.command.args;

            if (name === '') return this.sendUniList(ctx.from.id, 'announce', this.rder.unis_plain);

            if (!this.rder.uniNameExists(name)) return this.sendMessage(ctx.from.id, 'That university is not on the list.');

            const id = this.rder.getUniIDFromName(name);
            if (!id) return this.sendMessage(ctx.from.id, 'Could not find university ID. Contact the admin.');

            this.sendMessage(ctx.from.id, 'Announcing.');
            console.log(`[Telegram][${ctx.from.id}] Admin announce: ${this.rder.humanName(id)}`);
            this.rder.announceHype(id);
        });

        bot.command('broadcast', ctx => {
            if (!this.isAdmin(ctx.from.id)) return;
            
            console.log(`[Telegram][${ctx.from.id}] Admin broadcast: ${ctx.state.command.args}`);
            this.rder.storage.allUsers().forEach(userObject => this.sendMessage(userObject.id, `(Admin) ${ctx.state.command.args}`));
        });

        bot.launch();

        this.bot = bot;
    }

    isAdmin(user) {
        if (this.config.admins.indexOf(user) < 0) {
            this.sendMessage(user, 'You are not an admin.');
            console.log(`[Telegram][${user}] User attempted admin command.`);

            return false;
        }

        return true;
    }

    sendHype(user, hype) {
        this.sendMessage(user,
            `${hype.name} passed the hype check. Maybe decisions are out (messages from ${hype.activity.length > 0 ? hype.activity.join(', ') : 'ADMIN'} in ${hype.timeout / 1000 / 60}mins).`,
            [ { name: 'Check', url: `https://www.reddit.com/r/ApplyingToCollege/comments/${hype.id.slice(3)}/?sort=new`} ]
        );
    }

    sendUniList(user, prefix, unis = []) {
        this._sendMessage(user, 'Select your universities.', Extra.markup(m => 
            m.keyboard(unis.map(uni => `/${prefix} ${uni}`)).oneTime().resize()
        ));
    }

    sendMessage(user, message, links = []) {
        let markup;

        if (links.length > 0) markup = Markup.inlineKeyboard(links.map(link => 
            Markup.urlButton(link.name, link.url)
        )).extra();

        this._sendMessage(user, message, markup);
    }

    _sendMessage(user, message, markup) {
        this.bot.telegram.sendMessage(user, message, markup).catch(err => {
            if (err.code === 403) {
                console.log(`[Telegram][${user}] User blocked us, deleting.`);
                this.rder.deleteUser(user);
            }
        });
    }
}

module.exports = Telegram;
