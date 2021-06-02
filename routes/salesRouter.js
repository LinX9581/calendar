import query from './mysqlConnect';
import express from 'express';
import moment from 'moment';

let router = express.Router();

router.get('/', async function (req, res) {
    let title = 'NOW Booking '
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    let getEventSql = 'select * from booking.event'
    let getEvent = await query(getEventSql)
    console.log(getEvent);
    res.render('booking', {
        today,
        title
    });
    console.log("booking connect")
});

router.get('/test', async function (req, res) {
    let centerMember = 'asd'
    let sql = 'SELECT User, Host FROM mysql.user;'
    let a = await query(sql)
    console.log(a);
    res.send(JSON.stringify({
        centerMember,
    }));
})
// eslint-disable-next-line no-undef
module.exports = router;