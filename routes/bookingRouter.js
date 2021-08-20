import * as bookingApi from '../api/bookingApi'
import query from './mysqlConnect';
import express from 'express';
import moment from 'moment';
import fs from 'fs';
import md5 from 'md5';
import { exec } from 'child_process';

let user = {
    account: 'linx',
    name: 'linx',
    type: 'admin',
}


let router = express.Router();
router.get('/validate', function (req, res) {
    let title = 'NOW Booking '
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    res.render('validate', {
        today,
        title
    });
    console.log("validate connect")
});
router.get('/', function (req, res) {
    let title = 'NOW Booking '
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    res.render('login', {
        today,
        title
    });
    // console.log("sit connect")
});
router.get('/login', function (req, res) {
    req.session.destroy(function () {
        // res.redirect('/');
        res.render('logout', {});
    })
});
router.post('/', async function (req, res) {
    let title = 'NOW Booking'
    let loginTime = new moment().format('YYYY-MM-DD HH:mm:ss')
    let account = req.body.account
    let pwd = md5(req.body.password)
    console.log(pwd);
    let accountCheckSql = 'SELECT account,name,type FROM sale_booking.user WHERE account = ? AND password = ?'
    let accountCheckData = [account, pwd]
    let isAccountExists = await query(accountCheckSql, accountCheckData)
    if (isAccountExists != '') {
        let userAccount = isAccountExists[0].account;
        let userName = isAccountExists[0].name;
        let userType = isAccountExists[0].type;

        console.log(loginTime + " " + userName + " 已登入 Type: " + userType)
        let userLoginTrace = loginTime + " " + userName + "已登入 Type: " + userType + "\n"
        fs.appendFile('/var/test/log/bookinguserLoginTrace.log', userLoginTrace, function (error) {
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
        res.render('channel', {
            title,
            userName,
        });
    } else {
        title = '密碼錯誤，請重新輸入。'
        res.render('login', {
            title
        })
    }
})

router.get('/position', function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let userType = req.session.user.type
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name
        res.render('position', {
            today,
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

router.get('/position-add', function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name
        res.render('position-add', {
            today,
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
    req.session.user = user;
    if (req.session.user != undefined) {
        //取得頻道組成陣列
        let getCalendarIdNumbersSql = 'SELECT calendarId FROM sale_booking.`schedule_event` ORDER BY id'
        let getCalendarId = await query(getCalendarIdNumbersSql)
        let calendarId = getCalendarId.map(e => {
            return e.calendarId
        })

        //加總重複calendarId個數 ex. a:1 b:3 c:4
        let eachCalendarIdNumbers = {};
        calendarId.forEach(function (item) {
            eachCalendarIdNumbers[item] = eachCalendarIdNumbers[item] ? eachCalendarIdNumbers[item] + 1 : 1;
        });

        //先撈出 channelId 再去要該channel的名稱
        let getPositionSql = 'SELECT id,name,channelId,channelName,rotation,memo,status FROM sale_booking.calendar_list ORDER BY orderKey'
        let allPosition = await query(getPositionSql)
        //如果該頻道沒廣告怎該索引=0
        let eachCalendarIdNumbersArray = allPosition.map(e => {
            if (eachCalendarIdNumbers[e.id] == undefined) eachCalendarIdNumbers[e.id] = 0;
            return eachCalendarIdNumbers[e.id]
        })
        res.send(JSON.stringify({
            'allPosition': allPosition,
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
    req.session.user = user;
    if (req.session.user != undefined) {
        let renderPositionCondition = ''
        //判斷權限是user 就多一個 where條件
        if (req.session.user.type == 'User') {
            let user = req.session.user.account;
            renderPositionCondition = ' WHERE create_by = "' + user + '"'
        }
        let calId = req.body.calId,
            name = req.body.name,
            rotation = req.body.rotation,
            memo = req.body.memo,
            status = req.body.status;

        //頻道停用啟用、相對應的schedule跟著停用啟用
        if(status == '0'){
            let updateScheduleSql = 'UPDATE sale_booking.schedule_event SET status=? WHERE calendarId=?'
            let updateScheduleData = [status, calId]
            await query(updateScheduleSql, updateScheduleData)
        }else{
            let updateScheduleSql = 'UPDATE sale_booking.schedule_event SET status=? WHERE calendarId=?'
            let updateScheduleData = [status, calId]
            await query(updateScheduleSql, updateScheduleData)
        }

        let updatePositionSql = 'UPDATE sale_booking.calendar_list SET name=?, rotation=?, memo=?, status=? WHERE id=?'
        let updatePositionData = [name, rotation, memo, status, calId]
        await query(updatePositionSql, updatePositionData)

        res.send(JSON.stringify({
            'update_position': '成功',
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/create_position', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
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
        let createPositionSql = 'INSERT INTO sale_booking.`calendar_list` (`id`,`channelId`,`channelName`,`color`,`bgcolor`,`dragbgcolor`,`bordercolor`,`name`,`rotation`,`memo`,`status`,`create_date`, `create_by`, `update_date`, `update_by`) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        let createPositionData = [id, channelId.split('&&')[0], channelId.split('&&')[1], color, calendarBgColor, calendarDragBgColor, calendarBorderColor, name, rotation, memo, status, createTime, userName, createTime, userName]
        await query(createPositionSql, createPositionData)

        fs.appendFile('/var/test/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' create position : ' + name, function (error) {
            if (error) console.log(error)
        })
        console.log(req.session.user.name + ' create position : ' + name);

        res.render('position', {
            userName
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/delete_position', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let delId = req.body.delId;
        let deletePostionSql = 'DELETE FROM sale_booking.`calendar_list` WHERE id = ?'
        let deletePostionData = [delId]
        await query(deletePostionSql, deletePostionData)

        fs.appendFile('/var/test/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' delete postion ' + delId, function (error) {
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

router.get('/order', function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name
        res.render('order', {
            today,
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

router.get('/order-add', function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name
        res.render('order-add', {
            today,
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

router.get('/reserveOrder', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name

        res.render('reserveOrder', {
            today,
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

router.post('/getReserveOrder', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        //取得個頻道的廣告數
        let getChannelSql = 'SELECT link,name,memo FROM sale_booking.channel where status = 1 ORDER BY link'
        let allChannel = await query(getChannelSql)

        res.send(JSON.stringify({
            'allChannel': allChannel,
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/getOrder', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let renderOrderCondition = ''
        //判斷權限是user 就多一個 where條件
        if (req.session.user.type == 'User') {
            let account = req.session.user.account;
            renderOrderCondition = ' WHERE create_by = "' + account + '"'
        }
        let getOrderSql = 'SELECT id,advertisers,title,ad_type,salesperson,memo FROM sale_booking.order_list ' + renderOrderCondition + ' ORDER BY advertisers'
        let allOrder = await query(getOrderSql)
        res.send(JSON.stringify({
            'allOrder': allOrder,
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/update_order', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let renderOrderCondition = ''
        //判斷權限是user 就多一個 where條件
        if (req.session.user.type == 'User') {
            let user = req.session.user.account;
            renderOrderCondition = ' WHERE create_by = "' + user + '"'
        }
        let orderId = req.body.orderId,
            advertisers = req.body.advertisers,
            title = req.body.title,
            ad_type = req.body.ad_type,
            salesperson = req.body.salesperson,
            memo = req.body.memo
        let updateOrderSql = 'UPDATE sale_booking.order_list SET advertisers=?, title=?, ad_type=?, salesperson=?, memo=? WHERE id=?'
        let updateOrderData = [advertisers, title, ad_type, salesperson, memo, orderId]
        await query(updateOrderSql, updateOrderData)
        res.send(JSON.stringify({
            'update_order': '成功',
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/create_order', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let name = req.body.name,
            advertisers = req.body.advertisers,
            customer_company = req.body.customer_company,
            salesperson = req.body.salesperson,
            ad_type = req.body.ad_type,
            memo = req.body.memo
        let schedule_time = req.body.schedule_time.split('-');

        let userName = req.session.user.name
        let account = req.session.user.account
        let createTime = new moment().format('YYYY-MM-DD HH:mm:ss')
        let createOrderSql = 'INSERT INTO sale_booking.`order_list` (`title`, `advertisers`, `customer_company`, `salesperson`, `start_time`, `end_time`, `ad_type`,`memo`,`create_date`, `create_by`, `update_date`, `update_by`) values (?,?,?,?,?,?,?,?,?,?,?,?)'
        let createOrderData = [name, advertisers, customer_company, salesperson, moment(schedule_time[0]).format('YYYY-MM-DD'), moment(schedule_time[1]).format('YYYY-MM-DD'), ad_type, memo, createTime, account, createTime, account]
        fs.appendFile('/var/test/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' create order ' + name, function (error) {
            if (error) console.log(error)
        })
        console.log(req.session.user.name + ' create name ' + name);

        await query(createOrderSql, createOrderData)
        res.render('order', {
            userName
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/delete_order', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let delId = req.body.delId;
        let deleteOrderSql = 'DELETE FROM sale_booking.`order_list` WHERE id = ?'
        let deleteOrderData = [delId]
        await query(deleteOrderSql, deleteOrderData)

        fs.appendFile('/var/test/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' delete order ' + delId, function (error) {
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


router.get('/customer', function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name
        res.render('customer', {
            today,
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

router.post('/getCustomer', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let getCustomerSql = 'SELECT code,name,contacts,phone,memo FROM sale_booking.customer ORDER BY name'
        let allCustomer = await query(getCustomerSql)
        res.send(JSON.stringify({
            'allCustomer': allCustomer,
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/customer-add', function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name
        res.render('customer-add', {
            today,
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

router.post('/update_customer', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let rendercustomerCondition = ''
        //判斷權限是user 就多一個 where條件
        if (req.session.user.type == 'User') {
            let user = req.session.user.account;
            rendercustomerCondition = ' WHERE create_by = "' + user + '"'
        }
        let code = req.body.code,
            name = req.body.name,
            contacts = req.body.contacts,
            phone = req.body.phone,
            memo = req.body.memo
        let updateCustomerSql = 'UPDATE sale_booking.customer SET name=?, contacts=?, phone=?, memo=? WHERE code=?'
        let updateCustomerData = [name, contacts, phone, memo, code]
        await query(updateCustomerSql, updateCustomerData)
        res.send(JSON.stringify({
            'update_customer': '成功',
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/create_customer', async function (req, res) {
    req.session.user = user;
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
            memo = req.body.memo
        let userName = req.session.user.name
        let createTime = new moment().format('YYYY-MM-DD HH:mm:ss')
        let createCustomerSql = 'INSERT INTO sale_booking.`customer` (`code`, `name`, `contacts`, `phone`, `email`, `sale_name`,`tax_id`,`postal_code`,`address`,`payment_terms`,`memo`,`create_date`, `create_by`, `update_date`, `update_by`) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        let createCustomerData = [code, name, contacts, phone, email, sale_name, tax_id, postal_code, address, payment_terms, memo, createTime, userName, createTime, userName]

        fs.appendFile('/var/test/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' create customer ' + code, function (error) {
            if (error) console.log(error)
        })
        console.log(req.session.user.name + ' create customer ' + code);

        await query(createCustomerSql, createCustomerData)
        res.render('customer', {
            userName
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/delete_customer', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let delId = req.body.delId;
        let deleteCustomerSql = 'DELETE FROM sale_booking.`customer` WHERE code = ?'
        let deleteCustomerData = [delId]
        await query(deleteCustomerSql, deleteCustomerData)

        fs.appendFile('/var/test/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' delete customer ' + delId, function (error) {
            if (error) console.log(error)
        })
        console.log(req.session.user.name + ' delete customer ' + delId);

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
    req.session.user = user;
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name
        res.render('channel', {
            today,
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
router.post('/renderChannel', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let renderChannelSql = "select link,name from sale_booking.channel where status = 1 order by link"
        let allChannel = await query(renderChannelSql)
        res.send(JSON.stringify({
            'channel': allChannel,
            'render channel': 'succeed',
        }));

    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});
router.get('/channel-add', function (req, res) {
    req.session.user = user;
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
    req.session.user = user;
    if (req.session.user != undefined) {
        //取得頻道組成陣列
        let getAdNumbersSql = 'SELECT channelId FROM sale_booking.`calendar_list` where status = 1 ORDER BY channelId'
        let getChannel = await query(getAdNumbersSql)
        let channel = getChannel.map(e => {
            return e.channelId
        })
        //加總重複channel個數 ex. www:1 babou:3 petsmao:4
        let eachChannelAdNumbers = {};
        channel.forEach(function (item) {
            eachChannelAdNumbers[item] = eachChannelAdNumbers[item] ? eachChannelAdNumbers[item] + 1 : 1;
        });

        //取得個頻道的廣告數
        let getChannelSql = 'SELECT link,name,domain,memo,status FROM sale_booking.channel where status = 1 ORDER BY link'
        let allChannel = await query(getChannelSql)

        //如果該頻道沒廣告則該索引=0
        let eachChannelAdNumbersArray = allChannel.map(e => {
            if (eachChannelAdNumbers[e.link] == undefined) eachChannelAdNumbers[e.link] = 0;
            return eachChannelAdNumbers[e.link]
        })
        res.send(JSON.stringify({
            'allChannel': allChannel,
            'allAdNumbers': eachChannelAdNumbersArray,
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/update_channel', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let renderChannelCondition = ''
        //判斷權限是user 就多一個 where條件
        if (req.session.user.type == 'User') {
            let user = req.session.user.account;
            renderChannelCondition = ' WHERE create_by = "' + user + '"'
        }
        let channelId = req.body.channelId,
            name = req.body.name,
            domain = req.body.domain,
            memo = req.body.memo,
            status = req.body.status;

        let updateChannelSql = 'UPDATE sale_booking.channel SET name=?, domain=?, memo=?, status=? WHERE link=?'
        let updateChannelData = [name, domain, memo, status, channelId]
        console.log(updateChannelData);
        await query(updateChannelSql, updateChannelData)

        res.send(JSON.stringify({
            'update_channel': '成功',
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/create_channel', async function (req, res) {
    req.session.user = user;
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
        await query(createChannelSql, createChannelData)
        fs.copyFile("/var/www/calendar/views/channel/www.ejs", "/var/www/calendar/views/channel/" + link + ".ejs", (err) => {
            if (err) {
                console.log("Error Found:", err);
            }
        });

        fs.appendFile('/var/test/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' create channel ' + name, function (error) {
            if (error) console.log(error)
        })
        console.log(req.session.user.name + ' create channel ' + name);

        res.render('channel', {
            userName,
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/delete_channel', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let delId = req.body.delId;
        let deleteChannelSql = 'DELETE FROM sale_booking.`channel` WHERE link = ?'
        let deleteChannelData = [delId]
        await query(deleteChannelSql, deleteChannelData)

        let deletecalendarListFromThisChannelSql = 'DELETE FROM sale_booking.`calendar_list` WHERE channel = ?'
        let deletecalendarListFromThisChannelData = [delId]
        await query(deletecalendarListFromThisChannelSql, deletecalendarListFromThisChannelData)

        let deleteScheduleListFromThisChannelSql = 'DELETE FROM sale_booking.`schedule_event` WHERE channel = ?'
        let deleteScheduleListFromThisChannelData = [delId]
        await query(deleteScheduleListFromThisChannelSql, deleteScheduleListFromThisChannelData)

        fs.appendFile('/var/test/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' delete channel ID : ' + delId, function (error) {
            if (error) console.log(error)
        })
        console.log(req.session.user.name + ' delete channel ID : ' + delId);

        exec(`rm -rf /var/www/calendar/views/channel/` + delId + `.ejs`, (err, stdout, stderr) => {
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
    req.session.user = user;
    if (req.session.user != undefined) {
        let userType = req.session.user.type
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name
        res.render('privilege', {
            today,
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

router.post('/getPrivilege', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        //取得每個人建立的委刊數組成陣列
        let getAdNumbersSql = 'SELECT create_by FROM sale_booking.`order_list` ORDER BY create_by'
        let getOrderCreateBy = await query(getAdNumbersSql)
        let order = getOrderCreateBy.map(e => {
            return e.create_by
        })

        //加總重複channel個數 ex. userA:1 userB:3 userC:4
        let eachUserOrderNumbers = {};
        order.forEach(function (item) {
            eachUserOrderNumbers[item] = eachUserOrderNumbers[item] ? eachUserOrderNumbers[item] + 1 : 1;
        });
        let getAccountSql = 'SELECT name,account,email,type FROM sale_booking.user ORDER BY name'
        let allAccount = await query(getAccountSql)

        //如果該頻道沒廣告怎該索引=0
        let eachUserOrderNumbersArray = allAccount.map(e => {
            if (eachUserOrderNumbers[e.account] == undefined) eachUserOrderNumbers[e.account] = 0;
            return eachUserOrderNumbers[e.account]
        })
        res.send(JSON.stringify({
            'allAccount': allAccount,
            'allOrderNumbers': eachUserOrderNumbersArray
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/privilege-add', function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name
        res.render('privilege-add', {
            today,
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

router.post('/delete_account', async function (req, res) {
    req.session.user = user;
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let delId = req.body.delId;
        let deleteAccountSql = 'DELETE FROM sale_booking.`user` WHERE account = ?'
        let deleteAccountData = [delId]
        await query(deleteAccountSql, deleteAccountData)

        fs.appendFile('/var/test/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' delete account : ' + delId, function (error) {
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
    req.session.user = user;
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
        await query(createAccountSql, createAccountData)

        fs.appendFile('/var/test/log/bookinguserLoginTrace.log', nowDate + " " + req.session.user.name + ' create account : ' + account, function (error) {
            if (error) console.log(error)
        })
        console.log(req.session.user.name + ' create account : ' + account);

        res.render('privilege', {
            userName
        });
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/edit', function (req, res) {
    let title = 'NOW Booking '
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    let userName = 'req.session.user.name'
});

module.exports = router;