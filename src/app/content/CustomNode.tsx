import React from "react";
import Link from 'next/link';

import { Handle, Position, NodeProps } from "react-flow-renderer";

const CustomNode = ({ data }: NodeProps<{ title: string; date: string; content: string; subtitle: string, id: string }>) => {

    const getRelativeDate = (dateString: string) => {
        const inputDate = new Date(dateString);
        const currentDate = new Date();
        const diffTime = currentDate.getTime() - inputDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "오늘";
        if (diffDays === 1) return "어제";
        return `${diffDays}일 전`;
    };

    return (
        <div className="content_factor">
            <Handle type="source" position={Position.Top} id="a" />
            <Link className=""
                href={{
                    pathname: "/content/view",
                    query: {
                        id: data.id,
                        title: data.title,
                        date: data.date,
                        subtitle: data.subtitle,
                        content: data.content,
                    },
                }}>
                <div className="content_factor_title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d2513c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="M22 4 12 14.01l-3-3"></path></svg>
                    <h3>{data.title}</h3>
                </div>
                <div className="content_factor_subtitle">
                    <p>{data.subtitle}</p>
                </div>
                <div className="sec_box">
                    <i className="icon-clock-1"></i>
                    <span>{getRelativeDate(data.date)}</span>
                </div>
            </Link>
            <Handle type="target" position={Position.Bottom} id="b" />
        </div>

    );
};

export default CustomNode;
