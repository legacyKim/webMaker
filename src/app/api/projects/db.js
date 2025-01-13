import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.MYSQL_HOST;
const user = process.env.MYSQL_USER;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DATABASE;

const pool = mysql.createPool({
    host: host,            
    user: user,            
    password: password,    
    database: database,
});

export const promisePool = pool.promise();
