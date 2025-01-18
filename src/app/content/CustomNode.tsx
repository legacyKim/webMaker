import React from "react";
import Link from 'next/link';

import { Handle, Position, NodeProps } from "react-flow-renderer";

const CustomNode = ({ data }: NodeProps<{ title: string; date: string; content: string; subtitle: string, id: string }>) => {
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
                <div className="content_factor_top">
                    <h3>{data.title}</h3>
                    <span>{data.date}</span>
                </div>

                <p>{data.subtitle}</p>
            </Link>
            <Handle type="target" position={Position.Bottom} id="b" />
        </div>

    );
};

export default CustomNode;
