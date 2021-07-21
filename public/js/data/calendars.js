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
    await renderOrderList()
    await sleep(1000)
    await afterAllEventRender()
    await calendarDel()
}

async function afterAllEventRender() {
    console.log("afterAllEventReadyRerender");
    $('.dropdown-menu-title[data-action="toggle-monthly"]').click()
}

async function renderCalendar() {
    await fetch('/ch/renderCalendar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "channel": channel,
        })
    }).then(res => res.json()).then((jsonData) => {
        $.each(jsonData.calendar, function (index, val) {
            $('.dropdown_getCalUl').append(
                `
                    <li getChooseCalId=${val.id}> <span class="calListStyle" style="background-color:${val.bgcolor}; color:${val.bgcolor};"></span> &nbsp; ${val.name}
                `
            );
        })
        $('.dropdown_getCalBtn').text($('.dropdown_getCalUl>li').first().text())
        $('.dropdown_getCalBtn').attr('thisCalId', $('.dropdown_getCalUl>li').first().attr('getChooseCalId'))
        $(".dropdown_getCalBtn").click(function () {
            console.log('dropdown_getCalendarList_button click');
            var val = $(this).attr('id');
            if (val == 1) {
                $(".dropdown_getCalUl").hide();
                $(this).attr('id', '0');
            } else {
                $(".dropdown_getCalUl").show();
                $(this).attr('id', '1');
            }

        });
        $(".dropdown_getCalUl").delegate("li", "click", function () {
            console.log('dropdown calendar li click');
            $('.dropdown_getCalBtn').text($(this).text())
            $('.dropdown_getCalBtn').attr('thisCalId', $(this).attr('getChooseCalId'))
            $(".dropdown_getCalUl").hide();
            $(".dropdown_getCalBtn").attr('id', '0');
        });

        $(".dropdown_getCalUl, .dropdown_getCalBtn").mouseup(function () {
            return false;
        });

        $(document).mouseup(function () {
            $(".dropdown_getCalUl").hide();
            $(".dropdown_getCalBtn").attr('id', '0');
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

async function renderOrderList() {
    console.log('renderOrderList');
    await fetch('/getOrder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "channel": channel,
        })
    }).then(res => res.json()).then((jsonData) => {
        $.each(jsonData.allOrder, function (index, val) {
            $('.dropdown_getOrderUl').append(
                `
                    <li getChooseOrderId=${val.id}>${val.title}
                `
            );
        })
        $('.dropdown_getOrderBtn').text($('.dropdown_getOrderUl>li').first().text())
        $('.dropdown_getOrderBtn').attr('thisCalId', $('.dropdown_getOrderUl>li').first().attr('getChooseCalId'))
        $('.dropdown_getOrderBtn').attr('thisOrderId', $('.dropdown_getOrderUl>li').first().attr('getChooseOrderId'))
        $('.dropdown_getOrderBtn').attr('thisOrderTitle', $('.dropdown_getOrderUl>li').first().text())
        $(".dropdown_getOrderBtn").click(function () {
            console.log('dropdown_getCalendarList_button click');
            var val = $(this).attr('id');
            if (val == 1) {
                $(".dropdown_getOrderUl").hide();
                $(this).attr('id', '0');
            } else {
                $(".dropdown_getOrderUl").show();
                $(this).attr('id', '1');
            }

        });
        $(".dropdown_getOrderUl").delegate("li", "click", function () {
            console.log('dropdown calendar li click');
            console.log($(this).text());
            $('.dropdown_getOrderBtn').text($(this).text())
            $('.dropdown_getOrderBtn').attr('thisCalId', $(this).attr('getChooseCalId'))
            $('.dropdown_getOrderBtn').attr('thisOrderId', $(this).attr('getChooseOrderId'))
            $('.dropdown_getOrderBtn').attr('thisOrderTitle', $(this).text())
            $(".dropdown_getOrderUl").hide();
            $(".dropdown_getOrderBtn").attr('id', '0');
        });

        $(".dropdown_getOrderUl, .dropdown_getOrderBtn").mouseup(function () {
            return false;
        });

        $(document).mouseup(function () {
            $(".dropdown_getOrderUl").hide();
            $(".dropdown_getOrderBtn").attr('id', '0');
        });
    })
}


async function renderSchedule() {
    await fetch('/ch/renderSchedule', {
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

//新增的 calendar list , 讓 del btn 可以偵測新增的calendar list
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

    await fetch('/ch/createCalendarList', {
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
        $('.dropdown_getCalUl').append(
            `
                <li getChooseCalId=${createCalendarListRes.calendarId}> <span class="calListStyle" style="background-color:${createCalendarListRes.calendarColor}; color:${createCalendarListRes.calendarColor};"></span> &nbsp; ${calendarName}
            `
        );
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
            $('li[getChooseCalId=' + delCalId + ']').remove()
            await fetch('/ch/deleteCalendar', {
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