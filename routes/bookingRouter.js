import mysql from './mysqlConnect';
import express from 'express';
import moment from 'moment';
import fs from 'fs';
import md5 from 'md5';
import { exec } from 'child_process';

/**
 * calendar的相關API
 * booking.linxnote.club/ch/url  -> 會導到相關的頻道calendar頁面
 * get('/')                     : 登入頁。
 * get('/logout')               : 登出。
 * post('/')                    : 登入帳密判斷，建立使用者session、根據權限讓初始頁限制瀏覽。
 * get('/order')                : order.ejs、判斷權限限制瀏覽。
 * get('/order-add')            : order-add.ejs。
 * get('/orderReserve')         : orderReserve.ejs、同時嵌入calendar。
 * post('/getOrder')            : 取得委刊單、判斷權限限制瀏覽。
 * post('/detail_order')        : 會顯示 委刊單被哪些頻道和廣告版位使用，以及委刊單和客戶的詳細資料。
 * post('/update_order')        : 編輯委刊單，order名稱改變時schedule名稱跟著改變；order停用時schedule跟著停用。
 * post('/create_order')        : create order.
 * post('/delete_order')        : delete order & delete schedule.
 * post('/delete_order')        : update schedule title、calendarId
 * 
 * get('/position')             : position.ejs
 * get('/position-add')         : position-add.ejs
 * post('/getPosition')         : 取得所有廣告版位，計算廣告被確定委刊綁定的次數。
 * post('/update_position')     : update position，停用時相關的schedule跟著停用；當廣告被移到別的頻道，schedule跟著移動。
 * post('/create_position')     : create postion
 * post('/delete_position')     : delete position ；刪除相關的schedule。
 * 
 * get('/customer')             : customer.ejs，判斷權限限制瀏覽。
 * get('/customer-add')         : customer-add.ejs，判斷權限限制瀏覽。
 * post('/getCustomer')         : 取得客戶資料
 * post('/renderCustomer')      : 建立委刊單時會render 客戶資料的select
 * post('/detail_customer')     : detail customer
 * post('/update_customer')     : update customer
 * post('/create_customer')     : create customer
 * post('/delete_customer')     : delete cusomter
 * 
 * get('/channel')              : channel.ejs
 * get('/channel-add')          : channel-add.ejs
 * post('/getChannel')          : render channel ，計算頻道下有幾個廣告版位
 * post('/renderChannel')       : 建立廣告版位時要選擇綁定的頻道
 * post('/update_channel')      : update channel ，頻道停用相關的廣告、schedule跟著停用；頻道名稱改變時，calendar_list的channelName跟著改變。
 * post('/create_channel')      : create channel
 * post('/delete_position')     : delete channel
 * 
 * get('/privilege')            : privilege.ejs
 * get('/privilege-add')        : privilege-add.ejs
 * post('/getPrivilege')        : render privilege ；計算每個業務的確定委刊數。
 * post('/delete_account')      : delete account
 * post('/create_account')      : create account
 */

 savingLog()
 async function savingLog() {
     fs.access('/var/log/bookinguserLoginTrace.log', fs.F_OK, (err) => {
         if(err){
             fs.appendFileSync('/var/log/bookinguserLoginTrace.log','')
         }
     })
 }

let router = express.Router();
router.get('/', function (req, res) {
    let title = 'NOW Booking '
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    res.render('login', {
        today,
        title
    });
});
router.get('/logout', function (req, res) {
    req.session.destroy(function () {
        res.render('logout', {});
    })
});
router.post('/', async function (req, res) {
    let title = 'NOW Booking'
    let loginTime = new moment().format('YYYY-MM-DD HH:mm:ss')
    let account = req.body.account
    let pwd = md5(req.body.password)

    let accountCheckSql = 'SELECT account,name,type FROM sale_booking.user WHERE account = ? AND password = ?'
    let accountCheckData = [account, pwd]
    let isAccountExists = await mysql.query(accountCheckSql, accountCheckData)
    if (isAccountExists[0] != '') {
        let userAccount = isAccountExists[0][0].account;
        let userName = isAccountExists[0][0].name;
        let userType = isAccountExists[0][0].type;

        console.log(loginTime + " " + userName + " 已登入 Type: " + userType)
        let userLoginTrace = loginTime + " " + userName + "已登入 Type: " + userType + "\n"
        fs.appendFile('/var/log/bookinguserLoginTrace.log', userLoginTrace, function (error) {
            if (error) console.log(error)
        })

        let superuserInvisible = '';
        let userInvisible = '';
        //不同權限的隱藏屬性
        switch (userType.toString()) {
            case 'SuperUser':
                superuserInvisible = 'd-none'
                break;
            case 'User':
                userInvisible = 'd-none'
                break;
        }
        let user = {
            account: userAccount,
            name: userName,
            type: userType,
        }
        req.session.user = user;

        res.render('order', {
            title,
            userName,
            userType,
            userInvisible,
            superuserInvisible
        });
    } else {
        title = '密碼錯誤，請重新輸入。'
        res.render('login', {
            title
        })
    }
})

router.get('/order', function (req, res) {
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let userType = req.session.user.type
        let userName = req.session.user.name
        let userInvisible = ''
        let superuserInvisible = ''
        //不同權限的隱藏屬性
        switch (userType.toString()) {
            case 'SuperUser':
                superuserInvisible = 'd-none'
                break;
            case 'User':
                userInvisible = 'd-none'
                break;
        }

        res.render('order', {
            title,
            userName,
            userType,
            userInvisible,
            superuserInvisible
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/order-add', function (req, res) {
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let userName = req.session.user.name

        res.render('order-add', {
            title,
            userName
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/orderReserve', async function (req, res) {
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let userName = req.session.user.name
        let userType = req.session.user.type
        let userInvisible = ''
        let superuserInvisible = ''
        //不同權限的隱藏屬性
        switch (userType.toString()) {
            case 'SuperUser':
                superuserInvisible = 'd-none'
                break;
            case 'User':
                userInvisible = 'd-none'
                break;
        }
        res.render('orderReserve', {
            title,
            userName,
            userType,
            userInvisible,
            superuserInvisible
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

//在後台 委刊單 停用、啟用都會顯示
router.post('/getOrder', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let renderOrderCondition = ''
        //判斷權限是user 就多一個 where條件
        if (req.session.user.type == 'User') {
            let account = req.session.user.account;
            renderOrderCondition = ' WHERE create_by = "' + account + '"'
        }
        let getOrderSql = 'SELECT id,advertisers,customerName,customer_company,title,ad_type,salesperson,start_time,end_time,memo,status,create_by FROM sale_booking.order_list ' + renderOrderCondition + ' ORDER BY id'
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

router.post('/detail_order', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let editId = req.body.editId;

        //撈出該委刊單被哪些廣告版位和頻道使用
        let getDetailOrderPositionSql = 'SELECT `calendar_list`.`name`,channelName,channelDomain,start,end FROM sale_booking.`schedule_event` INNER JOIN sale_booking.`calendar_list` ON `calendar_list`.`id` = `schedule_event`.`calendarId` WHERE orderId = ?'
        let getDetailOrderPositionData = [editId]
        let getDetailPositionData = await mysql.query(getDetailOrderPositionSql, getDetailOrderPositionData)

        //撈出該委刊單的客戶詳細資料
        let getOrderCustomerId = await mysql.query('SELECT `customerId` FROM sale_booking.order_list WHERE id = ?', editId)
        let getDetailOrderCustomerSql = 'SELECT `code`,`name`,`contacts`,`phone`,`email`,`postal_code`,`address`,`tax_id`,`payment_terms`,`sale_name`,`memo` FROM sale_booking.`customer` WHERE id = ?'
        let getDetailOrderCustomerData = [getOrderCustomerId[0][0].customerId]
        let getDetailCustomerData = await mysql.query(getDetailOrderCustomerSql, getDetailOrderCustomerData)

        //撈出委刊單詳細資料
        let getDetailOrderListSql = 'SELECT id, title, advertisers, customer_company, customer_company, ad_type, salesperson, memo, create_by FROM sale_booking.order_list WHERE id = ?'
        let getDetailOrderListData = [editId]
        let getDetailOrderList = await mysql.query(getDetailOrderListSql, getDetailOrderListData)

        res.send(JSON.stringify({
            'getDetailCustomerData': getDetailCustomerData[0],
            'getDetailPositionData': getDetailPositionData[0],
            'getDetailOrderList': getDetailOrderList[0]
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/update_order', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let orderId = req.body.orderId,
            advertisers = req.body.advertisers,
            customer = req.body.customer,
            customer_company = req.body.customer_company,
            schedule_time = req.body.schedule_time.split('~'),
            schedule_start = schedule_time[0].replace(' ', ''),
            schedule_end = schedule_time[1].replace(' ', ''),
            title = req.body.name,
            ad_type = req.body.ad_type,
            salesperson = req.body.salesperson,
            memo = req.body.memo,
            status = req.body.status,
            update_date = new moment().format('YYYY-MM-DD HH:mm:ss'),
            update_by = req.session.user.account;

        let updateOrderSql = 'UPDATE sale_booking.order_list SET customerName=?, advertisers=?, customer_company=?, title=?, ad_type=?, salesperson=?, start_time=?, end_time=?,  memo=?, status=?, update_date=?, update_by=? WHERE id=?'
        let updateOrderData = [customer, advertisers, customer_company, title, ad_type, salesperson, moment(schedule_start).format('YYYY-MM-DD HH:mm:ss'), moment(schedule_end).format('YYYY-MM-DD HH:mm:ss'), memo, status, update_date, update_by, orderId]
        await mysql.query(updateOrderSql, updateOrderData)

        //當委刊單活動名稱改變時，schedule的title跟著改變
        let updateScheduleTitleSql = 'UPDATE sale_booking.schedule_event SET title=? where orderId=?'
        let updateScheduleTitleData = [title, orderId]
        await mysql.query(updateScheduleTitleSql, updateScheduleTitleData)

        //當委刊單停用時 schedule跟著停用
        let updateOrderScheduleSql = 'UPDATE sale_booking.schedule_event SET status=? where orderId=?'
        let updateOrderScheduleData = [status, orderId]
        await mysql.query(updateOrderScheduleSql, updateOrderScheduleData)

        console.log(update_date + " " + req.session.user.account + " updateOrder: " + updateOrderData)
        let userLoginTrace = update_date + " " + req.session.user.account + " updateOrder: " + updateOrderData + "\n"
        fs.appendFile('/var/log/bookinguserLoginTrace.log', userLoginTrace, function (error) {
            if (error) console.log(error)
        })

        res.redirect('/order')
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/create_order', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let name = req.body.name,
            advertisers = req.body.advertisers,
            customer_company = req.body.customer_company,
            salesperson = req.body.salesperson,
            ad_type = req.body.ad_type,
            memo = req.body.memo,
            customer = req.body.customer;
        let schedule_time = req.body.schedule_time.split('-');
        let schedule_start = schedule_time[0].replace(' ', '')
        let schedule_end = schedule_time[1].replace(' ', '')
        let account = req.session.user.account;
        let createTime = new moment().format('YYYY-MM-DD HH:mm:ss')

        let createOrderSql = 'INSERT INTO sale_booking.`order_list` (`customerId`,`customerName`,`title`, `advertisers`, `customer_company`, `salesperson`, `start_time`, `end_time`, `ad_type`,`memo`,`create_date`, `create_by`, `update_date`, `update_by`) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        let createOrderData = [customer.split('&&')[0], customer.split('&&')[1], name, advertisers, customer_company, salesperson, moment(schedule_start, 'MM-DD-YYYY').format('YYYY-MM-DD'), moment(schedule_end, 'MM-DD-YYYY').format('YYYY-MM-DD'), ad_type, memo, createTime, account, createTime, account]
        await mysql.query(createOrderSql, createOrderData)

        console.log(req.session.user.name + ' create name ' + name);
        fs.appendFile('/var/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' create order ' + name + '\n', function (error) {
            if (error) console.log(error)
        })

        res.redirect('/order')
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/delete_order', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let delId = req.body.delId;
        let deleteOrderSql = 'DELETE FROM sale_booking.`order_list` WHERE id = ?'
        let deleteOrderData = [delId]
        await mysql.query(deleteOrderSql, deleteOrderData)

        //刪除相關的 schedule
        // let deleteOrderScheduleSql = 'DELETE sale_booking.schedule_event FROM sale_booking.`schedule_event` INNER JOIN sale_booking.`order_list` ON `order_list`.`id` = `schedule_event`.`orderId` WHERE schedule_event.orderId = ?'
        let deleteOrderScheduleSql = 'DELETE FROM sale_booking.schedule_event WHERE orderId = ?'
        let deleteOrderScheduleData = [delId]
        await mysql.query(deleteOrderScheduleSql, deleteOrderScheduleData)

        fs.appendFile('/var/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' delete order ' + delId + '\n', function (error) {
            if (error) console.log(error)
        })
        console.log(req.session.user.name + ' delete order ' + delId);

        res.send(JSON.stringify({
            'Delete Order': "成功",
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/position', function (req, res) {
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let userType = req.session.user.type
        let userName = req.session.user.name
        let superUserInvisible = ''
        if (userType == 'SuperUser') superUserInvisible = 'd-none'

        res.render('position', {
            title,
            userName,
            userType,
            superUserInvisible
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/position-add', function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let userName = req.session.user.name

        res.render('position-add', {
            title,
            userName
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/getPosition', async function (req, res) {
    if (req.session.user != undefined && (req.session.user.type == 'Admin' || req.session.user.type == 'SuperUser')) {
        //要取得該廣告版位的確定委刊數
        //取得每個schedule關聯order的status=2的總個數組成陣列.

        let getCalendarIdNumbersSql = 'SELECT * FROM sale_booking.`order_list` INNER JOIN sale_booking.`schedule_event` ON `order_list`.`id` = `schedule_event`.`orderId` WHERE `order_list`.status = 2'
        let getCalendarId = await mysql.query(getCalendarIdNumbersSql)
        let calendarId = getCalendarId[0].map(e => {
            return e.calendarId
        })

        //加總重複calendarId個數 ex. calA:1 calB:3 calC:4
        let eachCalendarIdNumbers = {};
        calendarId.forEach(function (item) {
            eachCalendarIdNumbers[item] = eachCalendarIdNumbers[item] ? eachCalendarIdNumbers[item] + 1 : 1;
        });

        //先撈出 channelId 再去要該channel的名稱
        let getPositionSql = 'SELECT id,name,channelId,channelName,channelDomain,bgColor,rotation,memo,status FROM sale_booking.calendar_list ORDER BY channelName'
        let allPosition = await mysql.query(getPositionSql)

        //如果該頻道沒廣告則該索引=0
        let eachCalendarIdNumbersArray = allPosition[0].map(e => {
            if (eachCalendarIdNumbers[e.id] == undefined) eachCalendarIdNumbers[e.id] = 0;
            return eachCalendarIdNumbers[e.id]
        })

        res.send(JSON.stringify({
            'allPosition': allPosition[0],
            'allCalendarIdNumbers': eachCalendarIdNumbersArray,
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/update_position', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let calId = req.body.calId,
            name = req.body.name,
            channel = req.body.channel,
            calendarBgColor = req.body.color,
            calendarDragBgColor = req.body.color,
            calendarBorderColor = req.body.color,
            rotation = req.body.rotation,
            memo = req.body.memo,
            status = req.body.status,
            update_date = new moment().format('YYYY-MM-DD HH:mm:ss'),
            update_by = req.session.user.account;

        //頻道停用啟用、相對應的schedule跟著停用啟用
        if (status == '0') {
            let updateScheduleSql = 'UPDATE sale_booking.schedule_event SET status=? WHERE calendarId=?'
            let updateScheduleData = [status, calId]
            await mysql.query(updateScheduleSql, updateScheduleData)
        } else {
            let updateScheduleSql = 'UPDATE sale_booking.schedule_event SET status=? WHERE calendarId=?'
            let updateScheduleData = [status, calId]
            await mysql.query(updateScheduleSql, updateScheduleData)
        }

        let updatePositionSql = 'UPDATE sale_booking.calendar_list SET name=?,channelId=?,channelName=?,channelDomain=?,bgcolor=?,dragbgcolor=?,bordercolor=?,rotation=?, memo=?, status=?, update_date=?, update_by=? WHERE id=?'
        let updatePositionData = [name, channel.split('&&')[0], channel.split('&&')[1], channel.split('&&')[2], calendarBgColor, calendarDragBgColor, calendarBorderColor, rotation, memo, status, update_date, update_by, calId]
        await mysql.query(updatePositionSql, updatePositionData)

        // 如果position更換頻道，相對應的calendar也要更換頻道
        let updateScheduleChannelIdSql = 'UPDATE sale_booking.schedule_event SET channelId=? WHERE calendarId=?'
        let updateScheduleChannelIdData = [channel.split('&&')[0], calId]
        await mysql.query(updateScheduleChannelIdSql, updateScheduleChannelIdData)

        console.log(update_date + " " + req.session.user.account + " updatePosition: " + updatePositionData)
        let userLoginTrace = update_date + " " + req.session.user.account + " updatePosition: " + updatePositionData + "\n"
        fs.appendFile('/var/log/bookinguserLoginTrace.log', userLoginTrace, function (error) {
            if (error) console.log(error)
        })

        res.redirect('/position')
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/create_position', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let id = String(Date.now()),
            channelId = req.body.channelId,
            name = req.body.name,
            color = '#ffffff',
            calendarBgColor = req.body.color,
            calendarDragBgColor = req.body.color,
            calendarBorderColor = req.body.color,
            rotation = req.body.rotation,
            memo = req.body.memo,
            status = req.body.status;
        let userName = req.session.user.name
        let createTime = new moment().format('YYYY-MM-DD HH:mm:ss')

        let createPositionSql = 'INSERT INTO sale_booking.`calendar_list` (`id`,`channelId`,`channelName`,`channelDomain`,`color`,`bgcolor`,`dragbgcolor`,`bordercolor`,`name`,`rotation`,`memo`,`status`,`create_date`, `create_by`, `update_date`, `update_by`) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        let createPositionData = [id, channelId.split('&&')[0], channelId.split('&&')[1], channelId.split('&&')[2], color, calendarBgColor, calendarDragBgColor, calendarBorderColor, name, rotation, memo, status, createTime, userName, createTime, userName]
        await mysql.query(createPositionSql, createPositionData)

        console.log(req.session.user.name + ' create position : ' + name);
        fs.appendFile('/var/log/bookinguserLoginTrace.log', createTime + " " + req.session.user.name + ' create position : ' + name + '\n', function (error) {
            if (error) console.log(error)
        })

        res.redirect('/position')
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/delete_position', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let delId = req.body.delId;

        let deletePostionSql = 'DELETE FROM sale_booking.`calendar_list` WHERE id = ?'
        let deletePostionData = [delId]
        await mysql.query(deletePostionSql, deletePostionData)

        //刪除該cal相關的schedule
        let updateScheduleSql = 'DELETE FROM sale_booking.schedule_event WHERE calendarId=?'
        let updateScheduleData = [delId]
        await mysql.query(updateScheduleSql, updateScheduleData)

        fs.appendFile('/var/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' delete postion ' + delId + '\n', function (error) {
            if (error) console.log(error)
        })
        console.log(req.session.user.name + ' delete postion ' + delId);

        res.send(JSON.stringify({
            'Delete Postion': "成功",
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/customer', function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let userType = req.session.user.type
        let userInvisible = ''
        if (userType == 'User') userInvisible = 'd-none'
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name

        res.render('customer', {
            today,
            title,
            userName,
            userType,
            userInvisible
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/customer-add', function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let idExist = '0'
        let userName = req.session.user.name
        res.render('customer-add', {
            idExist,
            userName
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/getCustomer', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let getCustomerSql = 'SELECT code,name,contacts,phone,email,sale_name,tax_id,postal_code,address,payment_terms,memo FROM sale_booking.customer ORDER BY code'
        let allCustomer = await mysql.query(getCustomerSql)
        res.send(JSON.stringify({
            'allCustomer': allCustomer[0],
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/renderCustomer', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let renderCustomerSql = "select id,name from sale_booking.customer"
        let allCustomer = await mysql.query(renderCustomerSql)

        res.send(JSON.stringify({
            'customer': allCustomer[0],
            'render customer': 'succeed',
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/detail_customer', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let delId = req.body.delId;

        let getDetailCustomerSql = 'SELECT code,name,contacts,phone,email,postal_code,address,tax_id,payment_terms,sale_name,memo FROM sale_booking.`customer` WHERE code = ?'
        let getDetailCustomerData = [delId]
        let getDetailData = await mysql.query(getDetailCustomerSql, getDetailCustomerData)

        res.send(JSON.stringify({
            'getDetailData': getDetailData[0]
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/update_customer', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let code = req.body.code,
            name = req.body.name,
            contacts = req.body.contacts,
            phone = req.body.phone,
            email = req.body.email,
            sale_name = req.body.sale_name,
            tax_id = req.body.tax_id,
            postal_code = req.body.postal_code,
            address = req.body.address,
            payment_terms = req.body.payment_terms,
            memo = req.body.memo,
            update_date = new moment().format('YYYY-MM-DD HH:mm:ss'),
            update_by = req.session.user.account;

        let updateCustomerSql = 'UPDATE sale_booking.customer SET name=?, contacts=?, phone=?, email=?, sale_name=?, tax_id=?, postal_code=?, address=?, payment_terms=?, memo=?, update_date=?, update_by=? WHERE code=?'
        let updateCustomerData = [name, contacts, phone, email, sale_name, tax_id, postal_code, address, payment_terms, memo, update_date, update_by, code]
        await mysql.query(updateCustomerSql, updateCustomerData)

        console.log(update_date + " " + req.session.user.account + " updateCustomer: " + updateCustomerData)
        let userLoginTrace = update_date + " " + req.session.user.account + " updateCustomer: " + updateCustomerData + "\n"
        fs.appendFile('/var/log/bookinguserLoginTrace.log', userLoginTrace, function (error) {
            if (error) console.log(error)
        })

        res.redirect('/customer')
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/create_customer', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let code = req.body.code,
            name = req.body.name,
            contacts = req.body.contacts,
            phone = req.body.phone,
            email = req.body.email,
            sale_name = req.body.sale_name,
            tax_id = req.body.tax_id,
            postal_code = req.body.postal_code,
            address = req.body.address,
            payment_terms = req.body.payment_terms,
            memo = req.body.memo;
        let userName = req.session.user.name
        let userType = req.session.user.type
        let createTime = new moment().format('YYYY-MM-DD HH:mm:ss')

        let idExist = await mysql.query('SELECT code FROM sale_booking.customer WHERE code = ?', code)
        if (idExist[0] == '') {
            let createCustomerSql = 'INSERT INTO sale_booking.`customer` (`code`, `name`, `contacts`, `phone`, `email`, `sale_name`,`tax_id`,`postal_code`,`address`,`payment_terms`,`memo`,`create_date`, `create_by`, `update_date`, `update_by`) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
            let createCustomerData = [code, name, contacts, phone, email, sale_name, tax_id, postal_code, address, payment_terms, memo, createTime, userName, createTime, userName]
            await mysql.query(createCustomerSql, createCustomerData)
            res.redirect('/customer')
        } else {
            idExist = '-1'
            res.render('customer-add', {
                idExist,
                userName,
                userType
            });
        }

        console.log(req.session.user.name + ' create customer ' + code);
        fs.appendFile('/var/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' create customer ' + code + '\n', function (error) {
            if (error) console.log(error)
        })

    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/delete_customer', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let delId = req.body.delId;

        let deleteCustomerSql = 'DELETE FROM sale_booking.`customer` WHERE code = ?'
        let deleteCustomerData = [delId]
        await mysql.query(deleteCustomerSql, deleteCustomerData)

        console.log(req.session.user.name + ' delete customer ' + delId);
        fs.appendFile('/var/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' delete customer ' + delId + '\n', function (error) {
            if (error) console.log(error)
        })

        res.send(JSON.stringify({
            'Delete Customer': "成功",
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/channel', function (req, res) {
    if (req.session.user != undefined) {
        let userType = req.session.user.type
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name
        let superUserInvisible = ''
        if (userType == 'SuperUser') superUserInvisible = 'd-none'

        res.render('channel', {
            today,
            title,
            userName,
            userType,
            superUserInvisible
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/channel-add', function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name
        let channelIsExist = ''

        res.render('channel-add', {
            today,
            title,
            userName,
            channelIsExist
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/getChannel', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined && (req.session.user.type == 'Admin' || req.session.user.type == 'SuperUser')) {
        //取得頻道組成陣列
        let getAdNumbersSql = 'SELECT channelId FROM sale_booking.`calendar_list` where status = 1 ORDER BY channelId'
        let getChannel = await mysql.query(getAdNumbersSql)
        let channel = getChannel[0].map(e => {
            return e.channelId
        })

        //加總重複channel個數 ex. www:1 babou:3 petsmao:4
        let eachChannelAdNumbers = {};
        channel.forEach(function (item) {
            eachChannelAdNumbers[item] = eachChannelAdNumbers[item] ? eachChannelAdNumbers[item] + 1 : 1;
        });

        //取得個頻道的廣告數
        let getChannelSql = 'SELECT link,name,domain,memo,status FROM sale_booking.channel ORDER BY link'
        let allChannel = await mysql.query(getChannelSql)

        //如果該頻道沒廣告則該索引=0
        let eachChannelAdNumbersArray = allChannel[0].map(e => {
            if (eachChannelAdNumbers[e.link] == undefined) eachChannelAdNumbers[e.link] = 0;
            return eachChannelAdNumbers[e.link]
        })
        res.send(JSON.stringify({
            'allChannel': allChannel[0],
            'allAdNumbers': eachChannelAdNumbersArray,
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/renderChannel', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let renderChannelSql = "select link,name,domain from sale_booking.channel where status = 1 order by link"
        let allChannel = await mysql.query(renderChannelSql)

        res.send(JSON.stringify({
            'channel': allChannel[0],
            'render channel': 'succeed',
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/update_channel', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let channelId = req.body.channelId,
            name = req.body.name,
            domain = req.body.domain,
            memo = req.body.memo,
            status = req.body.status,
            update_date = new moment().format('YYYY-MM-DD HH:mm:ss'),
            update_by = req.session.user.account;

        let updateChannelSql = 'UPDATE sale_booking.channel SET name=?, domain=?, memo=?, status=?, update_date=?, update_by=? WHERE link=?'
        let updateChannelData = [name, domain, memo, status, update_date, update_by, channelId]
        await mysql.query(updateChannelSql, updateChannelData)

        // 頻道名稱改變時，calendar_list 的頻道名也要跟著改變
        let updatePositionChannelNameSql = 'UPDATE sale_booking.calendar_list SET channelName=?, channelDomain=?, update_date=?, update_by=? WHERE channelId=?'
        let updatePositionChannelNameData = [name, domain, update_date, update_by, channelId]
        await mysql.query(updatePositionChannelNameSql, updatePositionChannelNameData)

        //頻道停用啟用、相對應的廣告版位、schedule跟著停用啟用
        if (status == '0') {
            let updateScheduleSql = 'UPDATE sale_booking.schedule_event SET status=? WHERE channelId=?'
            let updateScheduleData = [status, channelId]
            await mysql.query(updateScheduleSql, updateScheduleData)

            let updatePositionSql = 'UPDATE sale_booking.calendar_list SET status=? WHERE channelId=?'
            let updatePositionData = [status, channelId]
            await mysql.query(updatePositionSql, updatePositionData)
        } else {
            let updateScheduleSql = 'UPDATE sale_booking.schedule_event SET status=? WHERE channelId=?'
            let updateScheduleData = [status, channelId]
            await mysql.query(updateScheduleSql, updateScheduleData)

            let updatePositionSql = 'UPDATE sale_booking.calendar_list SET status=? WHERE channelId=?'
            let updatePositionData = [status, channelId]
            await mysql.query(updatePositionSql, updatePositionData)
        }

        console.log(update_date + " " + req.session.user.account + " updateChannel: " + updateChannelData)
        let userLoginTrace = update_date + " " + req.session.user.account + " updateChannel: " + updateChannelData + "\n"
        fs.appendFile('/var/log/bookinguserLoginTrace.log', userLoginTrace, function (error) {
            if (error) console.log(error)
        })

        res.redirect('/channel')
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/create_channel', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let link = String(Date.now());
        let userName = req.session.user.name
        let domain = req.body.domain;
        let name = req.body.name,
            memo = req.body.memo,
            status = req.body.status;
        req.session.channel = link;
        let createTime = new moment().format('YYYY-MM-DD HH:mm:ss')

        let createChannelSql = 'INSERT INTO sale_booking.`channel` (`link`,`name`,`domain`,`memo`,`status`, `create_date`, `create_by`, `update_date`, `update_by`) values (?,?,?,?,?,?,?,?,?)'
        let createChannelData = [link, name, domain, memo, status, createTime, userName, createTime, userName]
        await mysql.query(createChannelSql, createChannelData)

        fs.copyFile("/var/www/calendar/views/channel/www.ejs", "/var/www/calendar/views/channel/" + link + ".ejs", (err) => {
            if (err) {
                console.log("Error Found:", err);
            }
        });

        fs.appendFile('/var/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' create channel ' + name + '\n', function (error) {
            if (error) console.log(error)
        })
        console.log(req.session.user.name + ' create channel ' + name);

        res.redirect('/channel')
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/delete_channel', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let delId = req.body.delId;
        let deleteChannelSql = 'DELETE FROM sale_booking.`channel` WHERE link = ?'
        let deleteChannelData = [delId]
        await mysql.query(deleteChannelSql, deleteChannelData)

        let deletecalendarListFromThisChannelSql = 'DELETE FROM sale_booking.`calendar_list` WHERE channelId = ?'
        let deletecalendarListFromThisChannelData = [delId]
        await mysql.query(deletecalendarListFromThisChannelSql, deletecalendarListFromThisChannelData)

        let deleteScheduleListFromThisChannelSql = 'DELETE FROM sale_booking.`schedule_event` WHERE channelId = ?'
        let deleteScheduleListFromThisChannelData = [delId]
        await mysql.query(deleteScheduleListFromThisChannelSql, deleteScheduleListFromThisChannelData)

        console.log(req.session.user.name + ' delete channel ID : ' + delId);
        fs.appendFile('/var/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' delete channel ID : ' + delId + '\n', function (error) {
            if (error) console.log(error)
        })

        exec(`rm -rf /var/www/calendar/views/channel/` + delId + `.ejs`, (err) => {
            if (err) {
                return;
            }
        });
        res.send(JSON.stringify({
            'delete channel': "成功",
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/privilege', function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined && (req.session.user.type == 'Admin' || req.session.user.type == 'SuperUser')) {
        let title = 'NOW Booking '
        let userType = req.session.user.type
        let userName = req.session.user.name

        res.render('privilege', {
            title,
            userName,
            userType
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/privilege-add', function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        if (req.session.user.type != 'Admin') {
            let userType = req.session.user.type
            let userName = req.session.user.name

            res.render('privilege', {
                userType,
                userName
            });
        } else {
            let title = 'NOW Booking '
            let userName = req.session.user.name

            res.render('privilege-add', {
                title,
                userName
            });
        }
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/getPrivilege', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        //取得每個人建立的委刊數組成陣列
        let getAdNumbersSql = 'SELECT create_by FROM sale_booking.`order_list` ORDER BY create_by'
        let getOrderCreateBy = await mysql.query(getAdNumbersSql)
        let order = getOrderCreateBy[0].map(e => {
            return e.create_by
        })

        //加總重複channel個數 ex. userA:1 userB:3 userC:4
        let eachUserOrderNumbers = {};
        order.forEach(function (item) {
            eachUserOrderNumbers[item] = eachUserOrderNumbers[item] ? eachUserOrderNumbers[item] + 1 : 1;
        });
        let getAccountSql = 'SELECT name,account,email,type FROM sale_booking.user ORDER BY name'
        let allAccount = await mysql.query(getAccountSql)

        //如果該頻道沒廣告怎該索引=0
        let eachUserOrderNumbersArray = allAccount[0].map(e => {
            if (eachUserOrderNumbers[e.account] == undefined) eachUserOrderNumbers[e.account] = 0;
            return eachUserOrderNumbers[e.account]
        })
        res.send(JSON.stringify({
            'allAccount': allAccount[0],
            'allOrderNumbers': eachUserOrderNumbersArray
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/delete_account', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let delId = req.body.delId;
        let deleteAccountSql = 'DELETE FROM sale_booking.`user` WHERE account = ?'
        let deleteAccountData = [delId]
        await mysql.query(deleteAccountSql, deleteAccountData)

        fs.appendFile('/var/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' delete account : ' + delId + '\n', function (error) {
            if (error) console.log(error)
        })
        console.log(req.session.user.name + ' delete account : ' + delId);

        res.send(JSON.stringify({
            'delete Account': "成功",
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});
router.post('/create_account', async function (req, res) {
    //req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let account = req.body.account,
            password = req.body.password,
            type = req.body.type,
            name = req.body.name,
            email = req.body.email,
            memo = req.body.memo
        let userName = req.session.user.name
        let createTime = new moment().format('YYYY-MM-DD HH:mm:ss')
        let createAccountSql = 'INSERT INTO sale_booking.`user` (`account`, `password`, `type`, `name`, `email`, `memo`, `create_date`, `create_by`, `update_date`, `update_by`) values (?,?,?,?,?,?,?,?,?,?)'
        let createAccountData = [account, md5(password), type, name, email, memo, createTime, userName, createTime, userName]
        await mysql.query(createAccountSql, createAccountData)

        fs.appendFile('/var/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' create account : ' + account + '\n', function (error) {
            if (error) console.log(error)
        })
        console.log(req.session.user.name + ' create account : ' + account);

        res.redirect('/privilege')
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

export default router;