import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";

interface PostData {
  title: string;
  subtitle?: string;
  content: string;
  keywords?: string;
  slug: string;
  created_at: string;
  updated_at?: string;
  isFileNode?: boolean;
}

export default function ContentView() {
  const { slug } = useParams<{ slug: string }>();
  const contentRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const keywordsRef = useRef<HTMLDivElement>(null);

  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | "">("");
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  useEffect(() => {
    if (!slug) {
      setError("잘못된 URL입니다.");
      setIsLoading(false);
      return;
    }

    const loadPost = async () => {
      try {
        if (slug.startsWith("file-")) {
          const fileName = slug.replace("file-", "") + ".txt";
          const response = await fetch(`/api/txt-file/${fileName}`);
          const result = await response.json();

          if (response.ok) {
            const fileData = JSON.parse(result.content);
            setPost({
              title: fileData.title || fileName.replace(".txt", ""),
              subtitle: fileData.subtitle || "",
              content: fileData.content || "내용을 불러올 수 없습니다.",
              keywords: fileData.keywords || "",
              slug: slug,
              created_at: fileData.created_at || new Date().toISOString(),
              updated_at: fileData.updated_at || new Date().toISOString(),
              isFileNode: true,
            });
          } else {
            throw new Error("파일을 찾을 수 없습니다.");
          }
        }
      } catch (err) {
        setError("포스트를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  const handleCancel = () => {
    setIsEditing(false);
    // 원본 데이터로 복원 (페이지 새로고침으로 처리)
    window.location.reload();
  };

  const applyFormat = (command: string, value?: string) => {
    contentRef.current?.focus();
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const handleSave = async () => {
    if (!post) return;

    const title = titleRef.current?.value.trim() || "";
    const content = contentRef.current?.innerHTML || "";
    const keywords = keywordsRef.current?.innerHTML.trim() || post.keywords || "";

    if (!title) {
      alert("제목을 입력해주세요!");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요!");
      return;
    }

    setIsSaving(true);
    try {
      const fileName = post.slug.replace("file-", "") + ".txt";
      const response = await fetch("/api/save-txt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          keywords,
          originalFileName: fileName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 저장 후 데이터 새로고침
        const updated = await fetch(`/api/txt-file/${fileName}`);
        const updatedResult = await updated.json();
        if (updated.ok) {
          const fileData = JSON.parse(updatedResult.content);
          setPost({
            ...post,
            title: fileData.title,
            subtitle: fileData.subtitle || "",
            content: fileData.content,
            keywords: fileData.keywords || "",
            updated_at: new Date().toISOString(),
          });
        }
        setIsEditing(false);
      } else {
        alert("저장 중 오류가 발생했습니다: " + result.error);
      }
    } catch (error) {
      console.error("저장 오류:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const getRelativeDate = (dateString: string) => {
    const inputDate = new Date(dateString);
    const year = inputDate.getFullYear();
    const month = String(inputDate.getMonth() + 1).padStart(2, "0");
    const day = String(inputDate.getDate()).padStart(2, "0");
    const hours = String(inputDate.getHours()).padStart(2, "0");
    const minutes = String(inputDate.getMinutes()).padStart(2, "0");
    
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="icon-spin4 animate-spin"></i>
          로딩 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>오류가 발생했습니다</h2>
        <p>{error}</p>
        <Link to="/content">목록으로 돌아가기</Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="not-found-container">
        <h2>포스트를 찾을 수 없습니다</h2>
        <p>요청하신 포스트가 존재하지 않습니다.</p>
        <Link to="/content">목록으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="view_content">
      <div className="view_content_header">
        <input
          ref={titleRef}
          type="text"
          className="view_content_title"
          defaultValue={post.title}
          placeholder="제목"
        />
      
      </div>

      <div className="view_actions">
        <Link to="/content" className="back-link">
          <i className="icon-list-bullet"></i>
        </Link>
        <button onClick={handleSave} disabled={isSaving}>
          <i className="icon-edit-alt"></i>
        </button>
      </div>
      
      <div className="content_line">
        <div className="view_content_sub">
          <div className="view_info">
            <div className="view_info_box">
              <i className="icon-clock-1"></i>
              <span>{getRelativeDate(post.updated_at ? post.updated_at : post.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
  
      {isEditing && isEditorFocused && (
        <div
          className="editor_toolbar"
          onMouseDown={(event) => event.preventDefault()}
        >
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
      )}

      <div
        className="html_editor_container"
        ref={editorContainerRef}
        onFocusCapture={() => setIsEditorFocused(true)}
        onBlurCapture={(event) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (nextTarget && editorContainerRef.current?.contains(nextTarget)) {
            return;
          }
          setIsEditorFocused(false);
        }}
      >
        <div
          ref={contentRef}
          contentEditable="true"
          className="html_editor"
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />
      </div>

      <div
        ref={keywordsRef}
        className="view_keywords"
        contentEditable="true"
        dangerouslySetInnerHTML={{ __html: post.keywords || "" }}
      />

    </div>
  );
}
