"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { useRouter } from "next/navigation";

import "easymde/dist/easymde.min.css";
import type SimpleMDEEditor from 'easymde';

import '../../css/simpleMDE.custom.scss';

import PasswordCheckModal from "../../component/Password"

import { MemoizedEditor } from "../utils/simpleMDE"

export default function Write() {
    const router = useRouter();

    const titleRef = useRef<HTMLInputElement | null>(null);
    const subtitleRef = useRef<HTMLInputElement | null>(null);
    const contentRef = useRef<SimpleMDEEditor | null>(null);

    const initialContent = "";

    const currentDate = new Date().toISOString().split("T")[0];

    const handleSubmit = async () => {
        const title = titleRef.current?.value || "";
        const subtitle = subtitleRef.current?.value || "";
        const content = contentRef.current?.value() || "";

        const dataToSend = {
            title,
            subtitle,
            content,
            date: currentDate,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            lock: false,
            fixed: false,
            Password
        };

        try {
            const response = await fetch("/content/api", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                router.push("/content");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const [isPasswordCheck, setIsPasswordCheck] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [Password, setPassword] = useState('');

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
