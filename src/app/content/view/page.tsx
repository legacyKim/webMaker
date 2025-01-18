"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

export default function ViewPage() {

    const searchParams = useSearchParams();
    const title = searchParams.get('title');
    const date = searchParams.get('date');
    const content = searchParams.get('content');

    return (
        <div>
            <div className="content_header">
                <div className='page_header'>
                    <div className='page_header_tit'>
                        <h4>Content</h4>
                    </div>
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
