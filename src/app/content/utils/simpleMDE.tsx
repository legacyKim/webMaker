import React, { useRef, useEffect, memo } from "react";

import type SimpleMDEEditor from 'easymde';
import { debounce } from "lodash";
import dynamic from 'next/dynamic';

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });

interface CustomMDE extends SimpleMDEEditor {
    toolbar_div?: HTMLDivElement;
}

export const MemoizedEditor = memo(function Editor({
    initialContent,
    contentRef
}: {
    initialContent: string;
    contentRef: React.RefObject<SimpleMDEEditor | null>;
}) {
    const editorRef = useRef<CustomMDE | null>(null);
    const contentLoadRef = useRef<boolean>(true);

    const handleEditorMount = (editor: SimpleMDEEditor) => {
        editorRef.current = editor;
        if (contentLoadRef.current) {
            editor.value(initialContent);
            contentLoadRef.current = false;
        }
        if (contentRef) {
            contentRef.current = editorRef.current;
        }
    };

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.value(initialContent);
        }
    }, [initialContent]);

    const ImageUpload = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];

            if (file) {
                const formData = new FormData();
                formData.append("file", file);

                try {
                    const res = await fetch("/content/api", {
                        method: "POST",
                        body: formData,
                    });

                    const data = await res.json();

                    if (data.success) {
                        const imageUrl = data.imageUrl;
                        if (editorRef.current) {
                            const editor = editorRef.current;
                            const cursor = editor.codemirror.getCursor();
                            const currentValue = editor.value();

                            const newValue = `${currentValue.slice(0, editor.codemirror.indexFromPos(cursor))}![image](${imageUrl})${currentValue.slice(editor.codemirror.indexFromPos(cursor))}`;

                            editor.value(newValue);

                            editor.codemirror.setCursor(cursor.line, cursor.ch + 1);
                        }
                    } else {
                        throw new Error("Upload failed");
                    }
                } catch (error) {
                    console.error(error);
                    alert("이미지 업로드 실패");
                }
            }
        };

        input.click();
    };

    useEffect(() => {

        const handleScroll = debounce(() => {

            if (!editorRef.current) return;

            const editorToolbar = editorRef.current?.toolbar_div;
            if (!editorToolbar) return;

            const scrollY = window.scrollY;
            const triggerPosition = 180;

            if (scrollY > triggerPosition) {
                editorToolbar.style.position = "fxed";
                editorToolbar.style.top = "50%";
                editorToolbar.style.right = "100px";
            } else {
                editorToolbar.style.top = "69%";
                editorToolbar.style.transform = "translateY(-50%)";
            }
        }, 100);

        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <SimpleMDE
            getMdeInstance={handleEditorMount}
            options={{
                spellChecker: false,
                hideIcons: ["guide", "fullscreen"],
                toolbar: [
                    "bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|",
                    {
                        name: "image",
                        action: ImageUpload,
                        className: "fa fa-image",
                        title: "Insert Image",
                    },
                    "|", "link", "table", "horizontal-rule",
                    "|", "undo", "redo", "preview"
                ],
                lineWrapping: true,
                forceSync: true,
            }}
        />
    );
});