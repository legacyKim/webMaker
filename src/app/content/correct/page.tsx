"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import "easymde/dist/easymde.min.css";
import { ChangeEvent, FormEvent } from "react";
import type SimpleMDEEditor from 'easymde';

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });

export default function Correct() {

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
            content: content.replace(/\\n/g, '\n'),
        });
    }, [searchParams]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const editorRef = useRef<SimpleMDEEditor | null>(null);

    const handleEditorMount = (editor: SimpleMDEEditor) => {
        editorRef.current = editor;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const content = editorRef.current?.value() || "";
        const contentId = searchParams.get("id");

        const dataToSend = {
            ...formData,
            content,
            date: currentDate,
            id: contentId,
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
                console.log("Project updated successfully!");
                router.push(`/content`);
            } else {
                console.error("Failed to update project");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="write">
                <button className="customBtn abs" type="submit">
                    <span>Update</span>
                </button>
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
                        value={formData.content}
                        getMdeInstance={handleEditorMount}
                        options={{
                            spellChecker: false,
                            hideIcons: ["guide", "fullscreen", "side-by-side", "image"],
                            lineWrapping: true,
                            forceSync: true,
                        }}
                    />
                </div>
            </form>
        </div>
    );
}
