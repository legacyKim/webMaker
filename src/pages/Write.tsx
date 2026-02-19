import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface PostData {
  title: string;
  content: string;
  keywords: string;
}

const sanitizeTitle = (value: string) =>
  value.replace(/[^0-9A-Za-z\u3131-\u318e\uac00-\ud7a3\s]/g, "");

export default function Write() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editSlug = searchParams.get("edit");
  const contentRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);

  const [postData, setPostData] = useState<PostData>({
    title: "",
    content: "",
    keywords: "",
  });

  // Edit 모드일 때 데이터 로드
  useEffect(() => {
    if (editSlug) {
      const loadEditData = async () => {
        try {
          if (editSlug.startsWith("file-")) {
            const fileId = editSlug.replace("file-", "");
            const response = await fetch(`/api/txt-file/id/${fileId}`);
            const result = await response.json();
            if (response.ok) {
              const fileData = JSON.parse(result.content);
              setOriginalFileName(result.fileName || null);
              setPostData({
                title: fileData.title || "",
                content: fileData.content || "",
                keywords: fileData.keywords || "",
              });
            }
          }
        } catch (error) {
          console.error("Edit 데이터 로드 오류:", error);
          alert("데이터를 불러오는 중 오류가 발생했습니다.");
        }
      };
      loadEditData();
    }
  }, [editSlug]);

  // 텍스트 포맷팅 적용
  const applyFormat = (command: string, value?: string) => {
    contentRef.current?.focus();
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  // .txt 파일로 저장하는 기능
  const handleSave = useCallback(async () => {
    const title = postData.title.trim();
    const content = contentRef.current?.innerHTML || "";
    const keywords = postData.keywords;

    if (!title) {
      alert("제목을 입력해주세요!");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요!");
      return;
    }

    try {
      const response = await fetch("/api/save-txt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          keywords,
          originalFileName: editSlug ? originalFileName : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const action = editSlug ? "수정" : "저장";
        alert(`파일이 성공적으로 ${action}되었습니다!\n파일명: ${result.fileName}`);
        navigate("/content/download");
      } else {
        alert("저장 중 오류가 발생했습니다: " + result.error);
      }
    } catch (error) {
      console.error("저장 오류:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  }, [postData, navigate, editSlug, contentRef]);

  return (
    <div className="write">
      <div className="write_header">
        <input
          type="text"
          className="write_title"
          placeholder="제목을 입력하세요"
          value={postData.title}
          onChange={(e) => {
            const nextValue = e.target.value;
            if (isComposingRef.current) {
              setPostData((prev) => ({ ...prev, title: nextValue }));
              return;
            }
            const sanitized = sanitizeTitle(nextValue);
            setPostData((prev) => ({ ...prev, title: sanitized }));
          }}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={(e) => {
            isComposingRef.current = false;
            const sanitized = sanitizeTitle(e.currentTarget.value);
            setPostData((prev) => ({ ...prev, title: sanitized }));
          }}
        />
      </div>

      {/* HTML 에디터 */}
      <div className="write_content">
        <div
          ref={contentRef}
          contentEditable="true"
          className="html_editor"
          data-placeholder="내용을 입력하세요"
          dangerouslySetInnerHTML={{ __html: postData.content }}
        />
      </div>

      <div className="write_meta">
        <input
          type="text"
          placeholder="키워드 (쉼표로 구분)"
          value={postData.keywords}
          onChange={(e) =>
            setPostData((prev) => ({ ...prev, keywords: e.target.value }))
          }
        />
      </div>

      <div className="write_actions">
        <button onClick={handleSave} className="save-btn">
          <i className="icon-pencil-alt"></i>
        </button>
      </div>

      
      {/* HTML 에디터 툴바 */}
      <div className="editor_toolbar" onMouseDown={(event) => event.preventDefault()}>
        <button type="button" onClick={() => applyFormat("bold")} title="Bold (Ctrl+B)">
          <i className="icon-bold"></i>
        </button>
        <button type="button" onClick={() => applyFormat("italic")} title="Italic (Ctrl+I)">
          <i className="icon-italic"></i>
        </button>
        <button type="button" onClick={() => applyFormat("underline")} title="Underline (Ctrl+U)">
          <i className="icon-underline"></i>
        </button>
        <span className="toolbar_separator"></span>

        <button type="button" onClick={() => applyFormat("createLink", prompt("URL을 입력하세요:") || "")} title="Link">
          <i className="icon-link"></i>
        </button>
      
        <span className="toolbar_separator"></span>

        <button type="button" onClick={() => applyFormat("formatBlock", "<h1>")} title="Heading 1">
          H1
        </button>
        <button type="button" onClick={() => applyFormat("formatBlock", "<h2>")} title="Heading 2">
          H2
        </button>
        <button type="button" onClick={() => applyFormat("formatBlock", "<h3>")} title="Heading 3">
          H3
        </button>
        <span className="toolbar_separator"></span>

        <button type="button" onClick={() => applyFormat("insertUnorderedList")} title="Bullet List">
          <i className="icon-list-bullet"></i>
        </button>
        <button type="button" onClick={() => applyFormat("insertOrderedList")} title="Numbered List">
          <i className="icon-list-bullet"></i>
        </button>
        <button
          type="button"
          onClick={() => {
            document.execCommand("formatBlock", false, "<blockquote>");
            contentRef.current?.focus();
          }}
          title="Quote"
        >
          <i className="icon-quote-left"></i>
        </button>
      </div>
    </div>
  );
}
