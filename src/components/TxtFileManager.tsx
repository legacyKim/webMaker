import { useState, useEffect, useCallback } from "react";

interface TxtFile {
  name: string;
  title: string;
  author: string;
  created_at: string;
  updated_at: string;
  size: number;
}

export default function TxtFileManager() {
  const [txtFiles, setTxtFiles] = useState<TxtFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState<string | null>(null);

  // 저장된 txt 파일 목록 불러오기
  const loadTxtFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/txt-files");
      const files = await response.json();

      // 파일 데이터 안전 처리
      const safeFiles = files.map((file: any) => ({
        name: file.name || "unknown.txt",
        title: file.title || "제목 없음",
        author: file.author || "작성자 미상",
        created_at: file.created_at || new Date().toISOString(),
        updated_at: file.updated_at || new Date().toISOString(),
        size: file.size || 0,
      }));

      setTxtFiles(safeFiles);
    } catch (error) {
      console.error("파일 목록 로드 오류:", error);
      alert("파일 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 파일 목록 로드
  useEffect(() => {
    loadTxtFiles();
  }, [loadTxtFiles]);

  // 구글 드라이브에 업로드
  const uploadToGoogleDrive = useCallback(async (fileName: string) => {
    setUploadLoading(fileName);
    try {
      const response = await fetch(`/api/upload-to-drive/${fileName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderName: "webMaker", // 구글 드라이브 폴더명
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `${fileName} 파일이 구글 드라이브에 성공적으로 업로드되었습니다!`,
        );
      } else {
        alert("업로드 중 오류가 발생했습니다: " + result.error);
      }
    } catch (error) {
      console.error("구글 드라이브 업로드 오류:", error);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadLoading(null);
    }
  }, []);

  // 파일 내용 보기
  const viewFileContent = useCallback(async (fileName: string) => {
    try {
      const response = await fetch(`/api/txt-file/${fileName}`);
      const result = await response.json();

      if (response.ok) {
        // 새 창에서 파일 내용 보여주기
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          const fileData = JSON.parse(result.content);
          newWindow.document.write(`
            <html>
              <head>
                <title>${fileData.title || fileName}</title>
                <style>
                  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                  .header { border-bottom: 1px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; }
                  .content { white-space: pre-wrap; line-height: 1.6; }
                  .meta { color: #666; font-size: 14px; margin: 10px 0; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>${fileData.title || fileName}</h1>
                  ${fileData.subtitle ? `<h2>${fileData.subtitle}</h2>` : ""}
                  <div class="meta">작성자: ${fileData.author || "알 수 없음"}</div>
                  <div class="meta">작성일: ${new Date(fileData.created_at).toLocaleString()}</div>
                  ${fileData.keywords ? `<div class="meta">키워드: ${fileData.keywords}</div>` : ""}
                </div>
                <div class="content">${fileData.content}</div>
              </body>
            </html>
          `);
          newWindow.document.close();
        }
      } else {
        alert("파일을 읽는 중 오류가 발생했습니다: " + result.error);
      }
    } catch (error) {
      console.error("파일 읽기 오류:", error);
      alert("파일을 읽는 중 오류가 발생했습니다.");
    }
  }, []);

  return (
    <div className="txt-file-manager">
      <div className="manager-header">
        <h2>저장된 .txt 파일 관리</h2>
        <button onClick={loadTxtFiles} disabled={loading}>
          <i className="icon-arrows-cw"></i>
          {loading ? "불러오는 중..." : "새로고침"}
        </button>
      </div>

      {loading ? (
        <div className="loading">파일 목록을 불러오는 중...</div>
      ) : (
        <div className="file-list">
          {txtFiles.length === 0 ? (
            <div className="no-files">저장된 파일이 없습니다.</div>
          ) : (
            <table className="file-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>수정일</th>
                  <th>크기</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {txtFiles.map((file, index) => (
                  <tr key={`${file.name}-${index}`}>
                    <td>
                      <strong>{file.title || "제목 없음"}</strong>
                      <br />
                      <small style={{ color: "#666" }}>
                        {file.name || "파일명 없음"}
                      </small>
                    </td>
                    <td>{file.author || "작성자 미상"}</td>
                    <td>{new Date(file.updated_at).toLocaleString()}</td>
                    <td>{Math.round((file.size || 0) / 1024)}KB</td>
                    <td>
                      <div className="file-actions">
                        <button
                          onClick={() => viewFileContent(file.name || "")}
                          title="파일 내용 보기"
                          disabled={!file.name}
                        >
                          <i className="icon-eye"></i>
                          보기
                        </button>

                        <button
                          onClick={() => uploadToGoogleDrive(file.name || "")}
                          disabled={uploadLoading === file.name || !file.name}
                          title="구글 드라이브에 업로드"
                          style={{
                            backgroundColor: "#4285f4",
                            color: "white",
                            marginLeft: "5px",
                          }}
                        >
                          <i className="icon-cloud-upload"></i>
                          {uploadLoading === file.name
                            ? "업로드 중..."
                            : "구글 업로드"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <style>{`
        .txt-file-manager {
          max-width: 1000px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 15px;
        }

        .manager-header h2 {
          margin: 0;
          color: #333;
        }

        .file-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .file-table th,
        .file-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        .file-table th {
          background-color: #f5f5f5;
          font-weight: bold;
          color: #555;
        }

        .file-table tbody tr:hover {
          background-color: #f8f9fa;
        }

        .file-actions {
          display: flex;
          gap: 5px;
        }

        .file-actions button {
          padding: 6px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .file-actions button:hover {
          background-color: #e9ecef;
        }

        .file-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading,
        .no-files {
          text-align: center;
          padding: 40px;
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
