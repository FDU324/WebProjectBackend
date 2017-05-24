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

export {db, TestUser};