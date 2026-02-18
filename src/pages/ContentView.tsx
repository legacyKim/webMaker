import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

interface PostData {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  keywords?: string;
  slug: string;
  created_at: string;
  view: number;
}

export default function ContentView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | "">("");

  useEffect(() => {
    if (!slug) {
      setError("잘못된 URL입니다.");
      setIsLoading(false);
      return;
    }

    // 포스트 데이터 로드
    const loadPost = async () => {
      try {
        // 파일 노드인지 확인 (file-로 시작하는 slug)
        if (slug.startsWith("file-")) {
          // 파일 노드인 경우 서버에서 파일 내용을 가져옴
          const fileName = slug.replace("file-", "") + ".txt";

          try {
            const response = await fetch(`/api/txt-file/${fileName}`);
            const result = await response.json();

            if (response.ok) {
              const fileData = JSON.parse(result.content);
              setPost({
                id: slug,
                title: fileData.title || fileName.replace(".txt", ""),
                subtitle: fileData.subtitle || "",
                content: fileData.content || "내용을 불러올 수 없습니다.",
                keywords: fileData.keywords || "",
                slug: slug,
                created_at: fileData.created_at || new Date().toISOString(),
                view: 0, // 파일 노드는 조회수 추적 안함
              });
            } else {
              throw new Error("파일을 찾을 수 없습니다.");
            }
          } catch (fileError) {
            console.error("파일 로드 오류:", fileError);
            setError("파일을 불러오는 중 오류가 발생했습니다.");
          }
        } else {
          // 기존 localStorage 로직
          const savedPosts = JSON.parse(localStorage.getItem("posts") || "[]");
          const foundPost = savedPosts.find((p: PostData) => p.slug === slug);

          if (foundPost) {
            setPost(foundPost);
            // 조회수 증가
            foundPost.view = (foundPost.view || 0) + 1;
            localStorage.setItem("posts", JSON.stringify(savedPosts));
          } else {
            // 샘플 데이터 반환
            setPost({
              id: "sample",
              title: "샘플 포스트",
              subtitle: "이것은 샘플 포스트입니다",
              content: `# 샘플 포스트

이것은 **마크다운**으로 작성된 샘플 포스트입니다.

## 주요 기능

- 마크다운 렌더링
- 코드 신택스 하이라이팅
- 이미지 및 링크 지원

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

> 이것은 인용구입니다.

**포스트가 없으면 이 샘플이 보입니다.**`,
              keywords: "샘플,마크다운,테스트",
              slug: slug,
              created_at: new Date().toISOString(),
              view: 1,
            });
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

  const handleEdit = () => {
    // Write 페이지로 이동하면서 현재 포스트 데이터 전달
    navigate(`/write?edit=${slug}`);
  };

  const handleDelete = () => {
    if (!confirm("정말로 이 포스트를 삭제하시겠습니까?")) return;

    const savedPosts = JSON.parse(localStorage.getItem("posts") || "[]");
    const filteredPosts = savedPosts.filter((p: PostData) => p.slug !== slug);
    localStorage.setItem("posts", JSON.stringify(filteredPosts));

    alert("포스트가 삭제되었습니다.");
    navigate("/content");
  };

  const getRelativeDate = (dateString: string) => {
    const inputDate = new Date(dateString);
    const currentDate = new Date();
    const diffTime = currentDate.getTime() - inputDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    return `${diffDays}일 전`;
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
        <div className="view_content_title">
          <h1>{post.title}</h1>
          {post.subtitle && <h2>{post.subtitle}</h2>}
        </div>

        <div className="view_actions">
          <button onClick={handleEdit}>
            <i className="icon-edit-alt"></i>
            편집
          </button>

          <button onClick={handleDelete} className="delete-btn">
            <i className="icon-trash"></i>
            삭제
          </button>
        </div>
      </div>

      <div className="content_line">
        <div className="view_content_sub">
          <div className="view_info">
            <div className="view_info_box">
              <i className="icon-clock-1"></i>
              <span>{getRelativeDate(post.created_at)}</span>
            </div>

            <div className="view_info_box">
              <i className="icon-eye"></i>
              <span>{post.view}회</span>
            </div>

            {post.keywords && (
              <div className="view_keywords">
                {post.keywords.split(",").map((keyword, index) => (
                  <button key={index} className="keyword-tag">
                    {keyword.trim()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="simpoeMDE_custom">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
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
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      <div className="view_footer">
        <Link to="/content" className="back-link">
          <i className="icon-back"></i>
          목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
