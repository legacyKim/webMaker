import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.MYSQL_URL;
const pool = mysql.createPool(url);

export const promisePool = pool.promise();
