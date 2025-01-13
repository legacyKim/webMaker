import mysql from 'mysql2';
import dotenv from 'dotenv';

// .env 파일에서 환경 변수 로드
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
