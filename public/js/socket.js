var socket = io();
socket.on(channel + 'create schedule', function (schedule) {
    cal.createSchedules([
        {
            id: schedule[0].id,
            calendarId: schedule[0].calendarId,
            title: schedule[0].title,
            location: schedule[0].location,
            category: 'time',
            dueDateClass: '',
            start: schedule[0].start._date,
            end: schedule[0].end._date,
        }
    ]);
});
socket.on(channel + 'update schedule', function (scheduleId, calId, changes) {
    console.log('get server update schedule socket');
    cal.updateSchedule(scheduleId, calId, changes);
});
socket.on(channel + 'delete schedule', function (scheduleId, calId) {
    console.log('get server delete schedule socket');
    cal.deleteSchedule(scheduleId, calId);
});
socket.on(channel + 'create calendar', function (calendarId, calendarName, calendarColor) {
    console.log('get server create calendar socket');
    calendar = new CalendarInfo();
    calendar.id = calendarId;
    calendar.name = calendarName;
    calendar.color = '#ffffff';
    calendar.bgColor = calendarColor;
    calendar.dragBgColor = calendarColor;
    calendar.borderColor = calendarColor;
    addCalendar(calendar);

    $('#calendarList').append('<div class="row"><div class="lnb-calendars-item col-9"><label>' +
        '<input type="checkbox" class="tui-full-calendar-checkbox-round" value="' + calendar.id + '" checked>' +
        '<span style="border-color: ' + calendar.borderColor + '; background-color: ' + calendar.borderColor + ';"></span>' +
        '<span>' + calendar.name + '</span> ' +
        '</label></div><div class="col-3 py-2 delBtn ' + calendar.id + '" delName="' + calendar.name + '" delId="' + calendar.id + '"><i class="fas fa-backspace"></i></div></div>')
    $('.dropdown-menu-title[data-action="toggle-monthly"]').click()
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
