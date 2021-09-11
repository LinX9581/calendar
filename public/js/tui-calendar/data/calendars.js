'use strict';

/* eslint-disable require-jsdoc, no-unused-vars */
var socket = io();
var CalendarList = [];
var calendar;
var html = [];

//一開始先 render Calendar Schedule OrderList 
//之後讓套件 rerender 為了讓 Schedule 能抓到 Calendar
//再讓calendarDel() 能夠監聽   -> 這部分改成delegate就不用重複呼叫function (待修)

/**
 * renderCalendar()         : 從資料庫傳cal到前端的 編輯委刊單、新增委刊單、calendarList
 * renderSchedule()         : 從資料庫傳schedule到前端
 * renderOrderList()        : 從資料庫傳orderList到前端
 * afterAllEventRender()    : 初始化套件讓 Schedule 能抓到 Calendar
 * calendarDel()            : 讓新增的cal能夠監聽刪除事件
 * CalendarInfo(),addCalendar : 初始化一開始新增的calendar
 * findCalendar()           : 套件其他js用
 */

serverRenderInit()
async function serverRenderInit() {
    console.log('serverRenderInit');
    await renderCalendar()
    await renderSchedule()
    await renderOrderList()
    await renderChannel()
    await sleep(500)
    await afterAllEventRender()
    await calendarDel()
}

async function afterAllEventRender() {
    console.log("afterAllEventReadyRerender");
    $('.dropdown-menu-title[data-action="toggle-monthly"]').click()
    await sleep(500)
    $('.ic-readonly-b').addClass('fas fa-ban')
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
        //讓編輯委刊單和新增委刊單的table顯示calendar
        $.each(jsonData.calendar, function (index, val) {
            $('.dropdown_getCalUl').append(
                `
                    <li getChooseCalId=${val.id} value=${val.name}> <span class="calListStyle" style="background-color:${val.bgcolor}; color:${val.bgcolor};"></span> &nbsp; ${val.name}
                `
            );
        })
        //委刊單下拉選單
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
            //將原來的cal改成選擇的 cal.text() & cal.style
            $('.dropdown_getCalBtn').html(`<span class="calListStyle"></span>  ` + $(this).text() + `<i class="calendar-icon tui-full-calendar-dropdown-arrow"></i>`)
            $('.dropdown_getCalBtn > span').attr('style', $(this).children().attr('style'))
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
                '</label></div><div class="col-3 py-2 delBtn ' + calendar.id + '" delName="' + calendar.name + '" delId="' + calendar.id + '"><i class="fa fa-trash"></i></div></div>');
        });
        calendarList.innerHTML = html.join('\n');
    })
}

async function renderOrderList() {
    console.log('renderOrderList');
    await fetch('/getCalendarOrder', {
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
                    <li getChooseOrderId=${val.id} value=${val.title} >${val.title}
                `
            );
        })

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

        //選擇委託單時 給定所選 orderId calId 再讓 app.js去抓ID給後端
        $(".dropdown_getOrderUl").delegate("li", "click", function () {
            //將原來的order改成選擇的 order.text() & order.style
            $('.dropdown_getOrderBtn').html($(this).text() + '<i class="calendar-icon tui-full-calendar-dropdown-arrow"></i>')
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
    console.log('render schedule');
    await fetch('/ch/renderSchedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "channel": channel,
        })
    }).then(res => res.json()).then((jsonData) => {
        for (const key in jsonData.exceptUserSchedule) {
            jsonData.exceptUserSchedule[key].isReadOnly = '1'
        }
        cal.createSchedules(jsonData.exceptUserSchedule)
        cal.createSchedules(jsonData.schedule)
    })
}


async function renderChannel() {
    await fetch('/ch/renderChannel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    }).then(res => res.json()).then((allChannel) => {
        $.each(allChannel.channel, function (index, val) {
            $('.dropdown-menu').append(
                `
                <a class="dropdown-item" href="/ch/` + val.link + `">` + val.name + `</a>
            `
            );
        })
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
                },
                body: JSON.stringify({
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

dateRangePicker()
async function dateRangePicker() {
    let pickerDate = moment(new Date()).format('MM-DD-YYYY');
    await $('#customer_schedule_time').daterangepicker({
        "startDate": pickerDate,
        "endDate": pickerDate,
        "minDate": "01/01/2021",
    }, function (start, end, label) { });
}

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