import express from 'express';
import {User, Friend} from '../connectors';

const router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

router.post('/addUser', function (req, res, next) {
    User.create({
        username: req.body.username,
        nickname: req.body.nickname,
        password: req.body.password,
        userImage: req.body.userImage,
        location: req.body.location,
        groups: req.body.groups,
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
    User.findOne({
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
    User.update({
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
    User.update({
        userImage: req.body.userImage,
    }, {
        where: {
            username: req.body.username
        }
    }).then(function (user) {
        console.log('userImage modified.' + JSON.stringify(user));
        res.send({data: 'success', userImage: JSON.stringify(user)});
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

router.put('/modifyLocation', function (req, res, next) {
    User.update({
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
                {first: req.query.username},
                {second: req.query.username}
            ]
        }
    }).then(function (friends) {
        let re = friends.map(friend => {
            return User.findOne({
                where: {username: friend.first === req.query.username ? friend.second : friend.first},
                attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location']
            }).then(user => {
                return user;
            }).catch(error => {
                console.log('getFriends:', error);
            });
        });
        Promise.all(re).then((data) => {
            console.log(JSON.stringify(data));
            res.send({data: 'success', friends: JSON.stringify(data)});
        });
    }).catch(function (err) {
        console.log(req.query);
        console.log('failed: ' + err);
        currentUsers['asd'].emit('test');
        res.send({data: err});
    });
});

router.get('/findUser', function (req, res, next) {
    User.findOne({
        where: {username: req.query.friendUsername},
    }).then(user => {
        if (user === null) {
            res.send({data: 'notExist'});
        } else {
            Friend.findOne({
                where: {
                    $or: [
                        {
                            first: req.query.myUsername,
                            second: req.query.friendUsername
                        },
                        {
                            first: req.query.friendUsername,
                            second: req.query.myUsername
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
        console.log(req.query);
        console.log('failed: ' + err);
        res.send({data: err});
    });
});

router.put('/updateGroups', function (req, res, next) {
    User.update({
        groups: req.body.groups,
    }, {
        where: {
            username: req.body.username
        }
    }).then(function (user) {
        console.log('groups modified.' + JSON.stringify(user));
        res.send({data: 'success', user: JSON.stringify(user)});
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send({data: err});
    });
});

export {router as users};
