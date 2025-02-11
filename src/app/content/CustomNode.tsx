import React from "react";
import { Handle, Position, NodeProps } from "react-flow-renderer";
import Link from 'next/link';

type NodePosition = {
    id: string;
    position: { x: number; y: number };
};

interface CustomNodeProps extends NodeProps {
    keywordArr: string[];
    onRightClick: (e: React.MouseEvent, node: NodePosition) => void;
    onKeywordClick: (k: string) => void;
}

const CustomNode: React.FC<CustomNodeProps> = ({ data, keywordArr, onRightClick, onKeywordClick }) => {

    const getRelativeDate = (dateString: string) => {
        const inputDate = new Date(dateString);
        const currentDate = new Date();
        const diffTime = currentDate.getTime() - inputDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "오늘";
        if (diffDays === 1) return "어제";
        return `${diffDays}일 전`;
    };

    const beReady = () => {
        alert('준비 중 입니다.');
    }

    const keywordMap = data.keywords !== null ? data.keywords.split(',').map((keyword: string) => keyword.trim()) : [];
    const isActive = keywordArr.some((keyword) => keywordMap.includes(keyword));

    return (
        <div className={`content_factor ${data.lock === 1 ? 'lock' : ''} ${isActive ? 'active' : ''}`} onContextMenu={(e) => {
            e.preventDefault();
            onRightClick(e, data);
        }}>
            <Handle type="source" position={Position.Top} id="a" />
            <Link href={`${data.lock !== 1 ? `/content/view/${encodeURIComponent(data.slug)}` : "#"}`} onClick={(e) => {
                if (data.lock === 1) {
                    e.preventDefault();
                    beReady();
                }
            }}>
                <div className="content_factor_title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d2513c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <path d="M22 4 12 14.01l-3-3"></path>
                    </svg>
                    <h3>{data.title}</h3>
                </div>
                <div className="content_factor_subtitle">
                    <p>{data.subtitle}</p>
                </div>
                {data.keywords && (
                    <div className="content_factor_keywords">
                        {keywordMap.map((k: string, i: number) => {
                            return <button className={keywordArr.includes(k) ? "active" : ""} key={i} onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onKeywordClick(k);
                            }}>{k}</button>;
                        })}
                    </div>
                )}
                <div className="sec_box">
                    <div className="time">
                        <i className="icon-clock-1"></i>
                        <span>{getRelativeDate(data.date)}</span>
                    </div>
                    <div className="view">
                        <i className="icon-eye"></i>
                        <span>{data.view}</span>
                    </div>
                </div>

            </Link>
            <Handle type="target" position={Position.Bottom} id="b" />

        </div>
    );
};

export default CustomNode;
