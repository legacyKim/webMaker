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

    const handleImageUpload = (editor: SimpleMDEEditor) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];

            if (file) {
                const formData = new FormData();
                formData.append("file", file);

                try {
                    const res = await fetch("/content/api", {
                        method: "POST",
                        body: formData,
                    });

                    const data = await res.json();

                    if (data.success) {
                        const imageUrl = data.imageUrl;
                        if (editorRef.current) {
                            const newValue = `${editorRef.current.value()} ![image](${imageUrl})`;
                            editorRef.current.value(newValue);
                        } 
                    } else {
                        throw new Error("Upload failed");
                    }
                } catch (error) {
                    console.error(error);
                    alert("이미지 업로드 실패");
                }
            }
        };

        input.click();
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
                                    action: () => {
                                        if (editorRef.current) {
                                            handleImageUpload(editorRef.current);
                                        }
                                    },
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
