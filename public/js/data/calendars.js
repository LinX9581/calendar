'use strict';

/* eslint-disable require-jsdoc, no-unused-vars */
var socket = io();
var CalendarList = [];

function CalendarInfo() {
    this.id = null;
    this.name = null;
    this.checked = true;
    this.color = null;
    this.bgColor = null;
    this.borderColor = null;
    this.dragBgColor = null;
}

function addCalendar(calendar) {
    CalendarList.push(calendar);
}

function findCalendar(id) {
    var found;

    CalendarList.forEach(function (calendar) {
        if (calendar.id === id) {
            found = calendar;
        }
    });

    return found || CalendarList[0];
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var calendar;
var html = [];

serverRenderInit()
async function serverRenderInit() {
    console.log('serverRenderInit');
    await renderCalendar()
    await renderSchedule()
    await sleep(1000)
    await afterAllEventRender()
    $('.tui-full-calendar-weekday-grid-line').attr({
        "data-toggle": "modal",
        "data-target": "#exampleModal"
    })
}

async function afterAllEventRender() {
    console.log("afterAllEventReadyRerender");
    $('.dropdown-menu-title[data-action="toggle-monthly"]').click()
    await calendarDel()
}
async function renderCalendar() {
    await fetch('/renderCalendar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "channel": channel,
        })
    }).then(res => res.json()).then((jsonData) => {
        $.each(jsonData.calendar, function (index, val) {
            console.log(val.bgcolor);
            $('.dropdown_ul').append(
                `
                    <li getChooseCalId=${val.id}> <span class="test2" style="background-color:${val.bgcolor}; color:${val.bgcolor};">12 </span> &nbsp; ${val.name}
                `
            );
        })
        // <li><span class="test2" style="background-color:red; color:red;">  11   </span><a> &nbsp; Create Page</a></li>
        $('.dropdown_getCalendarList_button').text($('.dropdown_ul>li').first().text())
        $('.dropdown_getCalendarList_button').attr('thisCalId',$('.dropdown_ul>li').first().attr('getChooseCalId'))
        $(".dropdown_getCalendarList_button").click(function () {
            var val = $(this).attr('id');
            if (val == 1) {
                $(".dropdown_ul").hide();
                $(this).attr('id', '0');
            } else {
                $(".dropdown_ul").show();
                $(this).attr('id', '1');
            }

        });
        $('.dropdown_ul>li').click(function () {
            $('.dropdown_getCalendarList_button').text($(this).text())
            $('.dropdown_getCalendarList_button').attr('thisCalId',$(this).attr('getChooseCalId'))
            $("ul").hide();
            $(".dropdown_getCalendarList_button").attr('id', '0');

        })
        //Mouse click on setting button and ul list
        $("ul, .dropdown_getCalendarList_button").mouseup(function () {
            return false;
        });

        //Document Click
        $(document).mouseup(function () {
            $("ul").hide();
            $(".dropdown_getCalendarList_button").attr('id', '0');
        });


        // Render Calendar List
        for (let i = 0; i < jsonData.calendar.length; i++) {
            calendar = new CalendarInfo();
            calendar.id = jsonData.calendar[i].id;
            calendar.name = jsonData.calendar[i].name;
            calendar.color = jsonData.calendar[i].color;
            calendar.bgColor = jsonData.calendar[i].bgcolor;
            calendar.dragBgColor = jsonData.calendar[i].dragbgcolor;
            calendar.borderColor = jsonData.calendar[i].bordercolor;
            addCalendar(calendar);
        }

        CalendarList.forEach(function (calendar) {
            html.push('<div class="row"><div class="lnb-calendars-item col-9"><label>' +
                '<input type="checkbox" class="tui-full-calendar-checkbox-round" value="' + calendar.id + '" checked>' +
                '<span style="border-color: ' + calendar.borderColor + '; background-color: ' + calendar.borderColor + ';"></span>' +
                '<span>' + calendar.name + '</span> ' +
                '</label></div><div class="col-3 py-2 delBtn ' + calendar.id + '" delName="' + calendar.name + '" delId="' + calendar.id + '"><i class="fas fa-backspace"></i></div></div>'
            );
        });
        calendarList.innerHTML = html.join('\n');
    })
}

async function renderSchedule() {
    await fetch('/renderSchedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "channel": channel,
        })
    }).then(res => res.json()).then((jsonData) => {
        cal.createSchedules(jsonData.schedule)
    })
}

async function calendarDel() {
    $('.delBtn').on('click', async function () {
        let delCalId = $(this).attr('delId')
        console.log(delCalId + 'deleteid');
        let delCalName = $(this).attr('delName')
        let isDel = confirm('確定刪除 ' + delCalName + ' ?')

        if (isDel) {
            $(this).parent().remove()
            socket.emit('delete calendar', delCalId, channel);

            await fetch('/deleteCalendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }, body: JSON.stringify({
                    "delCalId": delCalId
                })
            }).then(res => res.json()).then((delScheduleIdRes) => {
                socket.emit('delete calendar relate to the schedule', delScheduleIdRes, delCalId, channel);
                for (const delScheduleIdIndex of delScheduleIdRes.delIdArray) {
                    cal.deleteSchedule(delScheduleIdIndex.id, delCalId);
                }
            })
        }
    })
}

$('#addListBtn').click(async function () {
    await addCalendarInfo()
    $('.dropdown-menu-title[data-action="toggle-monthly"]').click()
    $('#addListInput').val('')
    $('#addListColorInput').val('')
    await calendarDel()
})

async function addCalendarInfo() {
    let calendarName = $('#addListInput').val()
    let calendarColor = $('#addListColorInput').val()
    if (calendarName != '' && calendarColor != '') {
        calendarInfo(calendarName, calendarColor, channel)
    } else {
        alert('name、color 不得為空')
    }
}

async function calendarInfo(calendarName, calendarColor, channel) {
    calendar = new CalendarInfo();
    calendar.id = String(Date.now());
    calendar.name = calendarName;
    calendar.color = '#ffffff';
    calendar.bgColor = calendarColor;
    calendar.dragBgColor = calendarColor;
    calendar.borderColor = calendarColor;
    addCalendar(calendar);
    socket.emit('create calendar', calendar.id, calendarName, calendarColor, channel);

    $('#calendarList').append('<div class="row"><div class="lnb-calendars-item col-9"><label>' +
        '<input type="checkbox" class="tui-full-calendar-checkbox-round" value="' + calendar.id + '" checked>' +
        '<span style="border-color: ' + calendar.borderColor + '; background-color: ' + calendar.borderColor + ';"></span>' +
        '<span>' + calendar.name + '</span> ' +
        '</label></div><div class="col-3 py-2 delBtn ' + calendar.id + '" delName="' + calendar.name + '" delId="' + calendar.id + '"><i class="fas fa-backspace"></i></div></div>')

    await fetch('/createCalendarList', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "calendarList": CalendarList,
            "calendarId": calendar.id,
            "calendarName": calendarName,
            "calendarColor": '#ffffff',
            "calendarBgColor": calendarColor,
            "calendarDragBgColor": calendarColor,
            "calendarBorderColor": calendarColor,
            "channel": channel
        })
    }).then(res => res.json()).then((createCalendarListRes) => {
        console.log(createCalendarListRes);
    })
}

