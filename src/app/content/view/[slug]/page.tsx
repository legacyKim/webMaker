"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

import BlogPost from "./BlogPost.tsx";
import axios from 'axios';

import PasswordCheckModal from "../../../component/Password.js"

import '../../../css/simpleMDE.custom.scss';
import Loading from "../../../component/Loading.js"

type ContentData = {
    id: number;
    data: {
        title: string;
        subtitle: string;
        date: string;
        content: string;
    };
    slug: string;
};

export default function ViewContent() {

    const { slug } = useParams();
    const router = useRouter();

    const [contentData, setContentData] = useState<ContentData>({
        id: 0,
        data: {
            title: '',
            subtitle: '',
            date: '',
            content: '',
        },
        slug: ''
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (slug) {
                try {
                    const response = await axios.get(`/content/api/${slug}`);
                    console.log(response.data);
                    setContentData(response.data);
                    setIsLoading(false);
                } catch (err) {
                    console.error("데이터 요청 실패", err);
                }
            }
        };
        fetchData();
    }, [slug]);

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

    const handleCorrect = () => {
        if (!contentData?.id) {
            alert("Content ID is missing.");
            return;
        }

        const encodedContent = contentData.data.content ? encodeURIComponent(contentData.data.content) : "";
        router.push(`/content/correct?id=${contentData?.id}&title=${contentData.data.title}&subtitle=${contentData.data.subtitle}&content=${encodedContent}`);
    };

    const [isPasswordCheck, setIsPasswordCheck] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [Password, setPassword] = useState('');

    useEffect(() => {
        if (isPasswordCheck) {
            handleDelete();
        }
    }, [isPasswordCheck]);

    // sidebar Event
    const blogPostRef = useRef<HTMLDivElement>(null);
    const [headings, setHeadings] = useState<HTMLHeadingElement[]>([]);
    const [headingIndex, setHeadingIndex] = useState<number>();

    useEffect(() => {
        if (blogPostRef.current) {
            const h1Elements = blogPostRef.current.querySelectorAll("h1");
            setHeadings(Array.from(h1Elements));
        }
    }, [contentData]);

    const scrollToHeading = (index: number) => {
        headings[index]?.scrollIntoView({ behavior: "smooth" });
        headings[index].classList.add("active");
    };

    const [sidebarOpen, setSidebarOpen] = useState("");

    if (isLoading) {
        return <Loading />
    }

    return (
        <div className="container dark">
            <div className="view_content">
                <div className="view_content_header">
                    <h5 className="view_content_title">{contentData.data.title}</h5>
                    <div className="view_info">
                        <div className="view_info_box">
                            <i className="icon-clock"></i>
                            <span className="view_content_date">{contentData.data.date}</span>
                        </div>
                    </div>
                </div>
                <div className="content_line">
                    <p className="view_content_subtitle">
                        {contentData.data.subtitle}
                    </p>
                </div>
                <div ref={blogPostRef}>
                    <BlogPost content={contentData.data.content} />
                </div>
            </div>

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
                <button className="customBtn" onClick={() => { setIsModalOpen(true); }}>
                    <i className="icon-trash-2"></i>
                </button>
                <button className="customBtn" onClick={handleCorrect}>
                    <i className="icon-vector-pencil"></i>
                </button>
            </div>

            {isModalOpen &&
                <PasswordCheckModal setIsModalOpen={setIsModalOpen} setIsPasswordCheck={setIsPasswordCheck} setPassword={setPassword}></PasswordCheckModal>
            }
        </div>
    );
}
