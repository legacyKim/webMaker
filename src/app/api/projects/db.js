import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const mysqlUrl = process.env.MYSQL_URL;
const pool = mysql.createPool(mysqlUrl);

export const promisePool = pool.promise();
