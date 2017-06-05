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

router.post('/sendImage', function (req, res, next) {
    console.log(req.body);
    console.log(req.body.image);
    let bitmap = new Buffer(req.body.image, 'base64');
    fs.writeFileSync('test.jpg', bitmap);
    console.log('image recevied.' + 'test.jpg');
});

export {router as moment};