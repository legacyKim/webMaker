"use client";

import React, { Suspense, useState, useEffect, useRef, memo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import dynamic from 'next/dynamic';
import type SimpleMDEEditor from 'easymde';

import "easymde/dist/easymde.min.css";
import '../../css/simpleMDE.custom.scss';

import PasswordCheckModal from "../../component/Password";

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });
const MemoizedEditor = memo(function Editor({
    initialContent,
    contentRef
}: {
    initialContent: string;
    contentRef: React.RefObject<SimpleMDEEditor | null>;
}) {
    const editorRef = useRef<SimpleMDEEditor | null>(null);
    const contentLoadRef = useRef<boolean>(true);

    const handleEditorMount = (editor: SimpleMDEEditor) => {
        editorRef.current = editor;
        if (contentLoadRef.current) {
            editor.value(initialContent);
            contentLoadRef.current = false;
        }
        if (contentRef) {
            contentRef.current = editorRef.current;
        }
    };

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.value(initialContent);
        }
    }, [initialContent]);

    const handleImageUpload = () => {
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
                            const editor = editorRef.current;
                            const cursor = editor.codemirror.getCursor();
                            const currentValue = editor.value();

                            const newValue = `${currentValue.slice(0, editor.codemirror.indexFromPos(cursor))}![image](${imageUrl})${currentValue.slice(editor.codemirror.indexFromPos(cursor))}`;

                            editor.value(newValue);

                            editor.codemirror.setCursor(cursor.line, cursor.ch + 1);
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
        <SimpleMDE
            getMdeInstance={handleEditorMount}
            options={{
                spellChecker: false,
                hideIcons: ["guide", "fullscreen"],
                toolbar: [
                    "bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|",
                    {
                        name: "image",
                        action: handleImageUpload,
                        className: "fa fa-image",
                        title: "Insert Image",
                    },
                    "|", "link", "table", "horizontal-rule",
                    "|", "undo", "redo", "preview"
                ],
                lineWrapping: true,
                forceSync: true,
            }}
        />
    );
});

export default function Correct() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
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
                    <MemoizedEditor initialContent={initialContent} contentRef={contentRef} />
                </div>

                {isModalOpen &&
                    <PasswordCheckModal setIsModalOpen={setIsModalOpen} setIsPasswordCheck={setIsPasswordCheck} setPassword={setPassword}></PasswordCheckModal>
                }
            </form>
        </div>
    );
}
