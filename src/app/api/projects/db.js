import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

let promisePool = null;

if (typeof process !== 'undefined' && process.env.MYSQL_URL) {
    const url = process.env.MYSQL_URL;
    const pool = mysql.createPool(url);
    promisePool = pool.promise();
}

export { promisePool };