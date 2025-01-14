import { promisePool } from './db.js';

import s3Config from './s3.js';
const { bucketName, s3 } = s3Config;

import { NextResponse } from 'next/server';

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
            ContentType: file.type,
        };

        const uploadResult = await s3.upload(s3Params).promise();
        const imgPath = uploadResult.Location;

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

