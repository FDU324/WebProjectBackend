var express = require('express');
var router = express.Router();
import {Moment} from '../connectors';


/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.get('/addComment', function(req, res, next) {
    Moment.create({
        momentId: req.query.momentId,
        userId: req.query.userId,
        to: (req.query.to==undefined) ? null : req.query.to,
        content: req.query.content,
        time: req.query.time
    }).then(function (user) {
        console.log('moment created.' + JSON.stringify(user));
        res.send('success');
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

module.exports = router;
