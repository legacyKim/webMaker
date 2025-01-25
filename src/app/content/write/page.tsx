"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import dynamic from 'next/dynamic';

import "easymde/dist/easymde.min.css";
import { ChangeEvent } from "react";
import type SimpleMDEEditor from 'easymde';

import '../../css/simpleMDE.custom.scss';

import PasswordCheckModal from "../../component/Password"

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });

export default function Write() {

    const router = useRouter();

    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        content: "",
    });

    const currentDate = new Date().toISOString().split("T")[0];

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const editorRef = useRef<SimpleMDEEditor | null>(null);

    const handleEditorMount = (editor: SimpleMDEEditor) => {
        editorRef.current = editor;
    };

    const handleSubmit = async () => {

        const content = editorRef.current?.value() || "";

        const dataToSend = {
            ...formData,
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
                console.log("Content created successfully!");
                router.push("/content");
            } else {
                console.error("Failed to create project");
            }
        } catch (error) {
            console.error("Error:", error);
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
                <div>
                    <input
                        className="write_title"
                        type="text"
                        name="title"
                        value={formData.title}
                        placeholder="Title"
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <input
                        className="write_subtitle"
                        type="text"
                        name="subtitle"
                        value={formData.subtitle}
                        placeholder="Subtitle"
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <SimpleMDE
                        getMdeInstance={handleEditorMount}
                        options={{
                            spellChecker: false,
                            hideIcons: ["guide", "fullscreen", "side-by-side", "image"],
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
