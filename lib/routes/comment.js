var express = require('express');
var router = express.Router();
import {Comment} from '../connectors';


/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource');
});

router.post('/addComment', function(req, res, next) {
    Comment.create({
        momentId: req.body.momentId,
        username: req.body.username,
        to: (req.body.to==undefined) ? null : req.body.to,
        content: req.body.content,
        time: req.body.time
    }).then(function (comment) {
        console.log('moment created.' + JSON.stringify(comment));
        res.send('success');
    }).catch(function (err) {
        console.log('failed: ' + err);
        res.send('failed: ' + err);
    });
});

module.exports = router;
