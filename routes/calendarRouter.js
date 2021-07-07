import query from './mysqlConnect';
import express from 'express';
import moment from 'moment';

let router = express.Router();
router.get('/www', async function (req, res) {
    // if (req.session.user != undefined) {
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    let channel = 'www'
    req.session.channel = channel;
    res.render('booking', {
        today,
        channel
    });
    // } else {
    //     res.render('404', {});
    // }
});

router.get('/petsmao', async function (req, res) {
    if (req.session.user != undefined) {

        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let channel = 'petsmao'
        res.render('petsmao', {
            today,
            channel
        });
    } else {
        res.render('404', {});
    }

});

router.post('/renderSchedule', async function (req, res) {
    let channel = req.body.channel;
    let beforeCreateScheduleSql = "select * from sale_booking.schedule_event where channel = ?"
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
    console.log(createCalendarResult);


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
    let advertisers = req.body.advertisers;
    let customer_company = req.body.customer_company;
    let salesperson = req.body.salesperson;
    let ad_type = req.body.ad_type;
    let memo = req.body.memo;

    let beforeCreateScheduleSql = "INSERT INTO sale_booking.schedule_event(`id`,`calendarId`,`title`,`isAllDay`,`start`,`end`,`category`,`state`,`channel`,`advertisers`,`customer_company`,`salesperson`,`ad_type`,`memo`)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
    let newScheduleData = [id, calendarId, title, isAllDay, start, end, category, state, channel, advertisers, customer_company, salesperson, ad_type, memo]
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
    let beforeUpdateScheduleSql = "UPDATE sale_booking.schedule_event SET calendarId = ?, title = ?, location = ?, start = ?, end = ? WHERE id = ?"
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