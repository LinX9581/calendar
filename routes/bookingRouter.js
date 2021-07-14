import * as bookingApi from '../api/bookingApi'
import query from './mysqlConnect';
import express from 'express';
import moment from 'moment';
import fs from 'fs';
import md5 from 'md5';
import { exec } from 'child_process';

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
    console.log("sit connect")
});
router.post('/', async function (req, res) {
    let title = 'NOW Booking'
    let loginTime = new moment().format('YYYY-MM-DD HH:mm:ss')
    let account = req.body.account
    let pwd = md5(req.body.password)
    console.log(pwd);
    let accountCheckSql = 'SELECT name,type FROM sale_booking.user WHERE account = ? AND password = ?'
    let accountCheckData = [account, pwd]
    let isAccountExists = await query(accountCheckSql, accountCheckData)
    if (isAccountExists != '') {
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
                deptArray = ['']
                userInvisible = 'd-none'
                break;
        }
        let user = {
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
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = 'req.session.user.name'
        res.render('position', {
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
    if (req.session.user != undefined) {
        let getPositionSql = 'SELECT name,channel,rotation,memo FROM sale_booking.calendar_list'
        let allPosition = await query(getPositionSql)
        res.send(JSON.stringify({
            'allPosition': allPosition,
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/order', function (req, res) {
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = 'req.session.user.name'
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

router.post('/getOrder', async function (req, res) {
    if (req.session.user != undefined) {
        let getOrderSql = 'SELECT id,advertisers,title,ad_type,salesperson,memo FROM sale_booking.schedule_event'
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
router.post('/delete_order', async function (req, res) {
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let delId = req.body.delId;
        let deleteOrderSql = 'DELETE FROM sale_booking.`schedule_event` WHERE id = ?'
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
    if (req.session.user != undefined) {
        let getCustomerSql = 'SELECT code,name,contacts,phone,memo FROM sale_booking.customer'
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

router.post('/create_customer', async function (req, res) {
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let code = req.body.code, name = req.body.name, contacts = req.body.contacts, phone = req.body.phone, email = req.body.email, sale_name = req.body.sale_name, tax_id = req.body.tax_id, postal_code = req.body.postal_code, address = req.body.address, payment_terms = req.body.payment_terms, memo = req.body.memo
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
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = 'req.session.user.name'
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
router.get('/channel-add', function (req, res) {
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = 'req.session.user.name'
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
    if (req.session.user != undefined) {
        let getAdNumbersSql = 'SELECT count(*) AS adNumbers FROM sale_booking.`schedule_event` WHERE channel = ?'
        let getAdNumbersData = ['www']
        let allAdNumbers = await query(getAdNumbersSql, getAdNumbersData)
        let getChannelSql = 'SELECT name,domain,memo FROM sale_booking.channel'
        let allChannel = await query(getChannelSql)
        res.send(JSON.stringify({
            'allChannel': allChannel,
            'allAdNumbers': allAdNumbers[0].adNumbers,
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/create_channel', async function (req, res) {
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = req.session.user.name
        let domain = req.body.domain;
        let channel = domain;
        let isChannelExistSql = 'SELECT 1 from sale_booking.channel where domain = ?'
        let isChannelExistData = [channel]
        let isChannelExistRes = await query(isChannelExistSql, isChannelExistData)
        //避免重複新增channel
        if (isChannelExistRes == '') {
            let channelIsExist = ''
            let name = req.body.name, memo = req.body.memo, status = req.body.status;
            req.session.channel = channel;
            let createTime = new moment().format('YYYY-MM-DD HH:mm:ss')
            let createChannelSql = 'INSERT INTO sale_booking.`channel` (`name`,`domain`,`memo`,`status`, `create_date`, `create_by`, `update_date`, `update_by`) values (?,?,?,?,?,?,?,?)'
            let createChannelData = [name, domain, memo, status, createTime, userName, createTime, userName]
            await query(createChannelSql, createChannelData)
            fs.copyFile("/var/www/calendar/views/channel/www.ejs", "/var/www/calendar/views/channel/" + channel + ".ejs", (err) => {
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
                channelIsExist
            });
        } else {
            let channelIsExist = '頻道已存在'
            res.render('channel-add', {
                userName,
                channelIsExist
            });
        }
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.post('/delete_channel', async function (req, res) {
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let delId = req.body.delId;
        let deleteChannelSql = 'DELETE FROM sale_booking.`channel` WHERE domain = ?'
        let deleteChannelData = [delId]
        await query(deleteChannelSql, deleteChannelData)

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
    if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = 'req.session.user.name'
        res.render('privilege', {
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

router.post('/getPrivilege', async function (req, res) {
    if (req.session.user != undefined) {
        let getAccountSql = 'SELECT name,account,email,type FROM sale_booking.user'
        let allAccount = await query(getAccountSql)
        res.send(JSON.stringify({
            'allAccount': allAccount,
        }));
    } else {
        let title = 'NOW Booking '
        res.render('login', {
            title
        })
    }
});

router.get('/privilege-add', function (req, res) {
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
    if (req.session.user != undefined) {
        let nowDate = new moment().format('YYYY-MM-DD HH:mm:ss')
        let account = req.body.account, password = req.body.password, type = req.body.type, name = req.body.name, email = req.body.email, memo = req.body.memo
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
    console.log(req.body);
    console.log(req.body[0]);

    // console.log(res.body?.first);
    // console.log(res.body?.action);
    console.log('get post');
    let title = 'NOW Booking '
    let today = new moment().format('YYYY-MM-DD HH:mm:ss')
    let userName = 'req.session.user.name'
});

module.exports = router;