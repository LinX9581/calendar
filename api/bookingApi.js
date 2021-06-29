import fetch from 'node-fetch';
import crypto from 'crypto';
import moment from 'moment';
import schedule from 'node-schedule';

function cryptPwd(password) {
    var md5 = crypto.createHash('sha256');
    return md5.update(password).digest('hex');
}
let y = moment(new Date()).format('YYYY');
let m = moment(new Date()).format('M');
let d = moment(new Date()).format('D');
let r = parseInt(y) + (parseInt(m) * 3 + 2) + (parseInt(d) * 2)
let uatCode = r + "uat-nn-client"
let prodCode = r + "prod-nn-client"
let prodKey = cryptPwd(prodCode)
let uatKey = cryptPwd(uatCode)

//每天00:01 換Key
schedule.scheduleJob('0 1 0 * * *', function() {
    y = moment(new Date()).format('YYYY');
    m = moment(new Date()).format('M');
    d = moment(new Date()).format('D');
    r = parseInt(y) + (parseInt(m) * 3 + 2) + (parseInt(d) * 2)
    uatCode = r + "uat-nn-client"
    prodCode = r + "prod-nn-client"
    prodKey = cryptPwd(prodCode)
    uatKey = cryptPwd(uatCode)
})

async function userAuthCheck(user, password) {
    let auth = await fetch('https://backed.nownews.com/nn-backed/api/v1/loginGaView', {
            method: 'POST',
            body: JSON.stringify({ "account": user, "password": password }),
            headers: { 'Content-Type': 'application/json' }
        }).then(res => res.json())
        .then(json => {
            return json;
        });
    return auth
}

export { cryptPwd, userAuthCheck, }