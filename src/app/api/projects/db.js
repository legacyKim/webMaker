import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

let pool;

if (typeof window === 'undefined') {
    const mysqlUrl = process.env.MYSQL_URL;
    pool = mysql.createPool(mysqlUrl);
}

export const promisePool = pool?.promise();
