'use strict';

/* eslint-disable require-jsdoc, no-unused-vars */

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
        })
    }).then(res => res.json()).then((jsonData) => {
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
                '</label></div><div class="col-3 py-2 delBtn" delName="' + calendar.name + '" delId="' + calendar.id + '"><i class="fas fa-backspace"></i></div></div>'
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
        }
    }).then(res => res.json()).then((jsonData) => {
        cal.createSchedules(jsonData.schedule)
    })
}

async function calendarDel(){
    $('.delBtn').on('click', async function () {
        let delCalId = $(this).attr('delId')
        let delCalName = $(this).attr('delName')
        let isDel = confirm('確定刪除 ' + delCalName + ' ?')
        if (isDel) {
            $(this).parent().remove()
            await fetch('/deleteCalendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }, body: JSON.stringify({
                    "delCalId": delCalId
                })
            }).then(res => res.json()).then((delIdRes) => {
                for (const delIdIndex of delIdRes.delIdArray) {
                    cal.deleteSchedule(delIdIndex.id, delCalId); //需要即時同步
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
        calendarInfo(calendarName, calendarColor)
    }
}

async function calendarInfo(calendarName, calendarColor) {
    calendar = new CalendarInfo();
    calendar.id = String(Date.now());
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
        '</label></div><div class="col-3 py-2 delBtn" delName="' + calendar.name + '" delId="' + calendar.id + '"><i class="fas fa-backspace"></i></div></div>')

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
            "calendarBorderColor": calendarColor
        })
    }).then(res => res.json()).then((createCalendarListRes) => {
        console.log(createCalendarListRes);
    })
}

