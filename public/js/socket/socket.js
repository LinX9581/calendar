var socket = io();
let updateChangeTime = ''
socket.on(channel + 'create schedule', function (schedule) {
    console.log(schedule);
    cal.createSchedules([schedule[0]]);
});
socket.on(channel + 'update schedule', function (scheduleId, calId, changes) {
    console.log('get server update schedule socket');
    changes.start = moment(changes.start._date).format()
    changes.end = moment(changes.end._date).format()
    cal.updateSchedule(scheduleId, calId, changes);
});
socket.on(channel + 'delete schedule', function (scheduleId, calId) {
    console.log('get server delete schedule socket');
    cal.deleteSchedule(scheduleId, calId);
});
socket.on(channel + 'delete calendar', async function (delCalId) {
    console.log('get server delete calendar socket  ' + delCalId);
    await calendarDel()
    $('.' + delCalId).parent().remove()
});
socket.on(channel + 'delete schedule relattive to the calendar', function (delScheduleIdRes, delCalId) {
    console.log('get server delete schedule relattive to the calendar socket');
    for (const delScheduleIdIndex of delScheduleIdRes.delIdArray) {
        cal.deleteSchedule(delScheduleIdIndex.id, delCalId);
    }
});
