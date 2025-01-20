"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import axios from 'axios';
import BlogPost from "./BlogPost";

export default function ViewPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ViewContent />
        </Suspense>
    );
}

function ViewContent() {

    const searchParams = useSearchParams();
    const router = useRouter();

    const title = searchParams.get("title");
    const subtitle = searchParams.get("subtitle");
    const date = searchParams.get("date");
    const content = searchParams.get("content");
    const contentId = searchParams.get("id");

    const handleDelete = async () => {

        const confirmDelete = confirm("삭제하시겠습니까?");
        if (!confirmDelete) return;

        try {
            const response = await axios.delete(`/content/api`, {
                data: { id: contentId, type: "content" },
            });
            if (response.data.success) {
                router.push(`/content`);
            }
        } catch (error) {
            console.error("Error deleting content:", error);
        }

    };

    const handleCorrect = () => {
        if (!contentId) {
            alert("Content ID is missing.");
            return;
        }

        const encodedContent = content ? encodeURIComponent(content) : "";

        router.push(`/content/correct?id=${contentId}&title=${title}&subtitle=${subtitle}&content=${encodedContent}`);
    };

    return (
        <div>
            <div className="page_header">
                <div className="page_header_tit">
                    <h4>View Content</h4>
                </div>
                <div className="btn_wrap">
                    <button className="customBtn" onClick={handleDelete}>
                        <span>Delete</span>
                    </button>
                    <button className="customBtn" onClick={handleCorrect}>
                        <span>Correct</span>
                    </button>
                </div>
            </div>

            <div className="view_content">
                <div className="view_content_header">
                    <h3 className="view_content_title">{title}</h3>
                    <span className="view_content_date">{date}</span>
                </div>
                <BlogPost content={content} />
            </div>
        </div>
    );
}
