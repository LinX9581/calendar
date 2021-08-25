const Mysql = require('mysql2/promise');
const pool = Mysql.createPool({
    host: '127.0.0.1',
    user: 'dev',
    password: '00000000',
});   

//mysql 連線檔
// let query = async function (query,data) {
//     try {
//         const rows = await pool.query(query,data);
//         return rows[0];
//     } catch (err) {
//         console.log('SQL ERROR => ' + err);
//         return err.stack;
//     }
// }
module.exports = pool