import query from './mysqlConnect';
import express from 'express';
import moment from 'moment';

let router = express.Router();
router.get('/', async function (req, res) {
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    let channel = 'www'
    req.session.channel = channel;
    res.render('booking', {
        today,
        channel
    });
    console.log("booking connect")
});

router.get('/petsmao', async function (req, res) {
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    let channel = 'petsmao'
    res.render('petsmao', {
        today,
        channel
    });
    console.log("booking connect")
});

router.post('/renderSchedule', async function (req, res) {
    let channel = req.body.channel;
    let beforeCreateScheduleSql = "select * from booking.schedule_event where channel = ?"
    let beforeCreateScheduleData = [channel]
    let allSchedule = await query(beforeCreateScheduleSql,beforeCreateScheduleData)
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
router.post('/deleteCalendar', async function (req, res) {
    let delIdArray = []
    let delCalId = req.body.delCalId;
    let delCalSql = 'DELETE FROM booking.calendar_list WHERE id = ?'
    let delCalScheduleSql = 'DELETE FROM booking.schedule_event WHERE calendarId = ?'
    let delCalScheduleIdSql = 'SELECT id FROM booking.schedule_event WHERE calendarId = ?'
    let delCalSqlData = [delCalId]
    let delScheduleId = await query(delCalScheduleIdSql, delCalSqlData)

    for (const delId of delScheduleId) {
        delIdArray.push(delId)
    }
    await query(delCalSql, delCalSqlData)
    await query(delCalScheduleSql, delCalSqlData)
    res.send(JSON.stringify({
        'Delete Calendar': 'succeed',
        'delIdArray': delIdArray
    }));
})
router.post('/createCalendarList', async function (req, res) {
    let calendarId = req.body.calendarId;
    let calendarName = req.body.calendarName;
    let calendarColor = req.body.calendarColor;
    let calendarBgColor = req.body.calendarBgColor;
    let calendarDragBgColor = req.body.calendarDragBgColor;
    let calendarBorderColor = req.body.calendarBorderColor;
    let calendarListSql = 'insert into booking.calendar_list (id,name,color,bgcolor,dragbgcolor,bordercolor) values (?,?,?,?,?,?)'
    let calendarListData = [calendarId, calendarName, calendarColor, calendarBgColor, calendarDragBgColor, calendarBorderColor]
    await query(calendarListSql, calendarListData)

    res.send(JSON.stringify({
        'add Calendar': 'succeed',
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
    let channel = req.body.channel;
    // let color = req.body.color
    // let bgColor = req.body.bgColor
    // let dragBgColor = req.body.dragBgColor
    // let borderColor = req.body.borderColor
    // let beforeCreateScheduleSql = "INSERT INTO booking.event(`id`,`calendarId`,`title`,`isAllDay`,`start`,`end`,`category`,`state`,`color`,`bgColor`,`dragBgColor`,`borderColor`)VALUES(?,?,?,?,?,?,?,?,?,?,?,?);"
    // let newScheduleData = [id, calendarId, title, isAllDay, start, end, category, state, color, bgColor, dragBgColor, borderColor]

    let beforeCreateScheduleSql = "INSERT INTO booking.schedule_event(`id`,`calendarId`,`title`,`isAllDay`,`start`,`end`,`category`,`state`,`channel`)VALUES(?,?,?,?,?,?,?,?,?);"
    let newScheduleData = [id, calendarId, title, isAllDay, start, end, category, state, channel]
    await query(beforeCreateScheduleSql, newScheduleData)
    res.send(JSON.stringify({
        'beforeCreateSchedule': 'succeed',
    }));
})
router.post('/beforeDeleteSchedule', async function (req, res) {
    let deleteId = req.body.deleteId
    let beforeDeleteScheduleSql = "delete from booking.schedule_event where id = ?"
    let deleteScheduleData = [deleteId]
    await query(beforeDeleteScheduleSql, deleteScheduleData)
    res.send(JSON.stringify({
        'beforeDeleteSchedule': 'succeed',
    }));
})
router.post('/beforeUpdateSchedule', async function (req, res) {
    let scheduleId = req.body.scheduleId
    let updateId = req.body.updateId
    let updateTitle = req.body.updateTitle
    let updateLocation = req.body.updateLocation
    let updateStart = req.body.updateStart
    let updateEnd = req.body.updateEnd
    // let updateBgColor = req.body.updateBgColor
    // let updateBorderColor = req.body.updateBorderColor
    // let updateColor = req.body.updateColor
    // let updateDragBgColor = req.body.updateDragBgColor
    // let beforeUpdateScheduleSql = "UPDATE booking.event SET id = ?, title = ?, location = ?, bgColor = ?, borderColor = ?, color = ?, dragBgColor = ?, start = ?, end = ? WHERE id = ?"
    // let updateScheduleData = [updateId, updateTitle, updateLocation, updateBgColor, updateBorderColor, updateColor, updateDragBgColor, updateStart, updateEnd, scheduleId]

    let updateScheduleData = [updateId, updateTitle, updateLocation, updateStart, updateEnd, scheduleId]
    let beforeUpdateScheduleSql = "UPDATE booking.schedule_event SET calendarId = ?, title = ?, location = ?, start = ?, end = ? WHERE id = ?"
    await query(beforeUpdateScheduleSql, updateScheduleData)

    res.send(JSON.stringify({
        'beforeUpdateSchedule': 'succeed',
    }));
})
router.get('/test', async function (req, res) {
    let centerMember = 'asd'
    res.send(JSON.stringify({
        centerMember,
    }));
})

// eslint-disable-next-line no-undef
module.exports = router;