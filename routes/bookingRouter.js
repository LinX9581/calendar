import * as bookingApi from '../api/bookingApi'
import query from './mysqlConnect';
import express from 'express';
import moment from 'moment';
import fs from 'fs';
import md5 from 'md5';

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
    // if (req.session.user != undefined) {
        let title = 'NOW Booking '
        let today = new moment().format('YYYY-MM-DD HH:mm:ss')
        let userName = 'req.session.user.name'
        res.render('order', {
            today,
            title,
            userName
        });
    // } else {
    //     let title = 'NOW Booking '
    //     res.render('login', {
    //         title
    //     })
    // }
});

router.post('/getOrder', async function (req, res) {
    // if (req.session.user != undefined) {
    let getOrderSql = 'SELECT id,advertisers,title,ad_type,salesperson,memo FROM sale_booking.schedule_event'
    let allOrder = await query(getOrderSql)
    console.log(allOrder);
    res.send(JSON.stringify({
        'allOrder': allOrder,
    }));
    // } else {
    //     let title = 'NOW Booking '
    //     res.render('login', {
    //         title
    //     })
    // }
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
        let code = req.body.code, name = req.body.name, contacts = req.body.contacts, phone = req.body.phone, email = req.body.email, sale_name = req.body.sale_name, tax_id = req.body.tax_id, postal_code = req.body.postal_code, address = req.body.address, payment_terms = req.body.payment_terms, memo = req.body.memo
        let userName = req.session.user.name
        let createTime = new moment().format('YYYY-MM-DD HH:mm:ss')
        let createCustomerSql = 'INSERT INTO sale_booking.`customer` (`code`, `name`, `contacts`, `phone`, `email`, `sale_name`,`tax_id`,`postal_code`,`address`,`payment_terms`,`memo`,`create_date`, `create_by`, `update_date`, `update_by`) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        let createCustomerData = [code, name, contacts, phone, email, sale_name, tax_id, postal_code, address, payment_terms, memo, createTime, userName, createTime, userName]
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

router.get('/channel', function (req, res) {
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
        let delId = req.body.delId;
        let deleteAccountSql = 'DELETE FROM sale_booking.`user` WHERE account = ?'
        let deleteAccountData = [delId]
        await query(deleteAccountSql, deleteAccountData)
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
        let account = req.body.account, password = req.body.password, type = req.body.type, name = req.body.name, email = req.body.email, memo = req.body.memo
        let userName = req.session.user.name
        let createTime = new moment().format('YYYY-MM-DD HH:mm:ss')
        let createAccountSql = 'INSERT INTO sale_booking.`user` (`account`, `password`, `type`, `name`, `email`, `memo`, `create_date`, `create_by`, `update_date`, `update_by`) values (?,?,?,?,?,?,?,?,?,?)'
        let createAccountData = [account, md5(password), type, name, email, memo, createTime, userName, createTime, userName]
        await query(createAccountSql, createAccountData)
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


module.exports = router;