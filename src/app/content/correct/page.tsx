"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import type SimpleMDEEditor from 'easymde';

import "easymde/dist/easymde.min.css";
import '../../css/simpleMDE.custom.scss';

import PasswordCheckModal from "../../component/Password";
import Loading from "../../component/Loading"
import { MemoizedEditor } from "../utils/simpleMDE"
import { createSlug } from "../utils/slug"

export default function Correct() {
    return (
        <Suspense fallback={<Loading />}>
            <CorrectContent />
        </Suspense>
    );
}

function CorrectContent() {

    const router = useRouter();
    const searchParams = useSearchParams();

    const titleRef = useRef<HTMLInputElement | null>(null);
    const subtitleRef = useRef<HTMLInputElement | null>(null);
    const contentRef = useRef<SimpleMDEEditor | null>(null);
    const keywordRef = useRef<HTMLInputElement | null>(null);

    const currentDate = new Date().toISOString().split("T")[0];

    const [isPasswordCheck, setIsPasswordCheck] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [Password, setPassword] = useState('');

    const slug = searchParams.get("slug");
    const [conId, setConId] = useState<number>();
    const [initialContent, setInitialContent] = useState<string>("");

    useEffect(() => {
        const fetchData = async () => {
            if (!slug) return;

            try {
                const res = await fetch(`/content/api/${slug}`);
                const content = await res.json();

                setInitialContent(content.data.content);
                setConId(content.id);

                if (titleRef.current) titleRef.current.value = content.data.title || "";
                if (subtitleRef.current) subtitleRef.current.value = content.data.subtitle || "";
                if (keywordRef.current) keywordRef.current.value = content.keywords || "";
            } catch (error) {
                console.error("Error fetching content:", error);
            }
        };
        fetchData();
    }, [slug]);

    const handleSubmit = async () => {
        const title = titleRef.current?.value || "";
        const subtitle = subtitleRef.current?.value || "";
        const content = contentRef.current?.value() || "";
        const keywords = keywordRef.current?.value || "";
        const slug = createSlug(title);

        const contentId = conId;

        const dataToSend = {
            title,
            subtitle,
            content,
            keywords,
            slug,
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
                    {initialContent !== "" && (
                        <MemoizedEditor initialContent={initialContent} contentRef={contentRef} />
                    )}
                </div>

                <div className="write_keyword_box">
                    <input className="write_keyword" type="text" name="keywords" ref={keywordRef} placeholder="KEYWORDS"></input>
                </div>

                {isModalOpen &&
                    <PasswordCheckModal setIsModalOpen={setIsModalOpen} setIsPasswordCheck={setIsPasswordCheck} setPassword={setPassword}></PasswordCheckModal>
                }
            </form>
        </div>
    );
}
