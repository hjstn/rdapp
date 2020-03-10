const low = require('lowdb');
const lodashId = require('lodash-id');
const FileSync = require('lowdb/adapters/FileSync');

class Storage {
    constructor(dbFile) {
        this.adapter = new FileSync(dbFile);
        this.db = low(this.adapter);

        this.db._.mixin(lodashId);

        this.usersDB = this.db
            .defaults({ users: [] })
            .get('users');
    }

    allUsers() {
        return this.usersDB.value();
    }

    addUser(user) {
        return this.usersDB.insert({
            id: user,
            unis: []
        }).write();
    }

    getUser(user) {
        const userDocument = this.usersDB.getById(user).value();

        if (!userDocument) return this.addUser(user);
        return userDocument;
    }

    updateUser(user, object) {
        return this.usersDB.updateById(user, object).write();
    }

    deleteUser(user) {
        if (this.getUser(user)) return this.usersDB.removeById(user).write();
    }
}

module.exports = Storage;