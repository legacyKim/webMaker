import { useState, useEffect, useCallback } from "react";

interface TxtFile {
  name: string;
  title: string;
  created_at: string;
  updated_at: string;
  size: number;
}

export default function Download() {
  const [txtFiles, setTxtFiles] = useState<TxtFile[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"local" | "drive">("local");

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

  // 구글 드라이브 파일 목록 불러오기
  const loadDriveFiles = useCallback(async () => {
    setDriveLoading(true);
    try {
      const response = await fetch("/api/drive/webMaker/files");
      const result = await response.json();
      setDriveFiles(result.files || []);
    } catch (error) {
      console.error("구글 드라이브 파일 목록 로드 오류:", error);
      alert("구글 드라이브 파일 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setDriveLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 파일 목록 로드
  useEffect(() => {
    loadTxtFiles();
  }, [loadTxtFiles]);

  // 탭 변경시 해당 파일 목록 로드
  useEffect(() => {
    if (activeTab === "drive") {
      loadDriveFiles();
    }
  }, [activeTab, loadDriveFiles]);

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
        if (result.error.includes("credentials.json")) {
          alert(
            "구글 드라이브 업로드를 위해서는 credentials.json 파일 설정이 필요합니다.\nGOOGLE_DRIVE_SETUP.md 파일을 참고해주세요.",
          );
        } else {
          alert("업로드 중 오류가 발생했습니다: " + result.error);
        }
      }
    } catch (error) {
      console.error("구글 드라이브 업로드 오류:", error);
      alert("구글 드라이브 연결에 실패했습니다. 설정을 확인해주세요.");
    } finally {
      setUploadLoading(null);
    }
  }, []);

  // 로컬 다운로드
  const downloadFile = useCallback(async (fileName: string) => {
    try {
      const response = await fetch(`/api/txt-file/${fileName}`);
      const result = await response.json();

      if (response.ok) {
        const blob = new Blob([result.content], {
          type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("다운로드 중 오류가 발생했습니다: " + result.error);
      }
    } catch (error) {
      console.error("다운로드 오류:", error);
      alert("다운로드 중 오류가 발생했습니다.");
    }
  }, []);

  return (
    <div className="download">
      <div className="download-header">
        <h2>파일 관리</h2>
        <div className="header-actions">
          <div className="tabs">
            <button
              className={activeTab === "local" ? "active" : ""}
              onClick={() => setActiveTab("local")}
            >
              로컬 파일
            </button>
            <button
              className={activeTab === "drive" ? "active" : ""}
              onClick={() => setActiveTab("drive")}
            >
              구글 드라이브
            </button>
          </div>

          {activeTab === "local" ? (
            <button onClick={loadTxtFiles} disabled={loading}>
              {loading ? "불러오는 중..." : "새로고침"}
            </button>
          ) : (
            <button onClick={loadDriveFiles} disabled={driveLoading}>
              {driveLoading ? "불러오는 중..." : "드라이브 새로고침"}
            </button>
          )}
        </div>
      </div>

      {activeTab === "local" ? (
        // 로컬 파일 목록
        loading ? (
          <div className="loading">파일 목록을 불러오는 중...</div>
        ) : (
          <div className="file-list">
            {txtFiles.length === 0 ? (
              <p>저장된 파일이 없습니다.</p>
            ) : (
              <table className="file-table">
                <thead>
                  <tr>
                    <th>제목</th>
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
                      <td>{new Date(file.updated_at).toLocaleString()}</td>
                      <td>{Math.round((file.size || 0) / 1024)}KB</td>
                      <td>
                        <div className="file-actions">
                          <button
                            onClick={() => downloadFile(file.name || "")}
                            title="로컬에 다운로드"
                            disabled={!file.name}
                          >
                            📥 다운로드
                          </button>

                          <button
                            onClick={() => uploadToGoogleDrive(file.name || "")}
                            disabled={uploadLoading === file.name || !file.name}
                            title="구글 드라이브에 업로드"
                            style={{
                              backgroundColor: "#4285f4",
                              color: "white",
                            }}
                          >
                            ☁️{" "}
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
        )
      ) : // 구글 드라이브 파일 목록
      driveLoading ? (
        <div className="loading">구글 드라이브 파일 목록을 불러오는 중...</div>
      ) : (
        <div className="file-list">
          {driveFiles.length === 0 ? (
            <p>구글 드라이브에 파일이 없습니다.</p>
          ) : (
            <table className="file-table">
              <thead>
                <tr>
                  <th>파일명</th>
                  <th>크기</th>
                  <th>수정일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {driveFiles.map((file, index) => (
                  <tr key={`drive-${file.id}-${index}`}>
                    <td>
                      <strong>{file.name}</strong>
                    </td>
                    <td>{file.size ? Math.round(file.size / 1024) : 0}KB</td>
                    <td>{new Date(file.modifiedTime).toLocaleString()}</td>
                    <td>
                      <div className="file-actions">
                        <a
                          href={`https://drive.google.com/file/d/${file.id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <button>👁️ 드라이브에서 보기</button>
                        </a>
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
        .download {
          max-width: 1200px;
          margin: 20px auto;
          padding: 20px;
        }

        .download-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }

        .download-header h2 {
          margin: 0;
          color: #333;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .tabs {
          display: flex;
          gap: 10px;
        }

        .tabs button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tabs button.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .tabs button:hover:not(.active) {
          background: #f8f9fa;
        }

        .download-header button:not(.tabs button) {
          padding: 10px 20px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }

        .download-header button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #666;
        }

        .file-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          background: white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        .file-table th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #dee2e6;
        }

        .file-table td {
          padding: 15px;
          border-bottom: 1px solid #dee2e6;
          vertical-align: top;
        }

        .file-table tr:hover {
          background-color: #f8f9fa;
        }

        .file-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .file-actions button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .file-actions button:first-child {
          background: #28a745;
          color: white;
        }

        .file-actions button:nth-child(2) {
          background: #6c757d;
          color: white;
        }

        .file-actions button:hover {
          opacity: 0.8;
        }

        .file-actions button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .file-list p {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
