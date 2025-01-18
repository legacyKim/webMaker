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
        console.error('Database query failed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch projects', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const data = await req.json();
        const { title, date, content, subtitle, source, target, position } = data;

        let contentResult = null;
        if (position) {
            const [contentInsertResult] = await promisePool.query(
                'INSERT INTO tb_content (id, type, data, position) VALUES (?, ?, ?, ?)',
                [id, 'custom', JSON.stringify({ title, date, content, subtitle }), JSON.stringify(position)]
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

    } catch (error) {
        console.error("Error in POST:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const data = await req.json();
        const { position, id, edge } = data;

        if (position) {
            const [updateResult] = await promisePool.query(
                'UPDATE tb_content SET position = ? WHERE id = ?',
                [JSON.stringify(position), id]
            );

            if (updateResult.affectedRows === 0) {
                return NextResponse.json({ success: false, message: 'Node not found or not updated' }, { status: 404 });
            }
        }

        if (edge && edge.id && edge.source && edge.target) {
            const [edgeUpdateResult] = await promisePool.query(
                'UPDATE tb_edge SET source = ?, target = ? WHERE id = ?',
                [edge.source, edge.target, edge.id]
            );

            if (edgeUpdateResult.affectedRows === 0) {
                return NextResponse.json({ success: false, message: 'Edge not found or not updated' }, { status: 404 });
            }
        }

        return NextResponse.json({ success: true, message: 'Node updated successfully' });
    } catch (error) {
        console.error("Error in PUT:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const id = req.nextUrl.searchParams.get('id');

        const [deleteResult] = await promisePool.query(
            'DELETE FROM tb_edge WHERE id = ?',
            [id]
        );

        if (deleteResult.affectedRows === 0) {
            return NextResponse.json({ success: false, message: 'Edge not found or not deleted' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Edge deleted successfully' });
    } catch (error) {
        console.error("Error in DELETE:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}