import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import chokidar from "chokidar";
import {
  getContentData,
  saveContentData,
  getEdgeData,
  saveEdgeData,
} from "./fileSystem.js";
import {
  authorize,
  getTokenFromCode,
  uploadFileToFolder,
  getFilesFromFolder,
  downloadFile,
} from "./googleDrive.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3003;

// txt 파일들이 저장될 폴더
const filesFolderPath = path.join(__dirname, "../server/task");
const downloadFolderPath = path.join(__dirname, "../server/download");

// files 폴더가 없으면 생성
if (!fs.existsSync(filesFolderPath)) {
  fs.mkdirSync(filesFolderPath, { recursive: true });
}

if (!fs.existsSync(downloadFolderPath)) {
  fs.mkdirSync(downloadFolderPath, { recursive: true });
}

// 미들웨어
app.use(cors());
app.use(express.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "../dist")));

// ========== 파일 감시자 설정 ==========
// 새 .txt 파일이 생성되면 자동으로 position_x, position_y 추가
const fileWatcher = chokidar.watch(filesFolderPath, {
  persistent: true,
  usePolling: false,
  awaitWriteFinish: {
    stabilityThreshold: 1000, // 파일 쓰기 완료 후 1초 대기
    pollInterval: 100,
  },
});

// 파일 추가 시 핸들러
fileWatcher.on("add", async (filePath) => {
  if (!filePath.endsWith(".txt")) return;

  try {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 파일 쓰기 완료 대기
    const fileName = path.basename(filePath);
    const fileNameWithoutExt = fileName.replace(".txt", "");

    // 파일 내용 읽기
    let fileContent = fs.readFileSync(filePath, "utf8");
    
    // JSON 파싱 시도
    let fileData;
    try {
      fileData = JSON.parse(fileContent);
    } catch (parseError) {
      console.error(`❌ 파일 JSON 파싱 실패: ${fileNameWithoutExt}`, parseError.message);
      // 파일이 유효하지 않은 JSON이면 기본값으로 초기화
      fileData = {
        title: fileNameWithoutExt,
        content: fileContent,
        keywords: "",
        position_x: Math.floor(Math.random() * 800 + 100),
        position_y: Math.floor(Math.random() * 600 + 100),
      };
      fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf8");
      console.log(`✔️ 파일을 유효한 JSON으로 변환하고 position 추가: ${fileNameWithoutExt}`);
      return;
    }

    // position이 유효한 값이 아니면 생성
    if (
      fileData.position_x !== null &&
      fileData.position_x !== undefined &&
      fileData.position_y !== null &&
      fileData.position_y !== undefined &&
      typeof fileData.position_x === "number" &&
      typeof fileData.position_y === "number"
    ) {
      console.log(`✅ 파일에 이미 유효한 position이 있습니다: ${fileNameWithoutExt}`);
      return;
    }

    // 랜덤 위치 생성
    fileData.position_x = Math.floor(Math.random() * 800 + 100); // 100~900
    fileData.position_y = Math.floor(Math.random() * 600 + 100); // 100~700

    // 파일에 다시 저장
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf8");
    console.log(`✅ 파일에 position 추가됨: ${fileNameWithoutExt} (${fileData.position_x}, ${fileData.position_y})`);
  } catch (error) {
    console.error(`❌ 파일 감시 중 오류 (add): ${filePath}`, error.message);
  }
});

// 파일 삭제 시 핸들러 (이제는 파일 자체가 삭제되므로 추가 작업 없음)
fileWatcher.on("unlink", async (filePath) => {
  if (!filePath.endsWith(".txt")) return;
  const fileName = path.basename(filePath);
  const fileNameWithoutExt = fileName.replace(".txt", "");
  console.log(`🗑️ 파일이 삭제됨: ${fileNameWithoutExt}`);
});

// ========== 서버 시작 시 기존 파일들 초기화 ==========
async function initializeFileNodes() {
  try {
    if (!fs.existsSync(filesFolderPath)) return;

    const files = fs
      .readdirSync(filesFolderPath)
      .filter((file) => file.endsWith(".txt"));

    for (const fileName of files) {
      const filePath = path.join(filesFolderPath, fileName);
      try {
        let fileContent = fs.readFileSync(filePath, "utf8");
        const fileData = JSON.parse(fileContent);

        // position이 유효한 값이 아니면 추가
        if (
          fileData.position_x === null ||
          fileData.position_x === undefined ||
          fileData.position_y === null ||
          fileData.position_y === undefined ||
          typeof fileData.position_x !== "number" ||
          typeof fileData.position_y !== "number"
        ) {
          fileData.position_x = Math.floor(Math.random() * 800 + 100);
          fileData.position_y = Math.floor(Math.random() * 600 + 100);
          fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf8");
          console.log(`✅ 기존 파일 초기화: ${fileName} (${fileData.position_x}, ${fileData.position_y})`);
        }
      } catch (err) {
        console.error(`⚠️ 파일 초기화 실패 (${fileName}):`, err.message);
      }
    }
  } catch (error) {
    console.error("❌ 파일 초기화 중 오류:", error);
  }
}


// ========== API 라우트 ==========

app.get("/api/content", async (req, res) => {
  try {
    // content.json에서 고정 노드 읽기
    const contentData = await getContentData();
    const edgeData = await getEdgeData();

    // server/task 폴더에서 파일 노드 읽기
    let fileNodes = [];
    if (fs.existsSync(filesFolderPath)) {
      const files = fs
        .readdirSync(filesFolderPath)
        .filter((file) => file.endsWith(".txt"));

      fileNodes = files
        .map((file) => {
          try {
            const filePath = path.join(filesFolderPath, file);
            const fileContent = fs.readFileSync(filePath, "utf8");
            const fileData = JSON.parse(fileContent);
            const fileNameWithoutExt = file.replace(".txt", "");

            return {
              id: `file-${fileNameWithoutExt}`,
              type: "custom",
              data: {
                id: `file-${fileNameWithoutExt}`,
                title: fileData.title || fileNameWithoutExt,
                date: fileData.created_at || new Date().toISOString(),
                content: fileData.content || "",
                lock: false,
                fixed: false,
                slug: `file-${fileNameWithoutExt}`,
                keywords: fileData.keywords || "",
                view: 0,
              },
              position: {
                x: typeof fileData.position_x === "number" ? fileData.position_x : 100 + Math.random() * 200,
                y: typeof fileData.position_y === "number" ? fileData.position_y : 100 + Math.random() * 200,
              },
            };
          } catch (err) {
            console.error(`파일 ${file} 읽기 오류:`, err.message);
            return null;
          }
        })
        .filter(Boolean);
    }

    // 고정 노드와 파일 노드 합치기
    const allContentData = [
      ...contentData.map((item) => ({
        id: `${item.id}`,
        type: "custom",
        data: {
          id: item.id,
          title: item.title,
          date: item.created_at,
          content: item.content,
          lock: false,
          fixed: Boolean(item.fixed),
          slug: item.slug || "",
          keywords: item.keyword || "",
          view: item.view || 0,
        },
        position: { x: item.position_x, y: item.position_y },
      })),
      ...fileNodes,
    ];

    console.log(
      `📊 Content API: ${contentData.length}개 고정 노드, ${fileNodes.length}개 파일 노드 반환`,
    );

    res.json({
      contentData: allContentData,
      edgeData,
      staticCount: contentData.length,
      filesCount: fileNodes.length,
    });
  } catch (error) {
    console.error("❌ Content API 오류:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/content", async (req, res) => {
  try {
    const {
      title,
      date,
      content,
      slug,
      source,
      target,
      position,
      keywords,
      view,
    } = req.body;

    let contentId = null;

    if (position) {
      const contentData = await getContentData();
      const newId = `content-${Date.now()}`;

      const newContent = {
        id: newId,
        type: "custom",
        title,
        content,
        position_x: position.x,
        position_y: position.y,
        lock: 0,
        fixed: 0,
        slug,
        keyword: keywords || "",
        view: view || 0,
        created_at: new Date(date || Date.now()).toISOString(),
      };

      contentData.push(newContent);
      await saveContentData(contentData);
      contentId = newId;
    }

    let edgeId = null;

    if (source && target) {
      const edgeData = await getEdgeData();
      const newEdgeId = `edge-${Date.now()}`;

      const newEdge = {
        id: newEdgeId,
        source,
        target,
      };

      edgeData.push(newEdge);
      await saveEdgeData(edgeData);
      edgeId = newEdgeId;
    }

    res.json({
      success: true,
      contentId,
      edgeId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 노드 위치 업데이트 (개별)
app.put("/api/content/:id/position", async (req, res) => {
  try {
    const { id } = req.params;
    const { position_x, position_y } = req.body;

    const contentData = await getContentData();
    const contentIndex = contentData.findIndex((item) => item.id === id);

    if (contentIndex === -1) {
      return res.status(404).json({ success: false, error: "컨텐츠를 찾을 수 없습니다." });
    }

    contentData[contentIndex].position_x = position_x;
    contentData[contentIndex].position_y = position_y;

    await saveContentData(contentData);

    res.json({ success: true, message: "위치가 저장되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 모든 노드 위치 일괄 업데이트
app.put("/api/content/batch/positions", async (req, res) => {
  try {
    const { updates } = req.body; // { nodeId: { position_x, position_y } }

    console.log("📥 batch/positions 요청 받음:", Object.keys(updates));

    let fileUpdateCount = 0;
    let contentUpdateCount = 0;

    for (const [nodeId, { position_x, position_y }] of Object.entries(updates)) {
      // 파일 노드인 경우 (file-xxx)
      if (nodeId.startsWith("file-")) {
        try {
          const fileNameWithoutExt = nodeId.replace("file-", "");
          const filePath = path.join(filesFolderPath, `${fileNameWithoutExt}.txt`);

          if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, "utf8");
            const fileData = JSON.parse(fileContent);

            fileData.position_x = position_x;
            fileData.position_y = position_y;

            fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf8");
            console.log(`✏️ 파일 위치 업데이트: ${fileNameWithoutExt} -> (${position_x}, ${position_y})`);
            fileUpdateCount++;
          } else {
            console.warn(`⚠️ 파일을 찾을 수 없음: ${filePath}`);
          }
        } catch (err) {
          console.error(`❌ 파일 업데이트 실패 (${nodeId}):`, err.message);
        }
      } else {
        // 고정 노드인 경우 content.json에 저장
        try {
          const contentData = await getContentData();
          const contentIndex = contentData.findIndex((item) => item.id === nodeId);

          if (contentIndex !== -1) {
            contentData[contentIndex].position_x = position_x;
            contentData[contentIndex].position_y = position_y;
            await saveContentData(contentData);
            console.log(`✏️ 고정 노드 위치 업데이트: ${nodeId} -> (${position_x}, ${position_y})`);
            contentUpdateCount++;
          } else {
            console.warn(`⚠️ 노드를 찾을 수 없음: ${nodeId}`);
          }
        } catch (err) {
          console.error(`❌ content.json 업데이트 실패 (${nodeId}):`, err.message);
        }
      }
    }

    console.log(`✅ 파일 ${fileUpdateCount}개, 고정 노드 ${contentUpdateCount}개 위치 저장됨`);

    res.json({
      success: true,
      message: `${fileUpdateCount + contentUpdateCount}개 위치가 저장되었습니다.`,
      fileUpdateCount,
      contentUpdateCount,
    });
  } catch (error) {
    console.error("❌ batch/positions 오류:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 엣지 일괄 저장
app.put("/api/edges", async (req, res) => {
  try {
    const { edges } = req.body;

    console.log("📥 edges 저장 요청 받음:", edges.length, "개의 엣지");

    const edgeData = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));

    await saveEdgeData(edgeData);

    console.log(`✅ data/edges.json에 ${edgeData.length}개 엣지 저장됨`);

    res.json({ success: true, message: "엣지가 저장되었습니다.", count: edgeData.length });
  } catch (error) {
    console.error("❌ 엣지 저장 오류:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// .txt 파일로 저장하는 API
app.post("/api/save-txt", async (req, res) => {
  try {
    const { title, content, keywords, originalFileName } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "제목과 내용은 필수입니다." });
    }

    // 파일명 안전하게 처리 (특수문자 제거)
    const sanitizedTitle = (title || "untitled")
      .replace(/[^\p{Script=Hangul}a-zA-Z0-9\s]/gu, "")
      .trim();
    const fileName = originalFileName || `${sanitizedTitle}.txt`;
    const filePath = path.join(filesFolderPath, fileName);

    // 기존 파일이 있는 경우 포지션 유지
    let position_x, position_y;
    let created_at;
    if (originalFileName) {
      const originalFilePath = path.join(filesFolderPath, originalFileName);
      if (fs.existsSync(originalFilePath)) {
        const existingContent = fs.readFileSync(originalFilePath, "utf8");
        const existingData = JSON.parse(existingContent);
        position_x = existingData.position_x;
        position_y = existingData.position_y;
        created_at = existingData.created_at;
      }
    }

    // 포지션이 없으면 새로 생성
    if (position_x === undefined || position_y === undefined) {
      position_x = Math.floor(Math.random() * 800 + 100);
      position_y = Math.floor(Math.random() * 600 + 100);
    }

    // JSON 형태로 저장 (booknote 방식)
    const fileData = JSON.stringify(
      {
        title,
        keywords: keywords || "",
        content,
        created_at: created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        position_x,
        position_y,
      },
      null,
      2,
    );

    fs.writeFileSync(filePath, fileData, "utf8");
    console.log(`✅ 파일 저장/수정: ${fileName} (${position_x}, ${position_y})`);

    res.json({
      success: true,
      message: "파일이 성공적으로 저장되었습니다.",
      fileName,
      filePath,
    });
  } catch (error) {
    console.error("파일 저장 오류:", error);
    res.status(500).json({
      error: "파일 저장 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

// 저장된 .txt 파일 목록 조회
app.get("/api/txt-files", (req, res) => {
  try {
    if (!fs.existsSync(filesFolderPath)) {
      return res.json([]);
    }

    const files = fs
      .readdirSync(filesFolderPath)
      .filter(
        (file) => file && typeof file === "string" && file.endsWith(".txt"),
      );

    const filesWithData = files
      .map((file) => {
        if (!file || typeof file !== "string") {
          return null;
        }

        const filePath = path.join(filesFolderPath, file);

        let stats;
        try {
          stats = fs.statSync(filePath);
        } catch (e) {
          return null;
        }

        try {
          const content = fs.readFileSync(filePath, "utf8");
          const data = JSON.parse(content);
          return {
            name: file,
            title: data.title || file.replace(".txt", ""),
            created_at: data.created_at || stats.birthtime.toISOString(),
            updated_at: data.updated_at || stats.mtime.toISOString(),
            size: stats.size,
          };
        } catch (e) {
          return {
            name: file,
            title: file.replace(".txt", ""),
            created_at: stats.birthtime.toISOString(),
            updated_at: stats.mtime.toISOString(),
            size: stats.size,
          };
        }
      })
      .filter(Boolean); // null 값들 제거

    // 최신순으로 정렬
    filesWithData.sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
    );

    res.json(filesWithData);
  } catch (error) {
    console.error("파일 목록 조회 오류:", error);
    res.status(500).json({
      error: "파일 목록 조회 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

// .txt 파일 내용 조회
app.get("/api/txt-file/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(filesFolderPath, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "파일을 찾을 수 없습니다." });
    }

    const content = fs.readFileSync(filePath, "utf8");
    res.json({ content });
  } catch (error) {
    console.error("파일 읽기 오류:", error);
    res.status(500).json({
      error: "파일 읽기 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

// .txt 파일을 구글 드라이브에 업로드
app.post("/api/upload-to-drive/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const { folderName = "task" } = req.body;

    const filePath = path.join(filesFolderPath, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "파일을 찾을 수 없습니다." });
    }

    const result = await uploadFileToFolder(filePath, filename, folderName);

    res.json({
      success: true,
      message: `파일이 Google Drive의 ${folderName} 폴더에 업로드되었습니다.`,
      fileId: result.id,
      fileName: filename,
      folderName,
    });
  } catch (error) {
    console.error("구글 드라이브 업로드 오류:", error);
    res.status(500).json({
      error: "구글 드라이브 업로드 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

// Google 인증 URL 제공
app.get("/api/auth/google", async (req, res) => {
  try {
    const credentials = JSON.parse(
      fs.readFileSync(path.join(__dirname, "credentials.json"), "utf8")
    );

    // 이미 refresh_token이 있으면 인증 완료
    if (credentials.refresh_token) {
      return res.json({
        authenticated: true,
        message: "이미 인증되었습니다.",
      });
    }

    // refresh_token이 없으면 인증 URL 제공
    const { google } = await import("googleapis");
    const SCOPES = [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive",
    ];

    let client_id, client_secret, redirect_uris;

    if (credentials.installed) {
      ({ client_id, client_secret, redirect_uris } = credentials.installed);
    } else if (credentials.web) {
      ({ client_id, client_secret, redirect_uris } = credentials.web);
    } else {
      throw new Error("Unsupported credentials format");
    }

    const redirectUri = redirect_uris?.[0] || "urn:ietf:wg:oauth:2.0:oob";
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirectUri
    );

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });

    res.json({
      authenticated: false,
      authUrl,
      message: "위 URL에 접속하여 인증을 완료하세요.",
    });
  } catch (error) {
    console.error("구글 인증 URL 생성 오류:", error);
    res.status(500).json({
      error: "구글 인증 URL 생성 실패",
      details: error.message,
    });
  }
});

// Google 인증 코드 처리
app.post("/api/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "인증 코드가 필요합니다." });
    }

    const tokens = await getTokenFromCode(code);

    res.json({
      success: true,
      message: "인증이 완료되었습니다!",
      tokens,
    });
  } catch (error) {
    console.error("Google 인증 코드 처리 오류:", error);
    res.status(500).json({
      error: "인증 실패",
      details: error.message,
    });
  }
});

// 구글 드라이브 폴더의 파일 목록 조회
app.get("/api/drive/:folderName/files", async (req, res) => {
  try {
    const { folderName } = req.params;
    const files = await getFilesFromFolder(folderName);

    res.json({
      folderName,
      files,
      count: files.length,
    });
  } catch (error) {
    console.error("구글 드라이브 파일 목록 조회 오류:", error);
    res.status(500).json({
      error: "구글 드라이브 파일 목록 조회 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

// 구글 드라이브에서 파일 다운로드
app.get("/api/drive/:folderName/download/:fileId", async (req, res) => {
  try {
    const { fileId, folderName } = req.params;
    const { fileName } = req.query;

    if (!fileName) {
      return res.status(400).json({ error: "파일명이 필요합니다." });
    }

    const taskPath = path.join(filesFolderPath, fileName);
    const hasTaskFile = fs.existsSync(taskPath);
    const savePath = hasTaskFile
      ? path.join(downloadFolderPath, fileName)
      : taskPath;

    // 파일 다운로드 및 저장
    const result = await downloadFile(fileId, fileName, savePath);

    if (result) {
      const targetFolder = hasTaskFile ? "download" : "task";
      res.json({
        success: true,
        message: `${fileName} 파일이 ${targetFolder} 폴더에 저장되었습니다.`,
        fileName: fileName,
      });
    } else {
      res.status(500).json({ error: "파일 다운로드 실패" });
    }
  } catch (error) {
    console.error("구글 드라이브 파일 다운로드 오류:", error);
    res.status(500).json({
      error: "파일 다운로드 실패",
      details: error.message,
    });
  }
});

// SPA를 위한 catch-all 핸들러
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// 서버 시작
(async () => {
  try {
    // 기존 파일 노드 초기화
    await initializeFileNodes();
    
    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ 서버 시작 실패:", error);
  }
})();

export default app;
