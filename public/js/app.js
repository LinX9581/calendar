'use strict';

/* eslint-disable */
/* eslint-env jquery */
/* global moment, tui, chance */
/* global findCalendar, CalendarList, ScheduleList */
var socket = io();

(async function (window, Calendar) {
    var cal, resizeThrottled;
    var useCreationPopup = false;
    var useDetailPopup = true;
    var datePicker, selectedCalendar;
    let scheduleEvent = '';
    let editScheduleId = '';
    let editCalendarId = '';

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

    // event handlers
    cal.on({
        'clickMore': function (e) {
            console.log('clickMore', e);
        },
        'clickSchedule': async function (e) {
            console.log('clickSchedule', e);
            $('.tui-full-calendar-popup-edit').click(async function () {
                let thisScheduleCalendarName = $('#detailEditCalendarList>li[getChooseCalId=' + e.schedule.calendarId + ']').text();
                $('.dropdown_getCalendarList_button').text(thisScheduleCalendarName);
                $('#click_schedule_dropdown').modal('show');
                $('#edit_title').val(e.schedule.title)
                $('#edit_time').text(moment(e.schedule.start._date).format('YYYY.MM.DD h:mm:ss') + '  ~  ' + moment(e.schedule.end._date).format('YYYY.MM.DD h:mm:ss'))
                $('#edit_advertisers').val(e.schedule.body.advertisers)
                $('#edit_customer_company').val(e.schedule.body.customer_company)
                $('#edit_salesperson').val(e.schedule.body.salesperson)
                $('#edit_ad_type').val(e.schedule.body.ad_type)
                $('#edit_memo').val(e.schedule.body.memo)

                editScheduleId = e.schedule.id
                editCalendarId = e.schedule.calendarId
            })
        },
        'clickDayname': function (date) {
            console.log('clickDayname', date);
        },
        'beforeCreateSchedule': function (e) {       //建立新的scedule
            console.log('beforeCreateSchedule', e);
            $('#create_schedule_dropdown').modal('show');
            scheduleEvent = e;
            e.guide.clearGuideElement();
            // saveNewSchedule(e);
        },
        'beforeUpdateSchedule': async function (e) {       //任何更新都會觸發
            var schedule = e.schedule;
            var changes = e.changes;
            console.log('beforeUpdateSchedule', e);

            if (changes && !changes.isAllDay && schedule.category === 'allday') {
                changes.category = 'time';
            }

            let updateCalendarId = changes?.calendarId ?? schedule.calendarId
            let updateTitle = changes?.title ?? schedule.title
            let updateLocation = changes?.location ?? schedule.location
            let updateStart = moment(changes?.start?._date ?? schedule.start._date).format('YYYY-MM-DD HH:mm:ss')
            let updateEnd = moment(changes?.end?._date ?? schedule.end._date).format('YYYY-MM-DD HH:mm:ss')
            socket.emit('update schedule', schedule.id, schedule.calendarId, changes, channel);
            cal.updateSchedule(schedule.id, schedule.calendarId, changes);

            await fetch('/ch/beforeUpdateSchedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "change": changes,
                    "scheduleId": schedule.id,
                    "updateCalendarId": updateCalendarId,
                    "updateTitle": updateTitle,
                    "updateLocation": updateLocation,
                    "updateStart": updateStart,
                    "updateEnd": updateEnd,
                    // "updateBorderColor": updateBorderColor,
                    // "updateBgColor": updateBgColor,
                    // "updateColor": updateColor,
                    // "updatedragBgColor": updatedragBgColor,
                })
            }).then(res => res.json()).then((jsonData) => {
                return 0;
            })
            refreshScheduleVisibility();
        },
        'beforeDeleteSchedule': async function (e) {
            console.log('beforeDeleteSchedule', e);
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
        },
        'afterRenderSchedule': function (e) {
            var schedule = e.schedule;
            // var element = cal.getElement(schedule.id, schedule.calendarId);
            // console.log('afterRenderSchedule', element);
        },
        'clickTimezonesCollapseBtn': function (timezonesCollapsed) {
            console.log('timezonesCollapsed', timezonesCollapsed);

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

    $('.schedule_edit_btn').click(async function () {
        let changes = {
            title: $('#edit_title').val(),
            calendarId: editCalendarId,
            body: {
                advertisers: $('#edit_advertisers').val(),
                customer_company: $('#edit_customer_company').val(),
                salesperson: $('#edit_salesperson').val(),
                ad_type: $('#edit_ad_type').val(),
                memo: $('#edit_memo').val(),
            },
            state: "Busy"
        }
        socket.emit('update schedule', editScheduleId, editCalendarId, changes, channel);
        cal.updateSchedule(editScheduleId, editCalendarId, changes);
        await fetch('/ch/beforeUpdateSchedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "changes": changes,
                "scheduleId": editScheduleId,
            })
        }).then(res => res.json()).then((jsonData) => {
            return 0;
        })

    })

    $('#create_scedule').click(function () {
        let calId = $('.dropdown_getCalendarList_button').attr('thisCalId')
        let activity = $('#activity').val();
        let advertisers = $('#advertisers').val();
        let customer_company = $('#customer_company').val();
        let salesperson = $('#salesperson').val();
        let ad_type = $('#ad_type').val();
        let memo = $('#memo').val();
        customerSaveNewSchedule(scheduleEvent, calId, activity, advertisers, customer_company, salesperson, ad_type, memo)
    })
    async function customerSaveNewSchedule(e, calId, activity, advertisers, customer_company, salesperson, ad_type, memo) {
        var schedule = {
            id: String(Date.now()),
            calendarId: String(calId),
            title: activity,
            body: {
                'activity': activity,
                'advertisers': advertisers,
                'customer_company': customer_company,
                'salesperson': salesperson,
                'ad_type': ad_type,
                'memo': memo,
            },
            isAllDay: true,
            start: e.start,
            end: e.end,
            category: 'allday'
        };
        socket.emit('create schedule', [schedule], channel);
        cal.createSchedules([schedule]);

        await fetch('/ch/beforeCreateSchedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "id": schedule.id,
                "calendarId": schedule.calendarId,
                "title": activity,
                "isAllDay": e.isAllDay,
                "start": schedule.start,
                "end": schedule.end,
                "category": schedule.category,
                "dueDateClass": e.dueDateClass,
                "state": e.state,
                "channel": channel,
                "scheduleBody": schedule.body,
                "advertisers": advertisers,
                "customer_company": customer_company,
                "salesperson": salesperson,
                "ad_type": ad_type,
                "memo": memo,
            })
        }).then(res => res.json()).then((beforeCreateScheduleRes) => {
            console.log(beforeCreateScheduleRes);
        })
        $('#activity').val('');
        $('#advertisers').val('');
        $('#customer_company').val('');
        $('#salesperson').val('');
        $('#ad_type').val('');
        $('#memo').val('');
    }

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
    async function saveNewSchedule(scheduleData) {
        var calendar = scheduleData.calendar || findCalendar(scheduleData.calendarId);
        var schedule = {
            id: String(chance.guid()),
            title: scheduleData.title,
            isAllDay: scheduleData.isAllDay,
            start: scheduleData.start,
            end: scheduleData.end,
            category: scheduleData.isAllDay ? 'allday' : 'time',
            dueDateClass: '',
            color: calendar.color,
            bgColor: calendar.bgColor,
            dragBgColor: calendar.bgColor,
            borderColor: calendar.borderColor,
            location: scheduleData.location,
            raw: {
                class: scheduleData.raw['class']
            },
            state: scheduleData.state
        };

        if (calendar) {
            schedule.calendarId = calendar.id;
            schedule.color = calendar.color;
            schedule.bgColor = calendar.bgColor;
            schedule.borderColor = calendar.borderColor;
        }
        console.log(channel + ' begin');
        await fetch('/ch/beforeCreateSchedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "id": schedule.id,
                "calendarId": schedule.calendarId,
                "title": schedule.title,
                "isAllDay": schedule.isAllDay,
                "start": schedule.start,
                "end": schedule.end,
                "category": schedule.category,
                "dueDateClass": schedule.dueDateClass,
                "state": schedule.state,
                "color": schedule.color,
                "bgColor": schedule.bgColor,
                "dragBgColor": schedule.dragBgColor,
                "borderColor": schedule.borderColor,
                "channel": channel,
            })
        }).then(res => res.json()).then((beforeCreateScheduleRes) => {
            console.log(beforeCreateScheduleRes);
        })
        socket.emit('create schedule', [schedule], channel);
        cal.createSchedules([schedule]);
        refreshScheduleVisibility();
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