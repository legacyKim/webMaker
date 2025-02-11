import { NextResponse } from 'next/server';
import { promisePool } from '../../../api/db.js';

export async function GET(request) {
    try {
        const slug = request.url.split('/').pop();
        if (!slug) {
            return NextResponse.json({ status: 400, message: "SLUG is required" });
        }

        const [contentData] = await promisePool.query("SELECT * FROM tb_content WHERE slug = ?", [slug]);

        if (contentData.length > 0) {
            return NextResponse.json(contentData[0]);
        }
        return NextResponse.json({ status: 404, message: "Content not found" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ status: 500, message: "Internal Server Error" });
    }
}

export async function PUT(request) {
    try {

        const slug = request.url.split('/').pop();

        const [updateResult] = await promisePool.query(
            'UPDATE tb_content SET view = view + 1 WHERE slug = ?',
            [slug]
        );

        if (updateResult.affectedRows === 0) {
            return NextResponse.json({ success: false, message: "일치하는 콘텐츠가 없습니다." }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('조회수 증가 오류:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
