import query from './mysqlConnect';
import express from 'express';
import moment from 'moment';

let router = express.Router();

router.get('/', async function (req, res) {
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    let getEventSql = 'select * from booking.event'
    let getEvent = await query(getEventSql)
    // console.log(getEvent);
    res.render('booking', {
        today,
    });
    console.log("booking connect")
});

router.post('/beforeCreateSchedule', async function (req, res) {
    let id = req.body.id
    let calendarId = req.body.calendarId
    let title = req.body.title
    let isAllDay = req.body.isAllDay
    let start = moment(req.body.start._date).format('YYYY-MM-DD HH:mm:ss')
    let end = moment(req.body.end._date).format('YYYY-MM-DD HH:mm:ss')
    let category = req.body.category
    let state = req.body.state

    let beforeCreateScheduleSql = "INSERT INTO booking.event(`id`,`calendarId`,`title`,`isAllDay`,`start`,`end`,`category`,`state`)VALUES(?,?,?,?,?,?,?,?);"
    let newScheduleData = [id,calendarId,title,isAllDay,start,end,category,state]
    await query(beforeCreateScheduleSql,newScheduleData)
    res.send(JSON.stringify({
        '成功':'成功',
    }));
})
router.get('/beforeUpdateSchedule', async function (req, res) {
    let centerMember = 'asd'
    let sql = 'SELECT User, Host FROM mysql.user;'
    let a = await query(sql)
    console.log(a);
    res.send(JSON.stringify({
        centerMember,
    }));
})
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