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
