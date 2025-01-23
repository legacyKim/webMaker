import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import rehypeSanitize from 'rehype-sanitize';

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeProps {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}

interface BlogEditorProps {
    content: string | null;
}

const components: Components = {
    code({ inline, className, children, ...props }: CodeProps) {
        const match = /language-(\w+)/.exec(className || "");
        return !inline && match ? (
            <SyntaxHighlighter
                style={atomDark}
                language={match[1]}
                PreTag="div"
                {...props}
            >
                {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
        ) : (
            <code className={className} {...props}>
                {children}
            </code>
        );
    },
};

export default function BlogPost({ content }: BlogEditorProps) {

    return (
        <div className="css_except">
            <ReactMarkdown
                components={components}
                rehypePlugins={[rehypeSanitize]}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
