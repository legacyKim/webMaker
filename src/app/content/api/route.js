import { NextResponse } from 'next/server';
import { promisePool } from '../../api/db.js';
import { PutObjectCommand } from "@aws-sdk/client-s3";

import s3 from '../../api/s3.js';

import dotenv from 'dotenv';
dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAME;

export async function GET() {
    try {
        const [contentData] = await promisePool.query("SELECT * FROM tb_content");
        const [edgeData] = await promisePool.query("SELECT * FROM tb_edge");

        return NextResponse.json({
            contentData,
            edgeData
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {

        const validPassword = process.env.API_PASSWORD;
        let data;

        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("multipart/form-data")) {

            const formData = await req.formData();
            const file = formData.get("file");

            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = `${Date.now()}-${file.name}`;
            const folderName = "contents"
            const s3Key = `${folderName}/${filename}`

            const s3Params = {
                Bucket: bucketName,
                Key: s3Key,
                Body: buffer,
                ContentType: file.type || 'application/octet-stream',
            };

            const uploadCommand = new PutObjectCommand(s3Params);
            await s3.send(uploadCommand);

            const imageUrl = `https://d3gdgz5qdqee20.cloudfront.net/${s3Key}`;

            return new Response(JSON.stringify({ success: true, imageUrl }), { status: 200 });

        } else {
            data = await req.json();
        }

        const { title, date, content, subtitle, slug, source, target, position, Password, keywords } = data;

        if (Password && Password !== validPassword) {
            return NextResponse.json(
                { success: false, message: "비밀번호가 일치하지 않습니다." },
                { status: 403 }
            );
        } else {
            let contentResult = null;
            if (position) {

                const [contentInsertResult] = await promisePool.query(
                    'INSERT INTO tb_content (type, data, position, slug, keywords) VALUES (?, ?, ?, ?, ?)',
                    ['custom', JSON.stringify({ title, date, content, subtitle }), JSON.stringify(position), slug, keywords]
                );
                contentResult = contentInsertResult;
            }

            let edgeResult = null;

            if (source && target) {
                const [edgeInsertResult] = await promisePool.query(
                    'INSERT INTO tb_edge (source, target) VALUES (?, ?)',
                    [source, target]
                );
                edgeResult = edgeInsertResult;
            }

            return NextResponse.json({
                success: true,
                contentId: contentResult ? contentResult.insertId : null,
                edgeId: edgeResult ? edgeResult.insertId : null
            });
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {

        const validPassword = process.env.API_PASSWORD;

        const data = await req.json();
        const { position, id, edge, title, date, content, subtitle, slug, lock, fixed, Password, keywords } = data;

        if (position) {
            const [updateResult] = await promisePool.query(
                'UPDATE tb_content SET position = ? WHERE id = ?',
                [JSON.stringify(position), id]
            );

            if (updateResult.affectedRows === 0) {
                return NextResponse.json({ success: false }, { status: 404 });
            }
        }

        if (edge && edge.id && edge.source && edge.target) {
            const [edgeUpdateResult] = await promisePool.query(
                'UPDATE tb_edge SET source = ?, target = ? WHERE id = ?',
                [edge.source, edge.target, edge.id]
            );

            if (edgeUpdateResult.affectedRows === 0) {
                return NextResponse.json({ success: false }, { status: 404 });
            }
        }

        if (lock !== undefined && lock !== null) {
            const lockValue = lock ? 1 : 0;
            const [updateResult] = await promisePool.query(
                'UPDATE tb_content SET `lock` = ? WHERE id = ?',
                [lockValue, id]
            );

            if (updateResult.affectedRows === 0) {
                return NextResponse.json({ success: false }, { status: 404 });
            }
        }

        if (fixed !== undefined && fixed !== null) {
            const fixedValue = fixed ? 1 : 0;
            const [updateResult] = await promisePool.query(
                'UPDATE tb_content SET fixed = ? WHERE id = ?',
                [fixedValue, id]
            );

            if (updateResult.affectedRows === 0) {
                return NextResponse.json({ success: false }, { status: 404 });
            }
        }

        if (Password && Password !== validPassword) {
            return NextResponse.json(
                { success: false, message: "비밀번호가 일치하지 않습니다." },
                { status: 403 }
            );
        } else {

            if (content) {
                const contentData = JSON.stringify({ title, date, content, subtitle });

                const [contentUpdateResult] = await promisePool.query(
                    'UPDATE tb_content SET data = ?, slug = ?, keywords = ? WHERE id = ?',
                    [contentData, slug, keywords, id]
                );

                if (contentUpdateResult.affectedRows === 0) {
                    return NextResponse.json({ success: false }, { status: 404 });
                }
            }

            return NextResponse.json({ success: true });
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {

        const validPassword = process.env.API_PASSWORD;

        const data = await req.json();
        const { id, type, Password } = data;

        if (Password && Password !== validPassword) {
            return NextResponse.json(
                { success: false, message: "비밀번호가 일치하지 않습니다." },
                { status: 403 }
            );
        } else {
            if (type === "content") {

                await promisePool.query("DELETE FROM tb_edge WHERE content_id = ? AND content_id IS NOT NULL", [id]);
                const [deleteResult] = await promisePool.query("DELETE FROM tb_content WHERE id = ?", [id]);
                if (deleteResult.affectedRows === 0) {
                    return NextResponse.json({ success: false }, { status: 404 });
                }

                return NextResponse.json({ success: true });

            } else if (type === "edge") {

                const [deleteResult] = await promisePool.query("DELETE FROM tb_edge WHERE id = ?", [id]);
                if (deleteResult.affectedRows === 0) {
                    return NextResponse.json({ success: false }, { status: 404 });
                }

                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json({ success: false }, { status: 400 });
            }
        }

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
