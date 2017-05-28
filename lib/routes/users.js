var express = require('express');
var router = express.Router();
import {TestUser} from '../connectors';


/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.get('/addUser', function(req, res, next) {
    TestUser.create({
        username: req.query.username,
        nickname: req.query.nickname,
        password: req.query.password,
        userImage: req.query.userImage,
        location: req.query.location
    }).then(function (user) {
        console.log('user created.' + JSON.stringify(user));
        res.send('success');
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

router.post('/addUser', function(req, res, next) {
    TestUser.create({
        username: req.body.username,
        nickname: req.body.nickname,
        password: req.body.password,
        userImage: req.body.userImage,
        location: req.body.location
    }).then(function (user) {
        console.log('user created.' + JSON.stringify(user));
        res.send('success');
    }).catch(function (err) {
        console.log(req.body);
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

router.get('/modifyNickname', function(req, res, next) {
    TestUser.update({
        nickname: req.query.nickname,
    }, {
        where: {
            id: {
                $eq: req.query.id
            }
        }
    }).then(function (user) {
        console.log('nickname modified.' + JSON.stringify(user));
        res.send('success');
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

router.get('/modifyUserImage', function(req, res, next) {
    TestUser.update({
        userImage: req.query.userImage,
    }, {
        where: {
            id: {
                $eq: req.query.id
            }
        }
    }).then(function (user) {
        console.log('userImage modified.' + JSON.stringify(user));
        res.send('success');
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

router.get('/modifyLocation', function(req, res, next) {
    TestUser.update({
        location: req.query.location,
    }, {
        where: {
            id: {
                $eq: req.query.id
            }
        }
    }).then(function (user) {
        console.log('location modified.' + JSON.stringify(user));
        res.send('success');
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

module.exports = router;
