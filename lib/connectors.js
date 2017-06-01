import Sequelize from 'sequelize';

const db = new Sequelize('advancedweb', 'kadoufall', '123456', {
    host: '115.28.169.114',
    dialect: 'mysql',

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
});

const TestUser = db.define('testuser', {
    id: {type: Sequelize.INTEGER, autoIncrement: true,},
    username: {type: Sequelize.STRING(20), primaryKey: true,},
    nickname: {type: Sequelize.STRING(20)},
    password: {type: Sequelize.STRING(20)},
    userImage: {type: Sequelize.STRING(100)},
    location: {type: Sequelize.STRING(20)},
    groups: {type: Sequelize.STRING(10000)},
}, {
    freezeTableName: true,
    tableName: 'testuser',
    timestamps: false,
});

const User = db.define('user', {
    id: {type: Sequelize.INTEGER, autoIncrement: true,},
    username: {type: Sequelize.STRING(20), primaryKey: true,},
    nickname: {type: Sequelize.STRING(20)},
    password: {type: Sequelize.STRING(20)},
    userImage: {type: Sequelize.STRING(100)},
    location: {type: Sequelize.STRING(20)},
    groups: {type: Sequelize.STRING(10000)},
}, {
    freezeTableName: true,
    tableName: 'user',
    timestamps: false,
});

const Moment = db.define('moment', {
    id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true,},
    username: {type: Sequelize.STRING(20)},
    type: {type: Sequelize.STRING(10)},
    time: {type: Sequelize.INTEGER},
    location: {type: Sequelize.STRING(20)},
    emotion: {type: Sequelize.STRING(45)},
    group: {type: Sequelize.STRING(20)},
    text: {type: Sequelize.STRING(200)},
    images: {type: Sequelize.STRING(45)},
    likeuser: {type: Sequelize.STRING(1000)},
}, {
    freezeTableName: true,
    tableName: 'moment',
    timestamps: false,
});

const Comment = db.define('comment', {
    id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true,},
    momentId: {type: Sequelize.INTEGER},
    username: {type: Sequelize.STRING(20)},
    to: {type: Sequelize.INTEGER},
    content: {type: Sequelize.STRING(200)},
    time: {type: Sequelize.INTEGER},
}, {
    freezeTableName: true,
    tableName: 'comment',
    timestamps: false,
});

const Friend = db.define('friend', {
    id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true,},
    first: {type: Sequelize.STRING(45)},
    second: {type: Sequelize.STRING(45)},
}, {
    freezeTableName: true,
    tableName: 'friend',
    timestamps: false,
});

const TemMessage = db.define('temmessage', {
    id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true,},
    to: {type: Sequelize.STRING(45)},
    type: {type: Sequelize.STRING(45)},
    content: {type: Sequelize.STRING(10000)},
}, {
    freezeTableName: true,
    tableName: 'temmessage',
    timestamps: false,
});

export {db, TestUser, User, Comment, Moment, Friend, TemMessage};