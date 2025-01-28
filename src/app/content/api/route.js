import { NextResponse } from 'next/server';
import { promisePool } from '../../api/db.js';

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

        const data = await req.json();
        const { title, date, content, subtitle, source, target, position, Password } = data;

        if (Password !== validPassword) {
            return NextResponse.json(
                { status: 403 }
            );
        } else {
            let contentResult = null;
            if (position) {
                const [contentInsertResult] = await promisePool.query(
                    'INSERT INTO tb_content (type, data, position) VALUES (?, ?, ?)',
                    ['custom', JSON.stringify({ title, date, content, subtitle }), JSON.stringify(position)]
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
        const { position, id, edge, title, date, content, subtitle, Password } = data;

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

        if (Password && Password !== validPassword) {
            return NextResponse.json(
                { success: false, message: "비밀번호가 일치하지 않습니다." },
                { status: 403 }
            );
        } else {

            if (content) {
                const contentData = JSON.stringify({ title, date, content, subtitle });

                const [contentUpdateResult] = await promisePool.query(
                    'UPDATE tb_content SET data = ? WHERE id = ?',
                    [contentData, id]
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
