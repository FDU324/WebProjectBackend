/**
 * Created by kadoufall on 2017/5/24.
 */
import express from 'express';

import {db, TestUser} from './connectors';

const app = express();

app.get('/', function (req, res) {
    res.send('Hello World!');
});

const server = app.listen(3000, function () {
    const host = server.address().address;
    const port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});

db.authenticate().then(() => {
    console.log('Connection has been established successfully.');

    TestUser.create({
        username: 'test',
        nickname: 'test',
        password: 'sdafadfs',
        userImage: JSON.stringify(['assets/icon/favicon.ico']),
        location: '北京市-北京市-东城区'
    }).then(function (user) {
        console.log('created.' + JSON.stringify(user));
    }).catch(function (err) {
        console.log('failed: ' + err);
    });

}).catch(err => {
    console.error('Unable to connect to the database:', err);
});
