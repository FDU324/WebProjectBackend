var express = require('express');
var router = express.Router();
import {Moment} from '../connectors';


/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.get('/addMoment', function(req, res, next) {
    Moment.create({
        userId: req.query.userId,
        type: req.query.type,
        time: req.query.time,
        location: req.query.location,
        emotion: req.query.emotion,
        group: (req.query.group==undefined) ? null : req.query.group,
        text: (req.query.text==undefined) ? null: req.query.text,
        images: (req.query.images==undefined) ? null : req.query.images
    }).then(function (user) {
        console.log('moment created.' + JSON.stringify(user));
        res.send('success');
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

module.exports = router;
