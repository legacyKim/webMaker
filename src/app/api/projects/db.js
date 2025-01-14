import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

let promisePool;

if (!promisePool && process.env.MYSQL_URL) {
    const dbUrl = process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL;
    const pool = mysql.createPool(dbUrl);
    promisePool = pool.promise();
}

export { promisePool };