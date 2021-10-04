import mysql from './mysqlConnect';
import express from 'express';
import moment from 'moment';

// calendar的相關API
// booking.linxnote.club/ch/url  -> 會導到相關的頻道calendar頁面

/**
 * get('/:url')                         : 導到相關的頻道頁。
 * post('/renderChannel')               : rendar channel list 到 calendar左上角的切換頻道選單。
 * post('/renderSchedule')              : render schedule , 如果權限是User就只能看到該User的Schedule。
 * post('/renderCalendar')              : rendar calendar。
 * post('/getCalendarOrder')            : rendar dropdown orderList。
 * post('/deleteCalendar')              : 停用 calendar ， 包括相關的schedule，並把這些schedule傳給前端刪除 ； position頁也能刪除calenar，是真的刪除而不是停用
 * post('/createCalendarList')          : create calendar
 * post('/checkPositionRotation')       : 判斷確定委刊的委刊單數 是不是超過版位輪替數
 * post('/beforeCreateSchedule')        : create schedule
 * post('/beforeDeleteSchedule')        : delete schedule
 * post('/beforeUpdateScheduleTime')    : update schedule time
 * post('/beforeUpdateSchedule')        : update schedule title、calendarId
 */

let router = express.Router();
router.get('/:url', async function (req, res) {
    let title = 'NOW Booking '
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    // 測試用偽造身分
    // let user = {
    //     account: 'linx',
    //     name: 'linx',
    //     type: 'User',
    // }
    // req.session.user = user;
    if (req.session.user != undefined) {
        let url = req.params.url
        let getChannelNameSql = "select link,name from sale_booking.channel where link = ? "
        let getChannelNameData = [url]
        let getChannel = await mysql.query(getChannelNameSql, getChannelNameData)
        let channel = getChannel[0][0].link
        let channelName = getChannel[0][0].name

        res.render(url, {
            today,
            channel,
            channelName
        });
    } else {
        res.render('login', {
            today,
            title
        });
    }
});

router.post('/renderChannel', async function (req, res) {
    let beforeCreateChannelSql = "select link,name from sale_booking.channel"
    let allChannel = await mysql.query(beforeCreateChannelSql)
    console.log('render');
    res.send(JSON.stringify({
        'channel': allChannel[0],
        'render channel': 'succeed',
    }));
})

router.post('/renderSchedule', async function (req, res) {
    let renderScheduleCondition = ''
    let channel = req.body.channel;
    let user = req.session.user.account;
    let exceptUserAllSchedule = ''

    //判斷權限是user 就多一個 where條件
    if (req.session.user.type == 'User') {
        renderScheduleCondition = ' AND create_by = "' + user + '"'
        let beforeCreateScheduleExceptUserSql = "select * from sale_booking.schedule_event where channelId = ? AND status = 1 AND create_by != ?"
        let beforeCreateScheduleExceptUserData = [channel, user]
        exceptUserAllSchedule = await mysql.query(beforeCreateScheduleExceptUserSql, beforeCreateScheduleExceptUserData)
    }

    let beforeCreateScheduleSql = "select * from sale_booking.schedule_event where channelId = ? " + renderScheduleCondition + " AND status = 1 OR status = 2"
    let beforeCreateScheduleData = [channel]
    let allSchedule = await mysql.query(beforeCreateScheduleSql, beforeCreateScheduleData)

    res.send(JSON.stringify({
        'schedule': allSchedule[0],
        'exceptUserSchedule': exceptUserAllSchedule[0],
        'render schedule': 'succeed',
    }));
})
router.post('/renderCalendar', async function (req, res) {
    let channel = req.body.channel;

    let beforeCreateCalendarSql = "select * from sale_booking.calendar_list where channelId = ? AND status = 1 order by orderKey"
    let beforeCreateCalendarData = [channel]
    let allCalendar = await mysql.query(beforeCreateCalendarSql, beforeCreateCalendarData)

    res.send(JSON.stringify({
        'calendar': allCalendar[0],
        'render Calendar': 'succeed',
    }));
})

//在calendar 不顯示停用的Order
router.post('/getCalendarOrder', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let renderOrderCondition = ''
        //判斷權限是user 就多一個 where條件
        if (req.session.user.type == 'User') {
            let account = req.session.user.account;
            renderOrderCondition = 'AND create_by = "' + account + '"'
        }
        let getOrderSql = 'SELECT id,advertisers,title,ad_type,salesperson,memo,status FROM sale_booking.order_list WHERE (status = 1 or status = 2) ' + renderOrderCondition + ' ORDER BY advertisers'
        let allOrder = await mysql.query(getOrderSql)

        res.send(JSON.stringify({
            'allOrder': allOrder[0],
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/deleteCalendar', async function (req, res) {
    let delIdArray = []
    let delCalId = req.body.delCalId;
    //停用cal
    let delCalSql = 'UPDATE sale_booking.calendar_list SET status=0 WHERE id = ?'
    let delCalData = [delCalId]
    await mysql.query(delCalSql, delCalData)

    //停用該cal相關的schedule
    let updateScheduleSql = 'UPDATE sale_booking.schedule_event SET status=0 WHERE calendarId=?'
    let updateScheduleData = [delCalId]
    await mysql.query(updateScheduleSql, updateScheduleData)

    //把相關的schedule 傳給前端停止顯示
    let delCalScheduleIdSql = 'SELECT id FROM sale_booking.schedule_event WHERE calendarId = ?'
    let delCalSqlData = [delCalId]
    let delScheduleId = await mysql.query(delCalScheduleIdSql, delCalSqlData)

    for (const delId of delScheduleId[0]) {
        delIdArray.push(delId)
    }

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
    await mysql.query(calendarListSql, calendarListData)

    res.send(JSON.stringify({
        'calendarId': calendarId,
        'calendarColor': calendarBgColor,
        'calendarName': calendarName,
        'add Calendar': 'succeed',
    }));
})
// 等委刊單確定頁面出來後才檢查輪替數是否超過
router.post('/checkPositionRotation', async function (req, res) {
    let rotationOverflow = ''
    let calendarId = req.body.calendarId

    let getPositionNumbersSql = "SELECT count(*) AS adNumbers FROM sale_booking.`order_list` INNER JOIN sale_booking.`schedule_event` ON `order_list`.`id` = `schedule_event`.`orderId` WHERE calendarId = ? AND `order_list`.status = 2"
    let getPositionNumbersData = [calendarId]
    let getPositionNumbers = await mysql.query(getPositionNumbersSql, getPositionNumbersData)

    let getPositionRotationSql = "SELECT rotation FROM sale_booking.`calendar_list` WHERE id = ?"
    let getPositionRotationData = [calendarId]
    let getPositionRotation = await mysql.query(getPositionRotationSql, getPositionRotationData)

    if (getPositionRotation[0][0].rotation <= getPositionNumbers[0][0].adNumbers) {
        rotationOverflow = '-1';
    }
    res.send(JSON.stringify({
        'rotationOverflow': rotationOverflow,
    }));
})
router.post('/beforeCreateSchedule', async function (req, res) {
    let user = req.session.user.account;
    let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
    let id = req.body.id
    let calendarId = req.body.calendarId
    let title = req.body.title
    let isAllDay = req.body.isAllDay
    let start = moment(req.body.start).format('YYYY-MM-DD HH:mm:ss')
    let end = moment(req.body.end).format('YYYY-MM-DD HH:mm:ss')
    let category = req.body.category
    let state = '1'
    let channelId = req.body.channel;
    let scheduleBody = req.body.scheduleBody;
    let orderId = req.body.orderId;

    let beforeCreateScheduleSql = "INSERT INTO sale_booking.schedule_event(`id`,`orderId`,`channelId`,`calendarId`,`title`,`body`,`isAllDay`,`start`,`end`,`category`,`status`,`create_date`,`create_by`,`update_date`,`update_by`)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);"
    let newScheduleData = [id, orderId, channelId, calendarId, title, JSON.stringify(scheduleBody), isAllDay, start, end, category, state, nowDate, user, nowDate, user]
    await mysql.query(beforeCreateScheduleSql, newScheduleData)

    res.send(JSON.stringify({
        'beforeCreateSchedule': 'succeed',
    }));
})
router.post('/beforeDeleteSchedule', async function (req, res) {
    let deleteId = req.body.deleteId

    let beforeDeleteScheduleSql = "delete from sale_booking.schedule_event where id = ?"
    let deleteScheduleData = [deleteId]
    await mysql.query(beforeDeleteScheduleSql, deleteScheduleData)

    res.send(JSON.stringify({
        'beforeDeleteSchedule': 'succeed',
    }));
})
//原套件即時同步更新時間有BUG 另外建一支API
router.post('/beforeUpdateScheduleTime', async function (req, res) {
    // update 會莫名觸發兩次 但不影響運作 推測是在套件監聽事件裡面 再次觸發update導致兩次 相關code 在 app.js  'clickSchedule' & $('.schedule_edit_btn').click() 這兩個分別會觸發一次
    let scheduleId = req.body.scheduleId
    let updateStart = req.body.updateStart
    let updateEnd = req.body.updateEnd

    let beforeUpdateScheduleSql = "UPDATE sale_booking.schedule_event SET start = ?, end = ? WHERE id = ?"
    let updateScheduleData = [updateStart, updateEnd, scheduleId]
    await mysql.query(beforeUpdateScheduleSql, updateScheduleData)

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

        let beforeUpdateScheduleSql = "UPDATE sale_booking.schedule_event SET calendarId = ?, title = ? WHERE id = ?"
        let updateScheduleData = [updateCalendarId, updateTitle, scheduleId]
        await mysql.query(beforeUpdateScheduleSql, updateScheduleData)
    }

    res.send(JSON.stringify({
        'beforeUpdateSchedule': 'succeed',
    }));
})

// eslint-disable-next-line no-undef
module.exports = router;