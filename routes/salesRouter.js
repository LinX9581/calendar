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

router.post('/renderSchedule', async function (req, res) {
    let beforeCreateScheduleSql = "select * from booking.event"
    let allSchedule = await query(beforeCreateScheduleSql)
    res.send(JSON.stringify({
        'schedule': allSchedule,
        'render schedule': 'succeed',
    }));
})
router.post('/renderCalendar', async function (req, res) {
    let beforeCreateCalendarSql = "select * from booking.calendar_list"
    let allCalendar = await query(beforeCreateCalendarSql)
    console.log(allCalendar);
    res.send(JSON.stringify({
        'calendar': allCalendar,
        'render Calendar': 'succeed',
    }));
})
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
    let newScheduleData = [id, calendarId, title, isAllDay, start, end, category, state]
    await query(beforeCreateScheduleSql, newScheduleData)
    res.send(JSON.stringify({
        '成功': '成功',
    }));
})
router.post('/beforeDeleteSchedule', async function (req, res) {
    let deleteId = req.body.deleteId

    let beforeDeleteScheduleSql = "delete from booking.event where id = ?"
    let deleteScheduleData = [deleteId]
    await query(beforeDeleteScheduleSql, deleteScheduleData)
    res.send(JSON.stringify({
        '成功': '成功',
    }));
})
router.post('/beforeUpdateSchedule', async function (req, res) {
    let updateId = req.body.updateId
    let updateTitle = req.body.updateTitle
    let updateLocation = req.body.updateLocation
    let updateStart = req.body.updateStart
    let updateEnd = req.body.updateEnd
    let beforeUpdateScheduleSql = "UPDATE booking.event SET title = ?, location = ?, start = ?, end = ? WHERE id = ?"
    let updateScheduleData = [updateTitle, updateLocation, updateStart, updateEnd, updateId]
    let updateResult = await query(beforeUpdateScheduleSql, updateScheduleData)
    console.log(updateResult);
    res.send(JSON.stringify({
        '成功': '成功',
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