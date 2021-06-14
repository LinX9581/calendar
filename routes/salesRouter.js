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
    let beforeCreateCalendarSql = "select * from booking.calendar_list order by orderKey"
    let allCalendar = await query(beforeCreateCalendarSql)
    res.send(JSON.stringify({
        'calendar': allCalendar,
        'render Calendar': 'succeed',
    }));
})
router.post('/createCalendarList', async function (req, res) {
    let calendarList = req.body.calendarList;
    let calendarId = req.body.calendarId;
    let calendarName = req.body.calendarName;
    let calendarColor = req.body.calendarColor;
    let calendarBgColor = req.body.calendarBgColor;
    let calendarDragBgColor = req.body.calendarDragBgColor;
    let calendarBorderColor = req.body.calendarBorderColor;
    console.log(calendarId + ' calendar Id ');
    let calendarListSql = 'insert into booking.calendar_list (id,name,color,bgcolor,dragbgcolor,bordercolor) values (?,?,?,?,?,?)'
    let calendarListData = [calendarId, calendarName, calendarColor, calendarBgColor, calendarDragBgColor, calendarBorderColor]
    let addCalendarListResult = await query(calendarListSql, calendarListData)

    res.send(JSON.stringify({
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
    // let color = req.body.color
    // let bgColor = req.body.bgColor
    // let dragBgColor = req.body.dragBgColor
    // let borderColor = req.body.borderColor

    let beforeCreateScheduleSql = "INSERT INTO booking.event(`id`,`calendarId`,`title`,`isAllDay`,`start`,`end`,`category`,`state`)VALUES(?,?,?,?,?,?,?,?);"
    let newScheduleData = [id, calendarId, title, isAllDay, start, end, category, state]
    // let beforeCreateScheduleSql = "INSERT INTO booking.event(`id`,`calendarId`,`title`,`isAllDay`,`start`,`end`,`category`,`state`,`color`,`bgColor`,`dragBgColor`,`borderColor`)VALUES(?,?,?,?,?,?,?,?,?,?,?,?);"
    // let newScheduleData = [id, calendarId, title, isAllDay, start, end, category, state, color, bgColor, dragBgColor, borderColor]
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
    let scheduleId = req.body.scheduleId
    let updateId = req.body.updateId
    let updateTitle = req.body.updateTitle
    let updateLocation = req.body.updateLocation
    // let updateBgColor = req.body.updateBgColor
    // let updateBorderColor = req.body.updateBorderColor
    // let updateColor = req.body.updateColor
    // let updateDragBgColor = req.body.updateDragBgColor
    let updateStart = req.body.updateStart
    let updateEnd = req.body.updateEnd
    let beforeUpdateScheduleSql = "UPDATE booking.event SET calendarId = ?, title = ?, location = ?, start = ?, end = ? WHERE id = ?"
    let updateScheduleData = [updateId, updateTitle, updateLocation, updateStart, updateEnd, scheduleId]
    // let beforeUpdateScheduleSql = "UPDATE booking.event SET id = ?, title = ?, location = ?, bgColor = ?, borderColor = ?, color = ?, dragBgColor = ?, start = ?, end = ? WHERE id = ?"
    // let updateScheduleData = [updateId, updateTitle, updateLocation, updateBgColor, updateBorderColor, updateColor, updateDragBgColor, updateStart, updateEnd, scheduleId]
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