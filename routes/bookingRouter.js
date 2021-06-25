import query from './mysqlConnect';
import express from 'express';
import moment from 'moment';

let router = express.Router();
router.get('/position', function (req, res) {
    let title = 'NOW Booking '
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    res.render('position', {
        today,
        title
    });
});

router.get('/order', function (req, res) {
    let title = 'NOW Booking '
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    res.render('order', {
        today,
        title
    });
});

router.get('/customer', function (req, res) {
    let title = 'NOW Booking '
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    res.render('customer', {
        today,
        title
    });
});

router.get('/channel', function (req, res) {
    let title = 'NOW Booking '
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    res.render('channel', {
        today,
        title
    });
});

router.get('/privilege', function (req, res) {
    let title = 'NOW Booking '
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    res.render('privilege', {
        today,
        title
    });
});

module.exports = router;