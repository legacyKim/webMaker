import { NextResponse } from 'next/server';

import { promisePool } from '../../api/db.js';
import { PutObjectCommand } from "@aws-sdk/client-s3";

import s3 from '../../api/s3.js';

import dotenv from 'dotenv';
dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAME;
const validPassword = process.env.MY_SECRET_PASSWORD;

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export async function GET() {
    try {
        const [projects] = await promisePool.query("SELECT * FROM tb_project");
        return NextResponse.json({
            projects,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const data = await req.formData();

        const file = data.get('image');
        const projectName = data.get('projectName');
        const link = data.get('link');
        const company = data.get('company');
        const password = data.get('password');

        if (password !== validPassword) {
            return res.status(403).json({ message: "Invalid password" });
        }

        if (!file) {
            throw new Error('No file uploaded');
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `${Date.now()}-${file.name}`;

        const s3Params = {
            Bucket: bucketName,
            Key: filename,
            Body: buffer,
            ContentType: file.type || 'application/octet-stream',
        };

        const uploadCommand = new PutObjectCommand(s3Params);
        await s3.send(uploadCommand);

        const imgPath = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;

        const [result] = await promisePool.query(
            'INSERT INTO tb_project (project, company, imgsrc, link) VALUES (?, ?, ?, ?)',
            [projectName, company, imgPath, link]
        );

        return NextResponse.json({
            insertedId: result.insertId,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { status: 500 }
        );
    }
}