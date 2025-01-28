"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import dynamic from 'next/dynamic';

import "easymde/dist/easymde.min.css";
import type SimpleMDEEditor from 'easymde';

import '../../css/simpleMDE.custom.scss';

import PasswordCheckModal from "../../component/Password"

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });

export default function Write() {

    const router = useRouter();

    const titleRef = useRef<HTMLInputElement | null>(null);
    const subtitleRef = useRef<HTMLInputElement | null>(null);
    const editorRef = useRef<SimpleMDEEditor | null>(null);

    const currentDate = new Date().toISOString().split("T")[0];

    const handleEditorMount = (editor: SimpleMDEEditor) => {
        editorRef.current = editor;
    };

    const handleSubmit = async () => {

        const title = titleRef.current?.value || "";
        const subtitle = subtitleRef.current?.value || "";
        const content = editorRef.current?.value() || "";

        const dataToSend = {
            title,
            subtitle,
            content,
            date: currentDate,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
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

    const handleImageUpload = () => {
        alert("준비 중 입니다.");
        return;
    };

    return (
        <div className="container dark">
            <form onSubmit={(e) => e.preventDefault()} className="write">
                <div className="btn_wrap">
                    <button className="customBtn" onClick={() => { setIsModalOpen(true); }}>
                        <i className="icon-ok-circled"></i>
                    </button>
                </div>
                <div>
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
                    <SimpleMDE
                        getMdeInstance={handleEditorMount}
                        options={{
                            spellChecker: false,
                            hideIcons: ["guide", "fullscreen", "preview"],
                            toolbar: [
                                "bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|",
                                {
                                    name: "image",
                                    action: handleImageUpload,
                                    className: "fa fa-image",
                                    title: "Insert Image",
                                },
                                "|", "link", "table", "horizontal-rule",
                                "|", "undo", "redo",
                            ],
                            lineWrapping: true,
                            forceSync: true,
                        }}
                    />
                </div>

                {isModalOpen &&
                    <PasswordCheckModal setIsModalOpen={setIsModalOpen} setIsPasswordCheck={setIsPasswordCheck} setPassword={setPassword}></PasswordCheckModal>
                }

            </form>
        </div>
    );
}
