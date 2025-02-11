import React from "react";
import { Metadata } from "next";

import BlogPost from "./BlogPost.tsx";
import ViewAction from "./ViewAction.tsx";

import '../../../css/simpleMDE.custom.scss';

type ContentData = {
    id: number;
    data: {
        title: string;
        subtitle: string;
        date: string;
        content: string;
    };
    slug: string;
    keywords: string;
    view: number;
};

type PageParams = Promise<{ slug: string }>;

async function fetchContentData(slug: string): Promise<ContentData> {
    try {
        const res = await fetch(`${process.env.API_PORTFOLIO_URL}/content/api/${slug}`, {
            cache: "no-store",
        });
        return res.json();
    } catch (error) {
        console.error("Error fetching content data:", error);
        throw new Error("Failed to fetch content data");
    }
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
    const { slug } = await params;
    try {
        const contentData = await fetchContentData(slug);
        return {
            title: contentData.data.title,
            description: contentData.data.subtitle,
            keywords: contentData.keywords,
        };
    } catch (error) {
        console.log(error);
        return {
            title: "페이지를 찾을 수 없습니다.",
            description: "요청한 페이지가 존재하지 않습니다.",
        };
    }
}

export default async function ViewContent({ params }: { params: PageParams }) {

    const { slug } = await params;
    const contentData = await fetchContentData(slug);
    const keywordArray = contentData.keywords !== null ? contentData.keywords.split(',').map((keyword: string) => keyword.trim()) : [];

    return (
        <div className="container dark">
            <div className="view_content">
                <div className="view_content_header">
                    <h5 className="view_content_title">{contentData.data.title}</h5>
                </div>
                <div className="content_line">
                    <div className="view_content_sub">
                        <p className="view_content_subtitle">
                            {contentData.data.subtitle}
                        </p>

                        <div className="view_info">
                            <div className="view_info_box">
                                <i className="icon-clock"></i>
                                <span className="view_info_box_text">{contentData.data.date}</span>
                            </div>

                            <div className="view_info_box">
                                <i className="icon-eye"></i>
                                <span className="view_info_box_text">{contentData.view + 1}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <BlogPost content={contentData.data.content} />
                </div>
                {keywordArray.length !== 0 && (
                    <div className="view_content_keyword">
                        {keywordArray.map((k: string, i: number) => {
                            return <span key={i}>{k}</span>;
                        })}
                    </div>
                )}
            </div>

            <ViewAction contentData={contentData}></ViewAction>

        </div>
    );
}
