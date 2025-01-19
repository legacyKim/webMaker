"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function ViewPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ViewContent />
        </Suspense>
    );
}

function ViewContent() {
    const searchParams = useSearchParams();

    const title = searchParams.get("title");
    const date = searchParams.get("date");
    const content = searchParams.get("content");

    return (
        <div>
            <div className="page_header">
                <div className="page_header_tit">
                    <h4>View Content</h4>
                </div>
                <div className="btn_wrap">
                    <button className="customBtn">
                        <span>Delete</span>
                    </button>
                    <button className="customBtn">
                        <span>Correct</span>
                    </button>
                </div>

            </div>
            <div className="view_content">
                <div className="view_content_header">
                    <h3 className="view_content_title">{title}</h3>
                    <span className="view_content_date">{date}</span>
                </div>
                <b className="view_content_subtitle"></b>
                <p>{content}</p>
            </div>
        </div>
    );
}
