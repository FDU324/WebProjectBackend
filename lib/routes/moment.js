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
        images: (req.body.images==undefined) ? null : req.body.images
    }).then(function (moment) {
        console.log('moment created.' + JSON.stringify(moment));
        res.send('success');
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

module.exports = router;
