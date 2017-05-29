import express from 'express';
import {TestUser, User, Comment, Moment, Friend, TemMessage} from '../connectors';

const router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.get('/addUser', function (req, res, next) {
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

router.post('/addUser', function (req, res, next) {
    TestUser.create({
        username: req.body.username,
        nickname: req.body.nickname,
        password: req.body.password,
        userImage: req.body.userImage,
        location: req.body.location
    }).then(function (user) {
        console.log('user created.' + JSON.stringify(user));
        res.send({data: 'success'});
    }).catch(function (err) {
        console.log(req.body);
        console.log('failed: ' + err);
        res.send({data: err});
    });
});

router.post('/login', (req, res, next) => {
    TestUser.findOne({
        where: {username: req.body.username},
    }).then(user => {
        if (user !== null && user.password === req.body.password) {
            res.send({data: 'success', user: JSON.stringify(user)});
        } else {
            res.send({data: 'error'});
        }
    }).catch(err => {
        console.log(req.body);
        console.log('failed: ' + err);
        res.send({data: err});
    });

});

router.get('/modifyNickname', function (req, res, next) {
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

router.put('/modifyNickname', function (req, res, next) {
    TestUser.update({
        nickname: req.body.nickname,
    }, {
        where: {
            username: {
                $eq: req.body.username
            }
        }
    }).then(function (user) {
        console.log('nickname modified.' + JSON.stringify(user));
        res.send({data: 'success', user: JSON.stringify(user)});
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send({data: err});
    });
});


router.get('/modifyUserImage', function (req, res, next) {
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

router.get('/modifyLocation', function (req, res, next) {
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

router.put('/modifyLocation', function (req, res, next) {
    TestUser.update({
        location: req.body.location,
    }, {
        where: {
            username: {
                $eq: req.body.username
            }
        }
    }).then(function (user) {
        console.log('location modified.' + JSON.stringify(user));
        res.send({data: 'success', user: JSON.stringify(user)});
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send({data: err});
    });
});


router.get('/findUser', function (req, res, next) {
    TestUser.findOne({
        where: {username: req.body.friendUsername},
    }).then(user => {
        if (user === null) {
            res.send({data: 'notExist'});
        } else {
            Friend.findOne({
                where: {
                    $or: [
                        {
                            first: req.body.myUsername,
                            second: req.body.friendUsername
                        },
                        {
                            first: req.body.friendUsername,
                            second: req.body.myUsername
                        }
                    ]
                }
            }).then(friend => {
                if (friend === null) {
                    res.send({data: 'success'});
                } else {
                    res.send({data: 'friend'});
                }
            });
        }
    }).catch(err => {
        console.log(req.body);
        console.log('failed: ' + err);
        res.send({data: err});
    });
});

module.exports = router;
