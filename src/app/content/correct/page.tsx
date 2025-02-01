"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import type SimpleMDEEditor from 'easymde';

import "easymde/dist/easymde.min.css";
import '../../css/simpleMDE.custom.scss';

import PasswordCheckModal from "../../component/Password";
import { MemoizedEditor } from "../utils/simpleMDE"

export default  function CorrectContent() {

    const router = useRouter();
    const searchParams = useSearchParams();

    const titleRef = useRef<HTMLInputElement | null>(null);
    const subtitleRef = useRef<HTMLInputElement | null>(null);
    const contentRef = useRef<SimpleMDEEditor | null>(null);

    const currentDate = new Date().toISOString().split("T")[0];

    const [isPasswordCheck, setIsPasswordCheck] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [Password, setPassword] = useState('');

    const initialContent = searchParams.get("content") || "";

    useEffect(() => {
        if (titleRef.current) titleRef.current.value = searchParams.get("title") || "";
        if (subtitleRef.current) subtitleRef.current.value = searchParams.get("subtitle") || "";
    }, [searchParams]);

    const handleSubmit = async () => {
        const title = titleRef.current?.value || "";
        const subtitle = subtitleRef.current?.value || "";
        const content = contentRef.current?.value() || "";

        const contentId = searchParams.get("id");

        const dataToSend = {
            title,
            subtitle,
            content,
            date: currentDate,
            id: contentId,
            Password,
        };

        try {
            const response = await fetch("/content/api", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                router.push(`/content`);
            } else {
                const errorData = await response.json();
                alert(errorData.message || "패스워드가 올바르지 않습니다.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (isPasswordCheck) {
            handleSubmit();
        }
    }, [isPasswordCheck]);

    return (
        <div className="container dark">
            <form onSubmit={(e) => e.preventDefault()} className="write">
                <div className="btn_wrap">
                    <button className="customBtn" onClick={() => { setIsModalOpen(true); }}>
                        <i className="icon-ok-circled"></i>
                    </button>
                </div>
                <div className="write_header">
                    <input
                        className="write_title"
                        type="text"
                        name="title"
                        ref={titleRef}
                        placeholder="Title"
                    />
                </div>
                <div className="content_line">
                    <input
                        className="write_subtitle"
                        type="text"
                        name="subtitle"
                        ref={subtitleRef}
                        placeholder="Subtitle"
                    />
                </div>
                <div className="simpleMDE_wrap">
                    <MemoizedEditor initialContent={initialContent} contentRef={contentRef} />
                </div>

                {isModalOpen &&
                    <PasswordCheckModal setIsModalOpen={setIsModalOpen} setIsPasswordCheck={setIsPasswordCheck} setPassword={setPassword}></PasswordCheckModal>
                }
            </form>
        </div>
    );
}
