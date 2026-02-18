import React from "react";
import { Handle, Position, NodeProps } from "react-flow-renderer";
import { Link } from "react-router-dom";

interface CustomNodeProps extends NodeProps {
  keywordArr?: string[];
  onRightClick?: (e: React.MouseEvent, node: any) => void;
  onKeywordClick?: (k: string) => void;
}

const CustomNode: React.FC<CustomNodeProps> = ({
  data,
  keywordArr = [],
  onRightClick,
  onKeywordClick,
}) => {
  const getRelativeDate = (dateString: string) => {
    const inputDate = new Date(dateString);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - inputDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    return `${diffDays}일 전`;
  };

  const keywords = data.keywords
    ? data.keywords.split(",").map((k: string) => k.trim())
    : [];
  const isActive = keywordArr.some((keyword) => keywords.includes(keyword));

  // 파일에서 온 노드인지 확인
  const isFileNode = data.source === "file";

  return (
    <div
      className={`content_factor ${isActive ? "active" : ""} ${isFileNode ? "file-node" : ""}`}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onRightClick) onRightClick(e, data);
      }}
    >
      <Handle type="source" position={Position.Top} id="a" />

      <Link to={`/content/view/${encodeURIComponent(data.slug || data.id)}`}>
        <div className="content_factor_title">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isFileNode ? "#4285f4" : "#d2513c"}
            strokeWidth="2"
          >
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
            {keywords.map((k: string, i: number) => (
              <button
                key={i}
                className={keywordArr.includes(k) ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onKeywordClick) onKeywordClick(k);
                }}
              >
                {k}
              </button>
            ))}
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
