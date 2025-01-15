import { NextResponse } from 'next/server';

import { promisePool } from './db.js';
import { PutObjectCommand } from "@aws-sdk/client-s3";

import s3 from './s3.js';

import dotenv from 'dotenv';
dotenv.config();

export const bucketName = process.env.AWS_BUCKET_NAME;

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export async function GET() {
    try {
        const [results] = await promisePool.query("SELECT * FROM tb_project");
        return NextResponse.json(results);
    } catch (error) {
        console.error('Database query failed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch projects', details: error.message },
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
            ACL: 'public-read',
        };

        const uploadCommand = new PutObjectCommand(s3Params);
        await s3.send(uploadCommand);

        const imgPath = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;

        // 데이터베이스에 프로젝트 정보 삽입
        const [result] = await promisePool.query(
            'INSERT INTO tb_project (project, company, imgsrc, link) VALUES (?, ?, ?, ?)',
            [projectName, company, imgPath, link]
        );

        return NextResponse.json({
            insertedId: result.insertId,
        });
    } catch (error) {
        console.error('post failed:', error);
        return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
        );
    }
}