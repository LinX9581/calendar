const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const fetch = require('node-fetch')
import mysql from '../routes/mysqlConnect';

let code = [];
// insertCustomer()
async function insertCustomer() {
    fs.createReadStream(path.resolve(__dirname, 'nn.csv'))
        .pipe(csv.parse({ headers: true }))
        .on('error', error => console.error(error))
        .on('data', row => {
            let insertCustomerSql = "INSERT INTO sale_booking.customer(`code`,name,contacts,phone,email,postal_code,address,tax_id,payment_terms,sale_name,memo,`status`,create_date,create_by,update_date,update_by)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?); "
            let insertCustomerData = [row.客戶代號, row.客戶全名, row.連絡人, row.TEL_NO, row.email, row.郵遞區號, row.發票地址, row.統一編號, row.付款條件名稱, row.業務人員名稱, '', '1', '2021-08-23', 'linx', '2021-08-23', 'linx']
            mysql.query(insertCustomerSql,insertCustomerData)
        }
        )
        .on('end', rowCount => console.log(`Parsed ${rowCount} rows`));
}
//test.js
// test()
async function test() {
    let sql = 'select * from sale_booking.order_list'
    let a = await mysql.query(sql);
    console.log(a);
}