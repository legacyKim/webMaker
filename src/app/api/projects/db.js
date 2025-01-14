import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.MYSQL_HOST;
const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE;

const pool = mysql.createPool({
    host,
    user,
    password,
    database,
    port: 3306,
});


export const promisePool = pool.promise();
