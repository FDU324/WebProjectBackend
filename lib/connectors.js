import Sequelize from 'sequelize';
import faker from 'faker';
import _ from 'lodash';

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
    id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true,},
    username: {type: Sequelize.STRING(20)},
    nickname: {type: Sequelize.STRING(20)},
    password: {type: Sequelize.STRING(20)},
    userImage: {type: Sequelize.STRING(100)},
    location: {type: Sequelize.STRING(20)},
}, {
    freezeTableName: true,
    tableName: 'testuser',
    timestamps: false,
});

const User = db.define('user', {
    id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true,},
    username: {type: Sequelize.STRING(20)},
    nickname: {type: Sequelize.STRING(20)},
    password: {type: Sequelize.STRING(20)},
    userImage: {type: Sequelize.STRING(100)},
    location: {type: Sequelize.STRING(20)},
}, {
    freezeTableName: true,
    tableName: 'user',
    timestamps: false,
});

const Moment = db.define('moment', {
    id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true,},
    userId: {type: Sequelize.INTEGER},
    type: {type: Sequelize.STRING(10)},
    time: {type: Sequelize.INTEGER},
    location: {type: Sequelize.STRING(20)},
    emotion: {type: Sequelize.STRING(45)},
    group: {type: Sequelize.STRING(20)},
    text: {type: Sequelize.STRING(200)},
    images: {type: Sequelize.STRING(45)},
    likenum: {type: Sequelize.INTEGER.UNSIGNED.ZEROFILL},
}, {
    freezeTableName: true,
    tableName: 'moment',
    timestamps: false,
});

const Comment = db.define('comment', {
    id: {type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true,},
    momentId: {type: Sequelize.INTEGER},
    userId: {type: Sequelize.INTEGER},
    to: {type: Sequelize.INTEGER},
    content: {type: Sequelize.STRING(200)},
    time: {type: Sequelize.INTEGER},
}, {
    freezeTableName: true,
    tableName: 'comment',
    timestamps: false,
});

export {db, TestUser, User, Comment, Moment};