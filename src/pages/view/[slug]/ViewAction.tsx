"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import PasswordCheckModal from "../../../component/Password.js";

type ContentData = {
    id: number;
    data: {
        title: string;
        date: string;
        content: string;
    };
    slug: string;
    keywords: string;
    view: number;
};

async function updateViewCount({ contentData }: { contentData: ContentData }) {
    try {
        await fetch(`/content/api/${contentData?.slug}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ view: contentData?.view }),
        });
    } catch (error) {
        console.error("조회수 업데이트 오류:", error);
    }
}

export default function ContentActions({ contentData }: { contentData: ContentData }) {

    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPasswordCheck, setIsPasswordCheck] = useState(false);
    const [Password, setPassword] = useState("");

    const hasUpdated = useRef(false);

    useEffect(() => {
        if (!hasUpdated.current) {
            hasUpdated.current = true;
            updateViewCount({ contentData });
        }
    }, [hasUpdated]);

    const handleDelete = async () => {
        const dataToSend = {
            type: "content",
            Password,
            id: contentData.id,
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
                const errorData = await response.json();
                alert(errorData.message || "패스워드가 올바르지 않습니다.");
            }
        } catch (error) {
            console.error("Error deleting content:", error);
        }
    };

    const handleCorrect = async () => {
        if (!contentData?.slug) {
            return;
        }
        router.push(`/content/correct?slug=${contentData?.slug}`);
    };

    useEffect(() => {
        if (isPasswordCheck) {
            handleDelete();
        }
    }, [isPasswordCheck]);

    // sidebar Event
    const [headings, setHeadings] = useState<HTMLHeadingElement[]>([]);
    const [headingIndex, setHeadingIndex] = useState<number>();

    useEffect(() => {
        const h1Elements = document.querySelectorAll("h1");
        setHeadings(Array.from(h1Elements));
    }, [contentData]);

    const scrollToHeading = (index: number) => {
        if (!headings[index]) return;
        const target = headings[index];
        const offset = 60;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({ top, behavior: "smooth" });
        headings[index].classList.add("active");
    };

    const [sidebarOpen, setSidebarOpen] = useState("");

    return (
        <>
            <div className={`sidebar ${sidebarOpen}`}>
                {headings.length !== 0 && (
                    <button className="sidebar_btn" onClick={() => {
                        if (sidebarOpen === "") {
                            setSidebarOpen("active")
                        } else {
                            setSidebarOpen("")
                        }
                    }}>
                        <i className="icon-list-bullet"></i>
                    </button>
                )}

                <h3>Index</h3>
                <ul className="index_list">
                    {headings.map((heading, index) => (
                        <li key={index} className={`${headingIndex === index ? "active" : ""}`}>
                            <button onClick={() => { scrollToHeading(index); setHeadingIndex(index); }}>
                                {heading.textContent}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="btn_wrap">
                <button className="customBtn" onClick={() => setIsModalOpen(true)}>
                    <i className="icon-trash-2"></i>
                </button>
                <button className="customBtn" onClick={handleCorrect}>
                    <i className="icon-vector-pencil"></i>
                </button>
            </div>

            {isModalOpen && (
                <PasswordCheckModal
                    setIsModalOpen={setIsModalOpen}
                    setIsPasswordCheck={setIsPasswordCheck}
                    setPassword={setPassword}
                />
            )}
        </>
    );
}
