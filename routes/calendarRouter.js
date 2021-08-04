import query from './mysqlConnect';
import express from 'express';
import moment from 'moment';

let router = express.Router();
router.get('/:channel', async function (req, res) {
    // console.log(req.session.user);
    // if (req.session.user != undefined) {
        let channel = 'www'
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        // req.session.channel = channel;
        res.render(channel, {
            today,
            channel
        });
    // } else {
    //     res.render('../login', {
    //         today,
    //         title
    //     });
    // }
});

router.get('/', async function (req, res) {
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    res.render('test', {
        today
    });
});

router.post('/renderSchedule', async function (req, res) {
    let renderScheduleCondition = ''
    //判斷權限是user 就多一個 where條件
    if (req.session.user.type == 'User') {
        let user = req.session.user.account;
        renderScheduleCondition = ' AND create_by = "' + user + '"'
    }
    let channel = req.body.channel;
    let beforeCreateScheduleSql = "select * from sale_booking.schedule_event where channel = ? " + renderScheduleCondition + ""
    let beforeCreateScheduleData = [channel]
    let allSchedule = await query(beforeCreateScheduleSql, beforeCreateScheduleData)
    res.send(JSON.stringify({
        'schedule': allSchedule,
        'render schedule': 'succeed',
    }));
})
router.post('/renderCalendar', async function (req, res) {
    let channel = req.body.channel;
    let beforeCreateCalendarSql = "select * from sale_booking.calendar_list where channel = ? order by orderKey"
    let beforeCreateCalendarData = [channel]
    let allCalendar = await query(beforeCreateCalendarSql, beforeCreateCalendarData)
    res.send(JSON.stringify({
        'calendar': allCalendar,
        'render Calendar': 'succeed',
    }));
})
router.post('/deleteCalendar', async function (req, res) {
    let delIdArray = []
    let delCalId = req.body.delCalId;
    let delCalSql = 'DELETE FROM sale_booking.calendar_list WHERE id = ?'
    let delCalScheduleSql = 'DELETE FROM sale_booking.schedule_event WHERE calendarId = ?'
    let delCalScheduleIdSql = 'SELECT id FROM sale_booking.schedule_event WHERE calendarId = ?'
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
    let userName = req.session.user.name
    let createTime = new moment().format('YYYY-MM-DD HH:mm:ss')
    let calendarId = req.body.calendarId;
    let calendarName = req.body.calendarName;
    let calendarColor = req.body.calendarColor;
    let calendarBgColor = req.body.calendarBgColor;
    let calendarDragBgColor = req.body.calendarDragBgColor;
    let calendarBorderColor = req.body.calendarBorderColor;
    let channel = req.body.channel;
    let calendarListSql = 'insert into sale_booking.calendar_list (id,name,color,bgcolor,dragbgcolor,bordercolor,channel,create_date,create_by,update_date,update_by) values (?,?,?,?,?,?,?,?,?,?,?)'
    let calendarListData = [calendarId, calendarName, calendarColor, calendarBgColor, calendarDragBgColor, calendarBorderColor, channel, createTime, userName, createTime, userName]
    let createCalendarResult = await query(calendarListSql, calendarListData)

    res.send(JSON.stringify({
        'calendarId': calendarId,
        'calendarColor': calendarBgColor,
        'calendarName': calendarName,
        'add Calendar': 'succeed',
    }));
})
router.post('/beforeCreateSchedule', async function (req, res) {
    let user = req.session.user.account;
    let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
    let id = req.body.id
    let calendarId = req.body.calendarId
    let title = req.body.title
    let isAllDay = req.body.isAllDay
    let start = moment(req.body.start._date).format('YYYY-MM-DD HH:mm:ss')
    let end = moment(req.body.end._date).format('YYYY-MM-DD HH:mm:ss')
    let category = req.body.category
    let state = req.body.state
    let channel = req.body.channel;
    let scheduleBody = req.body.scheduleBody;

    let beforeCreateScheduleSql = "INSERT INTO sale_booking.schedule_event(`id`,`calendarId`,`title`,`body`,`isAllDay`,`start`,`end`,`category`,`state`,`channel`,`create_date`,`create_by`,`update_date`,`update_by`)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
    let newScheduleData = [id, calendarId, title, JSON.stringify(scheduleBody), isAllDay, start, end, category, state, channel, nowDate, user, nowDate, user]
    console.log(newScheduleData);
    await query(beforeCreateScheduleSql, newScheduleData)
    res.send(JSON.stringify({
        'beforeCreateSchedule': 'succeed',
    }));
})
router.post('/beforeDeleteSchedule', async function (req, res) {
    let deleteId = req.body.deleteId
    let beforeDeleteScheduleSql = "delete from sale_booking.schedule_event where id = ?"
    let deleteScheduleData = [deleteId]
    await query(beforeDeleteScheduleSql, deleteScheduleData)
    res.send(JSON.stringify({
        'beforeDeleteSchedule': 'succeed',
    }));
})
//原套件即時同步更新時間有BUG 另外建一支API
router.post('/beforeUpdateScheduleTime', async function (req, res) {
    // update 會莫名觸發兩次 但不影響運作 推測是在套件監聽事件裡面 再次觸發update導致兩次 相關code 在 app.js  'clickSchedule' & $('.schedule_edit_btn').click() 這兩個分別會觸發一次
    console.log(req.body.changes);
    // if (req.body.changes != undefined) {
    let scheduleId = req.body.scheduleId
    let updateStart = req.body.updateStart
    let updateEnd = req.body.updateEnd

    let beforeUpdateScheduleSql = "UPDATE sale_booking.schedule_event SET start = ?, end = ? WHERE id = ?"
    let updateScheduleData = [updateStart, updateEnd, scheduleId]
    await query(beforeUpdateScheduleSql, updateScheduleData)
    // }

    res.send(JSON.stringify({
        'beforeUpdateSchedule': 'succeed',
    }));
})
router.post('/beforeUpdateSchedule', async function (req, res) {
    // update 會莫名觸發兩次 但不影響運作 推測是在套件監聽事件裡面 再次觸發update導致兩次 相關code 在 app.js  'clickSchedule' & $('.schedule_edit_btn').click() 這兩個分別會觸發一次
    if (req.body.changes != undefined) {
        let scheduleId = req.body.scheduleId
        let updateCalendarId = req.body.changes.calendarId
        let updateTitle = req.body.changes.title
        // let updateStart = req.body.updateStart
        // let updateEnd = req.body.updateEnd

        let beforeUpdateScheduleSql = "UPDATE sale_booking.schedule_event SET calendarId = ?, title = ? WHERE id = ?"
        let updateScheduleData = [updateCalendarId, updateTitle, scheduleId]
        await query(beforeUpdateScheduleSql, updateScheduleData)
    }

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