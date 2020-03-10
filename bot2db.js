const fs = require('fs');

const bot = require('./rderbot.json');

const db = {
    users: []
};

bot.sessions.forEach(session => {
    db.users.push({
        id: session.id.split(':')[0],
        unis: session.data.unis
    });
})

fs.writeFileSync('rderDB.json', JSON.stringify(db, undefined, 4));