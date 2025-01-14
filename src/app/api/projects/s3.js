import dotenv from 'dotenv';
import AWS from 'aws-sdk';

dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAME;

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

export default { bucketName, s3 };