import express from 'express';
import {TestUser, User, Friend} from '../connectors';

const router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
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

router.put('/modifyNickname', function (req, res, next) {
    TestUser.update({
        nickname: req.body.nickname,
    }, {
        where: {
            username: req.body.username
        }
    }).then(function (user) {
        console.log('nickname modified.' + JSON.stringify(user));
        res.send({data: 'success', user: JSON.stringify(user)});
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send({data: err});
    });
});

router.put('/modifyUserImage', function (req, res, next) {
    TestUser.update({
        userImage: req.body.userImage,
    }, {
        where: {
            username: req.body.username
        }
    }).then(function (user) {
        console.log('userImage modified.' + JSON.stringify(user));
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
            username: req.body.username
        }
    }).then(function (user) {
        console.log('location modified.' + JSON.stringify(user));
        res.send({data: 'success', user: JSON.stringify(user)});
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send({data: err});
    });
});

router.get('/getFriends', function (req, res, next) {
    Friend.findAll({
        where: {
            $or: [
                { first: req.query.username },
                { second: req.query.username }
            ]
        }
    }).then(function (friends) {
        console.log('friends got.' + JSON.stringify(friends));
        res.send({data: JSON.stringify(friends)});
    }).catch(function (err) {
        console.log(req.query);
        console.log('failed: ' + err);
        res.send({data: err});
    });
});

router.post('/addFriend', function (req, res, next) {
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
                    //TODO: send friend request to target user
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

router.post('/confirmAddFriend', function (req, res, next) {
    Friend.create({
        first: req.body.friendUsername,
        second: req.body.myUsername
    }).then(function (friend) {
        console.log('friend created.' + JSON.stringify(friend));
        //TODO: send confirm message to requester
        res.send({data: 'success'});
    }).catch(function (err) {
        console.log(req.body);
        console.log('failed: ' + err);
        res.send({data: err});
    });
});

router.post('/declineAddFriend', function (req, res, next) {
    //TODO: send decline message to requester
});

module.exports = router;
