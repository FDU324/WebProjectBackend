import express from 'express';
import fs from 'fs';
import {Moment, Friend, User} from '../connectors';
import {returnMoment} from '../util';

const router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

// 获取time小于指定时间戳的最新动态
router.get('/getMoments', function (req, res, next) {
    let username = req.query.username;
    let requestTime = req.query.requestTime;

    Moment.findAll({
        limit: 100,
        where: {
            time: {
                $lte: requestTime,
                $gt: 0,
            }
        },
        attributes: ['id']
    }).then(moments => {
        let re = moments.map(moment => {
            return returnMoment(moment.id, username);
        });

        // console.log('here1');
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

export {router as moment};