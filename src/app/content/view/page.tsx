"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import BlogPost from "./BlogPost";

import PasswordCheckModal from "../../component/Password"

import '../../css/simpleMDE.custom.scss';

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

        const dataToSend = {
            type: "content",
            Password,
            id: contentId,
        };

        try {
            const response = await fetch("/content/api", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataToSend),
            });
            if (response.ok) {
                router.push(`/content`);
            } else {
                console.error("Failed to update project");
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

    const [isPasswordCheck, setIsPasswordCheck] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [Password, setPassword] = useState('');

    useEffect(() => {
        if (isPasswordCheck) {
            handleDelete();
        }
    }, [isPasswordCheck]);

    return (
        <div className="container dark">
            <div className="view_content">
                <div className="view_content_header">
                    <h5 className="view_content_title">{title}</h5>
                    <div className="view_info">
                        <div className="view_info_box">
                            <i className="icon-clock"></i>
                            <span className="view_content_date">{date}</span>
                        </div>
                    </div>
                </div>
                <div className="view_content_line">
                    <p className="view_content_subtitle">
                        {subtitle}
                    </p>
                </div>
                <BlogPost content={content} />
            </div>

            <div className="btn_wrap">
                <button className="customBtn" onClick={() => { setIsModalOpen(true); }}>
                    <i className="icon-trash-2"></i>
                </button>
                <button className="customBtn" onClick={handleCorrect}>
                    <i className="icon-vector-pencil"></i>
                </button>
            </div>

            {isModalOpen &&
                <PasswordCheckModal setIsModalOpen={setIsModalOpen} setIsPasswordCheck={setIsPasswordCheck} setPassword={setPassword}></PasswordCheckModal>
            }
        </div>
    );
}
