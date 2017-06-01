var express = require('express');
var router = express.Router();
import {Moment} from '../connectors';


/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.post('/addMoment', function(req, res, next) {
    Moment.create({
        username: req.body.username,
        type: req.body.type,
        time: req.body.time,
        location: req.body.location,
        emotion: req.body.emotion,
        group: (req.body.group==undefined) ? null : req.body.group,
        text: (req.body.text==undefined) ? null: req.body.text,
        images: (req.body.images==undefined) ? null : req.body.images,
        likeuser: req.body.likeuser
    }).then(function (moment) {
        console.log('moment created.' + JSON.stringify(moment));
        res.send({data: 'success', moment: JSON.stringify(moment)});
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

router.post('/addLike', function(req, res, next) {
    Moment.findOne({
        where: {momentId: req.body.momentId},
    }).then(function (moment) {
        let users = moment.likeuser.substr(1,moment.likeuser.length-2).split(',');
        if (users.length === 1)
            users[0] = req.body.username;
        else
            users.push(req.body.username);
        Moment.update({
            likeuser: '['+users.join(',')+']',
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

router.post('/removeLike', function(req, res, next) {
    Moment.findOne({
        where: {momentId: req.body.momentId},
    }).then(function (moment) {
        let users = moment.likeuser.substr(1,moment.likeuser.length-2).split(',');
        for (let i=0; i<users.length; i++) {
            if (users[i] === req.body.username)
                users.splice(i,1);
        }
        Moment.update({
            likeuser: '['+users.join(',')+']',
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

module.exports = router;
