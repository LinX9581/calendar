import Mysql from 'mysql2/promise'
const pool = Mysql.createPool({
    host: '10.140.0.2',
    user: 'db1',
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
export default pool