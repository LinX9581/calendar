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
    console.log('add calendar');
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
function hexToRGBA(hex) {
    var radix = 16;
    var r = parseInt(hex.slice(1, 3), radix),
        g = parseInt(hex.slice(3, 5), radix),
        b = parseInt(hex.slice(5, 7), radix),
        a = parseInt(hex.slice(7, 9), radix) / 255 || 1;
    var rgba = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';

    return rgba;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

var calendar;
var calendarList = document.getElementById('calendarList');
var html = [];
var id = 0;
(async function() {
    await test()
    // calendar = new CalendarInfo();
    // id += 2;
    // calendar.id = String(id);
    // calendar.name = 'My Calendar';
    // calendar.color = '#ffffff';
    // calendar.bgColor = '#9e5fff';
    // calendar.dragBgColor = '#9e5fff';
    // calendar.borderColor = '#9e5fff';
    // addCalendar(calendar);
    await renderSchedule()
    await sleep(3000)
    await cal.clear();
    await cal.render();
    await renderSchedule()
})();


async function test() {
    await fetch('/renderCalendar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        })
    }).then(res => res.json()).then((jsonData) => {
        calendar = new CalendarInfo();
        calendar.id = jsonData.calendar[0].id;
        calendar.name = jsonData.calendar[0].name;
        calendar.color = jsonData.calendar[0].color;
        calendar.bgColor = jsonData.calendar[0].bgcolor;
        calendar.dragBgColor = jsonData.calendar[0].dragbgcolor;
        calendar.borderColor = jsonData.calendar[0].bordercolor;
        CalendarList.push(calendar)

        CalendarList.forEach(function (calendar) {
            html.push('<div class="lnb-calendars-item"><label>' +
                '<input type="checkbox" class="tui-full-calendar-checkbox-round" value="' + calendar.id + '" checked>' +
                '<span style="border-color: ' + calendar.borderColor + '; background-color: ' + calendar.borderColor + ';"></span>' +
                '<span>' + calendar.name + '</span>' +
                '</label></div>'
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
        })
    }).then(res => res.json()).then((jsonData) => {
        cal.createSchedules(jsonData.schedule)
    })
}

$('#addListBtn').click(async function () {
    addCalendarInfo()
})
async function addCalendarInfo() {
    let calendarName = $('#addListInput').val()
    let calendarColor = $('#listColor').val()
    if (calendarName != '' && calendarColor != '') {
        console.log(calendarName, calendarColor);
        calendarInfo(calendarName, calendarColor)
    }
}
async function calendarInfo(calendarName, calendarColor) {
    console.log(calendarName + 'add calendar');
    calendar = new CalendarInfo();
    // let id = 3
    calendar.id = String(chance.guid());
    calendar.name = calendarName;
    calendar.color = '#ffffff';
    calendar.bgColor = calendarColor;
    calendar.dragBgColor = calendarColor;
    calendar.borderColor = calendarColor;
    console.log(calendar);
    addCalendar(calendar);
    console.log(CalendarList + '  list');
    $('#calendarList').append('<div class="lnb-calendars-item"><label>' +
    '<input type="checkbox" class="tui-full-calendar-checkbox-round" value="' + calendar.id + '" checked>' +
    '<span style="border-color: ' + calendar.borderColor + '; background-color: ' + calendar.borderColor + ';"></span>' +
    '<span>' + calendar.name + '</span>' +
    '</label></div>')
}

