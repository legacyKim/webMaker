"use client";

import React, { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import dynamic from 'next/dynamic';
import "easymde/dist/easymde.min.css";
import { ChangeEvent } from "react";

import '../../css/simpleMDE.custom.scss';

import PasswordCheckModal from "../../component/Password"

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });

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

    const [formData, setFormData] = useState({
        title: "",
        subtitle: "",
        content: "",
    });

    const currentDate = new Date().toISOString().split("T")[0];

    useEffect(() => {
        const title = searchParams.get("title") || "";
        const subtitle = searchParams.get("subtitle") || "";
        const content = searchParams.get("content") || "";

        setFormData({
            title,
            subtitle,
            content: content ? content.replace(/\\n/g, '\n') : "",
        });
    }, [searchParams]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const contentRef = useRef(formData.content);

    const handleSubmit = async () => {

        const content = contentRef.current || "";
        const contentId = searchParams.get("id");

        const dataToSend = {
            ...formData,
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
                console.log("Content updated successfully!");
                router.push(`/content`);
            } else {
                console.error("Failed to update project");
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
                        <i className="icon-vector-pencil"></i>
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
                <div className="content_line">
                    <input
                        className="write_subtitle"
                        type="text"
                        name="subtitle"
                        value={formData.subtitle}
                        placeholder="Subtitle"
                        onChange={handleChange}
                    />
                </div>
                <div className="simpleMDE_wrap">
                    <SimpleMDE
                        value={formData.content}
                        onChange={(value) => {
                            contentRef.current = value;
                        }}
                    
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
