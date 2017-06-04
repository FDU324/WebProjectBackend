import express from 'express';
import {db} from '../connectors';

const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

db.authenticate().then(() => {
    console.log('Connection has been establish                                                                    ed successfully.');
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});

export {router as index};
