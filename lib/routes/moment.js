import express from 'express';
import fs from 'fs';
import {Moment, Friend, User} from '../connectors';

const router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

// 获取time小于指定时间戳的最新动态
router.get('/getMoments', function (req, res, next) {
    let username = req.query.username;
    let currentTime = req.query.currentTime;
    let lastTime = req.query.lastTime;
    let isInitial = req.query.isInitial;

    Moment.findAll({
        limit: isInitial === 'true' ? 100 : 70,
        where: {
            time: {
                $lte: currentTime,
                $gt: lastTime,
            }
        }
    }).then(moments => {
        let re = moments.map(moment => {
            let reMoment = {
                id: moment.id,
                type: moment.type,
                time: moment.time,
                location: JSON.parse(moment.location),
                emotion: JSON.parse(moment.emotion),
                group: JSON.parse(moment.group),
                text: moment.text,
                images: JSON.parse(moment.images),
                likeuser: JSON.parse(moment.likeuser),
                like: false
            };

            console.log(typeof moment.likeuser);

            if (moment.username === username) {         // 自己的动态直接返回
                // 是否赞
                let love = reMoment.likeuser.some(member => {
                    return member === username;
                });
                if (love) {
                    reMoment.like = true;
                }

                // user信息
                return User.findOne({
                    where: {username: username},
                    attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location', 'groups']
                }).then(user => {
                    reMoment.user = user;

                    // group信息
                    let temGroup1 = JSON.parse(moment.group);
                    let temGroup2 = temGroup1.map(member => {
                        return User.findOne({
                            where: {username: member},
                            attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location', 'groups']
                        }).then(user => {
                            return user;
                        }).catch(error => {
                            console.log('getFriends:', error);
                        });
                    });

                    return Promise.all(temGroup2).then(data => {
                        reMoment.group = JSON.parse(JSON.stringify(data));

                        // likeuser信息
                        let temLikeuser1 = JSON.parse(moment.likeuser);
                        let temLikeuser2 = temLikeuser1.map(member => {
                            return User.findOne({
                                where: {username: member},
                                attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location']
                            }).then(user => {
                                return user;
                            }).catch(error => {
                                console.log('getFriends:', error);
                            });
                        });

                        return Promise.all(temLikeuser2).then(data => {
                            reMoment.likeuser = JSON.parse(JSON.stringify(data));
                            return Promise.resolve(reMoment);
                        });
                    });
                }).catch((err) => {
                    console.log(err);
                });
            } else {      // 其他人的动态
                // 是否是好友
                let friendUserName = moment.username;
                return Friend.findOne({
                    where: {
                        $or: [
                            {
                                first: username,
                                second: friendUserName
                            },
                            {
                                first: friendUserName,
                                second: username
                            }
                        ]
                    }
                }).then(friend => {
                    console.log(friend !== null);
                    if (friend !== null) {
                        let canSee = reMoment.group.some(member => {
                            return member === username;
                        });

                        if (moment.type === 'public' || canSee) {
                            // 自己是否已赞
                            let love = reMoment.likeuser.some(member => {
                                return member === username;
                            });
                            if (love) {
                                reMoment.like = true;
                            }

                            // 隐藏group
                            reMoment.group = [];

                            // user信息
                            return User.findOne({
                                where: {username: friendUserName},
                                attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location']
                            }).then(user => {
                                reMoment.user = user;

                                // 过滤出点赞中的相同好友
                                let temLikeuser1 = JSON.parse(moment.likeuser);
                                let filterLikeUser = temLikeuser1.filter(likeUser => {
                                    return Friend.findOne({
                                        where: {
                                            $or: [
                                                {
                                                    first: username,
                                                    second: likeUser
                                                },
                                                {
                                                    first: likeUser,
                                                    second: username
                                                }
                                            ]
                                        }
                                    }).then(friend => {
                                        if (friend !== null) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    });
                                });

                                return Promise.all(filterLikeUser).then(() => {
                                    //console.log(filterLikeUser);

                                    // likeuser信息
                                    let temLikeuser = filterLikeUser.map(member => {
                                        return User.findOne({
                                            where: {username: member},
                                            attributes: ['username', 'nickname', ['userImage', 'userimage'], 'location']
                                        }).then(user => {
                                            return user;
                                        }).catch(error => {
                                            console.log('getFriends:', error);
                                        });
                                    });

                                    return Promise.all(temLikeuser).then(data => {
                                        reMoment.likeuser = JSON.parse(JSON.stringify(data));
                                        return Promise.resolve(reMoment);
                                    });
                                });
                            }).catch((err) => {
                                console.log(err);
                            });
                        } else {
                            return Promise.resolve(-1);
                        }
                    } else {
                        return Promise.resolve(-1);
                    }
                });
            }

        });
        console.log('here1');
        return Promise.all(re).then((data) => {
            // console.log(re.length);
            // console.log(data);
            let re1 = data.filter(item => {
                return item !== -1;
            });
            // console.log(JSON.stringify(re1));
            res.send({data: JSON.stringify(re1), success: true});
        });

    }).catch(err => {
        console.log('failed: ' + err);
        res.send({data: err, success: false});
    });
});

router.post('/addMoment', function (req, res, next) {
    Moment.create({
        username: req.body.username,
        type: req.body.type,
        time: req.body.time,
        location: req.body.location,
        emotion: req.body.emotion,
        group: (req.body.group === undefined) ? null : req.body.group,
        text: (req.body.text === undefined) ? null : req.body.text,
        images: (req.body.images === undefined) ? null : req.body.images,
        likeuser: req.body.likeuser
    }).then(function (moment) {
        console.log('moment created.' + JSON.stringify(moment));
        res.send({data: 'success', moment: JSON.stringify(moment)});
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

router.post('/addLike', function (req, res, next) {
    Moment.findOne({
        where: {momentId: req.body.momentId},
    }).then(function (moment) {
        let users = moment.likeuser.substr(1, moment.likeuser.length - 2).split(',');
        if (users.length === 1)
            users[0] = req.body.username;
        else
            users.push(req.body.username);
        Moment.update({
            likeuser: '[' + users.join(',') + ']',
        }, {
            where: {momentId: req.body.momentId}
        }).then(function (changedMoment) {
            console.log('like added.' + JSON.stringify(changedMoment));
            res.send({data: 'success'});
        });
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

router.post('/removeLike', function (req, res, next) {
    Moment.findOne({
        where: {momentId: req.body.momentId},
    }).then(function (moment) {
        let users = moment.likeuser.substr(1, moment.likeuser.length - 2).split(',');
        for (let i = 0; i < users.length; i++) {
            if (users[i] === req.body.username)
                users.splice(i, 1);
        }
        Moment.update({
            likeuser: '[' + users.join(',') + ']',
        }, {
            where: {momentId: req.body.momentId}
        }).then(function (changedMoment) {
            console.log('like removed.' + JSON.stringify(changedMoment));
            res.send({data: 'success'});
        });
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

router.post('/removeLike', function (req, res, next) {
    Moment.findOne({
        where: {momentId: req.body.momentId},
    }).then(function (moment) {
        let users = moment.likeuser.substr(1, moment.likeuser.length - 2).split(',');
        for (let i = 0; i < users.length; i++) {
            if (users[i] === req.body.username)
                users.splice(i, 1);
        }
        Moment.update({
            likeuser: '[' + users.join(',') + ']',
        }, {
            where: {momentId: req.body.momentId}
        }).then(function (changedMoment) {
            console.log('like removed.' + JSON.stringify(changedMoment));
            res.send({data: 'success'});
        });
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

router.post('/sendImage', function (req, res, next) {
    console.log(req.body);
    console.log(req.body.image);
    let bitmap = new Buffer(req.body.image, 'base64');
    fs.writeFileSync('test.jpg', bitmap);
    console.log('image recevied.' + 'test.jpg');
});

module.exports = router;
