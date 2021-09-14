'use strict';

/* eslint-disable */
/* eslint-env jquery */
/* global moment, tui, chance */
/* global findCalendar, CalendarList, ScheduleList */

/**
 * calendar event handlers      : schedule的觸發事件 (新增、移除、更新)
 * custom-edit-schedule-event   : 客製化的編輯表單
 * customTime-create-schedule   : 客製化時間的建立排程表單
 * custom-create-schedule-event : 課室化的建立排程表單
 * default function             : 套件預設function
 */
var socket = io();

(async function (window, Calendar) {
    var cal, resizeThrottled;
    var useCreationPopup = false;   //把原本彈開的新增排程改成 bootstrap4的modal
    var useDetailPopup = true;
    var datePicker, selectedCalendar;
    let createScheduleEvent = '';
    let updateScheduleEvent = '';
    let updateChangeTime = '';

    cal = new Calendar('#calendar', {
        defaultView: 'month',
        useCreationPopup: useCreationPopup,
        useDetailPopup: useDetailPopup,
        calendars: CalendarList,
        template: {
            milestone: function (model) {
                return '<span class="calendar-font-icon ic-milestone-b"></span> <span style="background-color: ' + model.bgColor + '">' + model.title + '</span>';
            },
            allday: function (schedule) {
                return getTimeTemplate(schedule, true);
            },
            time: function (schedule) {
                return getTimeTemplate(schedule, false);
            }
        }
    });

    // calendar event handlers
    cal.on({
        'clickMore': function (e) {
            console.log('clickMore', e);
        },
        'clickSchedule': async function (e) {
            console.log('clickSchedule', e);
            updateScheduleEvent = e.schedule;
            $('.tui-full-calendar-section-button').delegate(".tui-full-calendar-popup-edit", "click", function () {
                $('#click_schedule_dropdown').modal('show');

                //讓編輯委刊單的cal預設選項和stlye為原來選擇的calendar
                let thisScheduleCalendarName = $('.dropdown_calendar_ul>li[getChooseCalId=' + updateScheduleEvent.calendarId + ']').attr('value');
                $('.dropdown_getCalBtn').html(`<span class="calListStyle"></span>  <div class="dropDownName">` + thisScheduleCalendarName + `</div><i class="calendar-icon tui-full-calendar-dropdown-arrow"></i>`)
                $('.dropdown_getCalBtn > span').attr('style', $('.dropdown_calendar_ul>li[getChooseCalId=' + updateScheduleEvent.calendarId + ']').children().attr('style'))
                $('.dropdown_getCalBtn').attr('thisCalId', updateScheduleEvent.calendarId)
                //讓編輯委刊單的order預設選項和stlye為原來選擇的order
                $('.dropdown_getOrderBtn').html('<span class="dropDownName">' + updateScheduleEvent.title + '</span><i class="calendar-icon tui-full-calendar-dropdown-arrow"></i>')
                $('.dropdown_getOrderBtn').attr('thisCalId', $('.dropdown_getOrderUl>li[value=' + updateScheduleEvent.title + ']').attr('getChooseOrderId'))
                $('.dropdown_getOrderBtn').attr('thisOrderTitle', updateScheduleEvent.title)

                editScheduleId = updateScheduleEvent.id
                editCalendarId = updateScheduleEvent.calendarId
            })
            
        },
        'beforeCreateSchedule': function (e) {       //建立新的scedule
            console.log('beforeCreateSchedule', e);
            //改成客製化的 modal 表單
            $('#custom_create_schedule').modal('show');
            createScheduleEvent = e;
            e.guide.clearGuideElement();
        },
        'beforeUpdateSchedule': async function (e) {
            var schedule = e.schedule;
            var changes = e.changes;
            updateChangeTime = e.changes;
            console.log('beforeUpdateSchedule', e);

            if (changes && !changes.isAllDay && schedule.category === 'allday') {
                changes.category = 'time';
            }

            let updateCalendarId = changes?.calendarId ?? schedule.calendarId
            let updateStart = moment(changes?.start?._date ?? schedule.start._date).format('YYYY-MM-DD HH:mm:ss')
            let updateEnd = moment(changes?.end?._date ?? schedule.end._date).format('YYYY-MM-DD HH:mm:ss')

            socket.emit('update schedule', schedule.id, schedule.calendarId, updateChangeTime, channel);
            cal.updateSchedule(schedule.id, schedule.calendarId, changes);

            await fetch('/ch/beforeUpdateScheduleTime', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "changes": changes,
                    "scheduleId": schedule.id,
                    "updateCalendarId": updateCalendarId,
                    "updateStart": updateStart,
                    "updateEnd": updateEnd,
                })
            }).then(res => res.json()).then((jsonData) => {
                return 0;
            })
            refreshScheduleVisibility();
        },
        'beforeDeleteSchedule': async function (e) {
            console.log('beforeDeleteSchedule', e);
            let isDel = confirm('確定刪除?')
            if (isDel) {
                
                await fetch('/ch/beforeDeleteSchedule', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "deleteId": e.schedule.id,
                    })
                }).then(res => res.json()).then((jsonData) => {
                    
                    return 0;
                })
                socket.emit('delete schedule', e.schedule.id, e.schedule.calendarId, channel);
                cal.deleteSchedule(e.schedule.id, e.schedule.calendarId);
            }
        },
        'clickTimezonesCollapseBtn': function (timezonesCollapsed) {
            if (timezonesCollapsed) {
                cal.setTheme({
                    'week.daygridLeft.width': '77px',
                    'week.timegridLeft.width': '77px'
                });
            } else {
                cal.setTheme({
                    'week.daygridLeft.width': '60px',
                    'week.timegridLeft.width': '60px'
                });
            }
            return true;
        }
    });

    //custom-edit-schedule-event
    $('.schedule_edit_btn').click(async function () {
        console.log('click schedule edit btn');
        let changes = {
            title: $('.dropdown_getOrderBtn').attr('thisordertitle'),
            calendarId: $('.dropdown_getCalBtn').attr('thiscalid'),
            body: {
            },
            state: "Busy"
        }
        socket.emit('update schedule', updateScheduleEvent.id, updateScheduleEvent.calendarId, changes, channel);
        cal.updateSchedule(updateScheduleEvent.id, updateScheduleEvent.calendarId, changes);
        await fetch('/ch/beforeUpdateSchedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "changes": changes,
                "scheduleId": updateScheduleEvent.id,
            })
        }).then(res => res.json()).then((jsonData) => {
            console.log(jsonData);
        })
    })

    //customTime-create-schedule
    $('#btn-new-schedule').click(function () {
        $('#customerTime_create_schedule_dropdown').modal('show');
    })
    $('#create_customTime_scedule').click(function () {
        let calId = $('.dropdown_getCalendarList_button').attr('thisCalId')
        let orderId = $('.dropdown_getOrderBtn').attr('thisorderid')
        let orderTitle = $('.dropdown_getOrderBtn').attr('thisOrderTitle')
        let customTime = $('#customer_schedule_time').val()
        let startTime = moment(customTime.split(' - ')[0]).valueOf()
        let endTime = moment(customTime.split(' - ')[1]).valueOf()

        if (moment(startTime).isBefore(moment(new Date()))) {
            alert('不能預約今天以前的委刊單')
        } else {
            customerSaveNewSchedule(createScheduleEvent, calId, orderTitle, orderId, moment(startTime).format(), moment(endTime).format())
        }
    })
    //custom-create-schedule-event
    $('#create_scedule').click(function () {
        let calId = $('.dropdown_getCalendarList_button').attr('thisCalId')
        let orderId = $('.dropdown_getOrderBtn').attr('thisorderid')
        let orderTitle = $('.dropdown_getOrderBtn').attr('thisOrderTitle')

        if (moment(moment(createScheduleEvent.start._date).format()).isBefore(moment(new Date()))) {
            alert('不能預約今天以前的委刊單')
        }else{
            customerSaveNewSchedule(createScheduleEvent, calId, orderTitle, orderId, moment(createScheduleEvent.start._date).format(), moment(createScheduleEvent.end._date).format())
        }
    })
    async function customerSaveNewSchedule(createScheduleEvent, calId, orderTitle, orderId, start, end) {
        var schedule = {
            id: String(Date.now()),
            calendarId: String(calId),
            title: orderTitle,
            isAllDay: true,
            start: start,
            end: end,
            category: 'allday',
            orderId: orderId
        };
        console.log(schedule);
        await fetch('/ch/checkPositionRotation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "calendarId": schedule.calendarId,
            })
        }).then(res => res.json()).then((checkPositionRotation) => {
            if (checkPositionRotation.rotationOverflow == '-1') {
                alert('輪替數超過')
            } else {
                socket.emit('create schedule', [schedule], channel);
                cal.createSchedules([schedule]);
                beforeCreateSchedule(createScheduleEvent, schedule)
            }
        })
    }

    async function beforeCreateSchedule(e, schedule) {
        await fetch('/ch/beforeCreateSchedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "id": schedule.id,
                "calendarId": schedule.calendarId,
                "title": schedule.title,
                "isAllDay": 1,
                "start": schedule.start,
                "end": schedule.end,
                "category": schedule.category,
                "dueDateClass": e.dueDateClass,
                "state": 1,
                "channel": channel,
                "orderId": schedule.orderId
            })
        }).then(res => res.json()).then((beforeCreateScheduleRes) => {
            console.log(beforeCreateScheduleRes);
        })
    }


    //底下都是原套件 default function

    /**
     * Get time template for time and all-day
     * @param {Schedule} schedule - schedule
     * @param {boolean} isAllDay - isAllDay or hasMultiDates
     * @returns {string}
     */
    function getTimeTemplate(schedule, isAllDay) {
        var html = [];
        var start = moment(schedule.start.toUTCString());
        if (!isAllDay) {
            html.push('<strong>' + start.format('HH:mm') + '</strong> ');
        }
        if (schedule.isPrivate) {
            html.push('<span class="calendar-font-icon ic-lock-b"></span>');
            html.push(' Private');
        } else {
            if (schedule.isReadOnly) {
                html.push('<span class="calendar-font-icon ic-readonly-b"></span>');
            } else if (schedule.recurrenceRule) {
                html.push('<span class="calendar-font-icon ic-repeat-b"></span>');
            } else if (schedule.attendees.length) {
                html.push('<span class="calendar-font-icon ic-user-b"></span>');
            } else if (schedule.location) {
                html.push('<span class="calendar-font-icon ic-location-b"></span>');
            }
            html.push(' ' + schedule.title);
        }

        return html.join('');
    }

    /**
     * A listener for click the menu
     * @param {Event} e - click event
     */
    function onClickMenu(e) {
        var target = $(e.target).closest('a[role="menuitem"]')[0];
        var action = getDataAction(target);
        var options = cal.getOptions();
        var viewName = '';
        switch (action) {
            case 'toggle-daily':
                viewName = 'day';
                break;
            case 'toggle-weekly':
                viewName = 'week';
                break;
            case 'toggle-monthly':
                options.month.visibleWeeksCount = 0;
                viewName = 'month';
                break;
            case 'toggle-weeks2':
                options.month.visibleWeeksCount = 2;
                viewName = 'month';
                break;
            case 'toggle-weeks3':
                options.month.visibleWeeksCount = 3;
                viewName = 'month';
                break;
            case 'toggle-narrow-weekend':
                options.month.narrowWeekend = !options.month.narrowWeekend;
                options.week.narrowWeekend = !options.week.narrowWeekend;
                viewName = cal.getViewName();

                target.querySelector('input').checked = options.month.narrowWeekend;
                break;
            case 'toggle-start-day-1':
                options.month.startDayOfWeek = options.month.startDayOfWeek ? 0 : 1;
                options.week.startDayOfWeek = options.week.startDayOfWeek ? 0 : 1;
                viewName = cal.getViewName();

                target.querySelector('input').checked = options.month.startDayOfWeek;
                break;
            case 'toggle-workweek':
                options.month.workweek = !options.month.workweek;
                options.week.workweek = !options.week.workweek;
                viewName = cal.getViewName();

                target.querySelector('input').checked = !options.month.workweek;
                break;
            default:
                break;
        }

        cal.setOptions(options, true);
        cal.changeView(viewName, true);

        setDropdownCalendarType();
        setRenderRangeText();
        // setSchedules();
    }

    function onClickNavi(e) {
        var action = getDataAction(e.target);

        switch (action) {
            case 'move-prev':
                cal.prev();
                break;
            case 'move-next':
                cal.next();
                break;
            case 'move-today':
                cal.today();
                break;
            default:
                return;
        }

        setRenderRangeText();
        setSchedules();
    }

    function onNewSchedule() {
        var title = $('#new-schedule-title').val();
        var location = $('#new-schedule-location').val();
        var isAllDay = document.getElementById('new-schedule-allday').checked;
        var start = datePicker.getStartDate();
        var end = datePicker.getEndDate();
        var calendar = selectedCalendar ? selectedCalendar : CalendarList[0];
        if (!title) {
            return;
        }

        cal.createSchedules([{
            id: String(chance.guid()),
            calendarId: calendar.id,
            title: title,
            isAllDay: isAllDay,
            start: start,
            end: end,
            category: isAllDay ? 'allday' : 'time',
            dueDateClass: '',
            color: calendar.color,
            bgColor: calendar.bgColor,
            dragBgColor: calendar.bgColor,
            borderColor: calendar.borderColor,
            raw: {
                location: location
            },
            state: 'Busy'
        }]);

        $('#modal-new-schedule').modal('hide');
    }

    function onChangeNewScheduleCalendar(e) {
        var target = $(e.target).closest('a[role="menuitem"]')[0];
        var calendarId = getDataAction(target);
        changeNewScheduleCalendar(calendarId);
    }

    function changeNewScheduleCalendar(calendarId) {
        var calendarNameElement = document.getElementById('calendarName');
        var calendar = findCalendar(calendarId);
        var html = [];

        html.push('<span class="calendar-bar" style="background-color: ' + calendar.bgColor + '; border-color:' + calendar.borderColor + ';"></span>');
        html.push('<span class="calendar-name">' + calendar.name + '</span>');

        calendarNameElement.innerHTML = html.join('');

        selectedCalendar = calendar;
    }

    function createNewSchedule(event) {
        var start = event.start ? new Date(event.start.getTime()) : new Date();
        var end = event.end ? new Date(event.end.getTime()) : moment().add(1, 'hours').toDate();

        if (useCreationPopup) {
            cal.openCreationPopup({
                start: start,
                end: end
            });
        }
    }

    function onChangeCalendars(e) {
        var calendarId = e.target.value;
        var checked = e.target.checked;
        var viewAll = document.querySelector('.lnb-calendars-item input');
        var calendarElements = Array.prototype.slice.call(document.querySelectorAll('#calendarList input'));
        var allCheckedCalendars = true;

        if (calendarId === 'all') {
            allCheckedCalendars = checked;

            calendarElements.forEach(function (input) {
                var span = input.parentNode;
                input.checked = checked;
                span.style.backgroundColor = checked ? span.style.borderColor : 'transparent';
            });

            CalendarList.forEach(function (calendar) {
                calendar.checked = checked;
            });
        } else {
            findCalendar(calendarId).checked = checked;

            allCheckedCalendars = calendarElements.every(function (input) {
                return input.checked;
            });

            if (allCheckedCalendars) {
                viewAll.checked = true;
            } else {
                viewAll.checked = false;
            }
        }

        refreshScheduleVisibility();
    }

    function refreshScheduleVisibility() {
        var calendarElements = Array.prototype.slice.call(document.querySelectorAll('#calendarList input'));

        CalendarList.forEach(function (calendar) {
            cal.toggleSchedules(calendar.id, !calendar.checked, false);
        });

        cal.render(true);

        calendarElements.forEach(function (input) {
            var span = input.nextElementSibling;
            span.style.backgroundColor = input.checked ? span.style.borderColor : 'transparent';
        });
    }

    function setDropdownCalendarType() {
        var calendarTypeName = document.getElementById('calendarTypeName');
        var calendarTypeIcon = document.getElementById('calendarTypeIcon');
        var options = cal.getOptions();
        var type = cal.getViewName();
        var iconClassName;

        if (type === 'day') {
            type = 'Daily';
            iconClassName = 'calendar-icon ic_view_day';
        } else if (type === 'week') {
            type = 'Weekly';
            iconClassName = 'calendar-icon ic_view_week';
        } else if (options.month.visibleWeeksCount === 2) {
            type = '2 weeks';
            iconClassName = 'calendar-icon ic_view_week';
        } else if (options.month.visibleWeeksCount === 3) {
            type = '3 weeks';
            iconClassName = 'calendar-icon ic_view_week';
        } else {
            type = 'Monthly';
            iconClassName = 'calendar-icon ic_view_month';
        }

        calendarTypeName.innerHTML = type;
        calendarTypeIcon.className = iconClassName;
    }

    function currentCalendarDate(format) {
        var currentDate = moment([cal.getDate().getFullYear(), cal.getDate().getMonth(), cal.getDate().getDate()]);

        return currentDate.format(format);
    }

    function setRenderRangeText() {
        var renderRange = document.getElementById('renderRange');
        var options = cal.getOptions();
        var viewName = cal.getViewName();

        var html = [];
        if (viewName === 'day') {
            html.push(currentCalendarDate('YYYY.MM.DD'));
        } else if (viewName === 'month' &&
            (!options.month.visibleWeeksCount || options.month.visibleWeeksCount > 4)) {
            html.push(currentCalendarDate('YYYY.MM'));
        } else {
            html.push(moment(cal.getDateRangeStart().getTime()).format('YYYY.MM.DD'));
            html.push(' ~ ');
            html.push(moment(cal.getDateRangeEnd().getTime()).format(' MM.DD'));
        }
        renderRange.innerHTML = html.join('');
    }

    function setSchedules() {
        refreshScheduleVisibility();
    }

    function setEventListener() {
        $('#menu-navi').on('click', onClickNavi);
        $('.dropdown-menu a[role="menuitem"]').on('click', onClickMenu);
        $('#lnb-calendars').on('change', onChangeCalendars);

        $('#btn-save-schedule').on('click', onNewSchedule);
        $('#btn-new-schedule').on('click', createNewSchedule);

        $('#dropdownMenu-calendars-list').on('click', onChangeNewScheduleCalendar);

        window.addEventListener('resize', resizeThrottled);
    }

    function getDataAction(target) {
        return target.dataset ? target.dataset.action : target.getAttribute('data-action');
    }

    resizeThrottled = tui.util.throttle(function () {
        cal.render();
    }, 50);

    window.cal = cal;

    setDropdownCalendarType();
    setRenderRangeText();
    setSchedules();
    setEventListener();
})(window, tui.Calendar);

// set calendars
(function () {
    var calendarList = document.getElementById('calendarList');
    var html = [];
    CalendarList.forEach(function (calendar) {
        html.push('<div class="lnb-calendars-item"><label>' +
            '<input type="checkbox" class="tui-full-calendar-checkbox-round" value="' + calendar.id + '" checked>' +
            '<span style="border-color: ' + calendar.borderColor + '; background-color: ' + calendar.borderColor + ';"></span>' +
            '<span>' + calendar.name + '</span>' +
            '</label></div>'
        );
    });
    calendarList.innerHTML = html.join('\n');
})();
