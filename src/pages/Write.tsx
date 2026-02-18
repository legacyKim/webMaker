import { useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SimpleMDE from "react-simplemde-editor";
import slugify from "slugify";

interface PostData {
  title: string;
  subtitle: string;
  content: string;
  keywords: string;
  slug: string;
}

export default function Write() {
  const navigate = useNavigate();
  const [postData, setPostData] = useState<PostData>({
    title: "",
    subtitle: "",
    content: "",
    keywords: "",
    slug: "",
  });

  const [isPreview, setIsPreview] = useState(false);
  const simpleMDEInstance = useRef<any>(null);

  // 제목 변경 시 자동으로 slug 생성
  const handleTitleChange = useCallback((title: string) => {
    const generatedSlug = slugify(title, {
      lower: true,
      strict: true,
      locale: "ko",
    });

    setPostData((prev) => ({
      ...prev,
      title,
      slug: generatedSlug,
    }));
  }, []);

  // .txt 파일로 저장하는 기능
  const handleSave = useCallback(async () => {
    if (!postData.title.trim()) {
      alert("제목을 입력해주세요!");
      return;
    }

    if (!postData.content.trim()) {
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
          title: postData.title,
          content: postData.content,
          subtitle: postData.subtitle,
          keywords: postData.keywords,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`파일이 성공적으로 저장되었습니다!\n파일명: ${result.fileName}`);
        // 저장 후 Download 페이지로 이동
        navigate("/content/download");
      } else {
        alert("저장 중 오류가 발생했습니다: " + result.error);
      }
    } catch (error) {
      console.error("저장 오류:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  }, [postData, navigate]);

  // 마크다운 에디터 설정
  const simpleMDEOptions = useMemo(
    () =>
      ({
        spellChecker: false,
        placeholder: "마크다운으로 작성해보세요...",
        autofocus: true,
        tabSize: 2,
      }) as any,
    [],
  );

  return (
    <div className="write">
      <div className="write_header">
        <input
          type="text"
          className="write_title"
          placeholder="제목을 입력하세요"
          value={postData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />

        <input
          type="text"
          className="write_subtitle"
          placeholder="부제목 (선택사항)"
          value={postData.subtitle}
          onChange={(e) =>
            setPostData((prev) => ({ ...prev, subtitle: e.target.value }))
          }
        />

        <div className="write_meta">
          <input
            type="text"
            placeholder="키워드 (쉼표로 구분)"
            value={postData.keywords}
            onChange={(e) =>
              setPostData((prev) => ({ ...prev, keywords: e.target.value }))
            }
          />

          <input
            type="text"
            placeholder="URL 슬러그"
            value={postData.slug}
            onChange={(e) =>
              setPostData((prev) => ({ ...prev, slug: e.target.value }))
            }
          />
        </div>

        <div className="write_actions">
          <button onClick={() => setIsPreview(!isPreview)}>
            <i className="icon-eye"></i>
            {isPreview ? "에디터" : "미리보기"}
          </button>

          <button onClick={handleSave} className="save-btn">
            <i className="icon-floppy"></i>
            저장
          </button>

          <button onClick={() => navigate("/content/download")}>
            <i className="icon-download"></i>
            파일 관리
          </button>

          <button onClick={() => navigate(-1)}>
            <i className="icon-cancel"></i>
            취소
          </button>
        </div>
      </div>

      <div className="write_content">
        {!isPreview ? (
          <SimpleMDE
            ref={simpleMDEInstance}
            value={postData.content}
            onChange={(value) =>
              setPostData((prev) => ({ ...prev, content: value }))
            }
            options={simpleMDEOptions}
            events={{
              save: handleSave,
            }}
          />
        ) : (
          <div className="preview_content">
            <h1>{postData.title}</h1>
            {postData.subtitle && (
              <p className="subtitle">{postData.subtitle}</p>
            )}

            <div className="markdown-content">
              {/* 여기에 마크다운 렌더링 결과를 표시 */}
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {postData.content}
              </pre>
            </div>

            {postData.keywords && (
              <div className="keywords">
                <strong>키워드: </strong>
                {postData.keywords.split(",").map((keyword, index) => (
                  <span key={index} className="keyword-tag">
                    {keyword.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
