import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  getContentData,
  saveContentData,
  getEdgeData,
  saveEdgeData,
} from "./fileSystem.js";
import {
  uploadFileToFolder,
  getFilesFromFolder,
  downloadFile,
} from "./googleDrive.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3003;

// txt 파일들이 저장될 폴더
const filesFolderPath = path.join(__dirname, "../server/files");

// files 폴더가 없으면 생성
if (!fs.existsSync(filesFolderPath)) {
  fs.mkdirSync(filesFolderPath, { recursive: true });
}

// 미들웨어
app.use(cors());
app.use(express.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "../dist")));

// API 라우트
app.get("/api/content", async (req, res) => {
  try {
    const contentData = await getContentData();
    const edgeData = await getEdgeData();

    // server/files 폴더의 .txt 파일들을 contentData에 추가
    let filesData = [];
    let filesCount = 0;

    if (fs.existsSync(filesFolderPath)) {
      const files = fs
        .readdirSync(filesFolderPath)
        .filter((file) => file.endsWith(".txt"))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(filesFolderPath, a));
          const statB = fs.statSync(path.join(filesFolderPath, b));
          return statB.mtime.getTime() - statA.mtime.getTime(); // 최신순
        });

      filesData = files
        .map((file, index) => {
          try {
            const filePath = path.join(filesFolderPath, file);
            const content = fs.readFileSync(filePath, "utf8");
            const data = JSON.parse(content);
            const fileNameWithoutExt = file.replace(".txt", "");

            return {
              id: `file-${fileNameWithoutExt}`,
              title: data.title || fileNameWithoutExt,
              subtitle: data.subtitle || "",
              content: data.content || "",
              keyword: data.keywords || "",
              position_x: 400 + (index % 3) * 150, // 오른쪽에 배치
              position_y: 100 + Math.floor(index / 3) * 120,
              created_at: data.created_at,
              view: 0,
              lock: 0,
              fixed: 0,
              slug: `file-${fileNameWithoutExt}`,
              type: "file", // 파일 노드 구분용
            };
          } catch (err) {
            console.error(`파일 ${file} 파싱 오류:`, err);
            return null;
          }
        })
        .filter(Boolean); // null 제거

      filesCount = filesData.length;
    }

    // 기존 contentData와 파일 데이터 합치기
    const mergedContentData = [...contentData, ...filesData];

    console.log(
      `📊 Content API: ${contentData.length}개 고정 노드, ${filesCount}개 파일 노드 반환`,
    );

    res.json({
      contentData: mergedContentData,
      edgeData,
      staticCount: contentData.length,
      filesCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/content", async (req, res) => {
  try {
    const {
      title,
      date,
      content,
      subtitle,
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
        subtitle,
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

// .txt 파일로 저장하는 API
app.post("/api/save-txt", async (req, res) => {
  try {
    const { title, content, subtitle, keywords } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "제목과 내용은 필수입니다." });
    }

    // 파일명 안전하게 처리 (특수문자 제거)
    const sanitizedTitle = (title || "untitled")
      .replace(/[^\p{Script=Hangul}a-zA-Z0-9\s]/gu, "")
      .trim();
    const fileName = `${sanitizedTitle}.txt`;
    const filePath = path.join(filesFolderPath, fileName);

    // JSON 형태로 저장 (booknote 방식)
    const fileData = JSON.stringify(
      {
        title,
        subtitle: subtitle || "",
        keywords: keywords || "",
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      null,
      2,
    );

    fs.writeFileSync(filePath, fileData, "utf8");

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
    const { folderName = "webMaker" } = req.body;

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

// Content 데이터와 files 폴더의 파일들을 합쳐서 반환하는 API
app.get("/api/content", async (req, res) => {
  try {
    // 기존 content.json과 edges.json 읽기
    const contentPath = path.join(__dirname, "../data/content.json");
    const edgesPath = path.join(__dirname, "../data/edges.json");

    let contentData = [];
    let edgeData = [];

    try {
      if (fs.existsSync(contentPath)) {
        contentData = JSON.parse(fs.readFileSync(contentPath, "utf8"));
      }
    } catch (e) {
      console.warn("content.json 읽기 실패:", e.message);
    }

    try {
      if (fs.existsSync(edgesPath)) {
        edgeData = JSON.parse(fs.readFileSync(edgesPath, "utf8"));
      }
    } catch (e) {
      console.warn("edges.json 읽기 실패:", e.message);
    }

    // files 폴더의 txt 파일들을 content 노드로 변환
    if (fs.existsSync(filesFolderPath)) {
      const files = fs
        .readdirSync(filesFolderPath)
        .filter(
          (file) => file && typeof file === "string" && file.endsWith(".txt"),
        );

      const fileNodes = files.map((file, index) => {
        const filePath = path.join(filesFolderPath, file);
        let stats;
        let fileData = {};

        try {
          stats = fs.statSync(filePath);
          const content = fs.readFileSync(filePath, "utf8");
          fileData = JSON.parse(content);
        } catch (e) {
          stats = { birthtime: new Date(), mtime: new Date() };
        }

        return {
          id: `file-${file.replace(".txt", "")}`,
          title: fileData.title || file.replace(".txt", ""),
          content: fileData.content || "파일 내용을 불러올 수 없습니다.",
          position_x: 200 + (index % 3) * 250, // 3열로 배치
          position_y: 300 + Math.floor(index / 3) * 200, // 여러 행으로 배치
          lock: 0,
          fixed: 0,
          created_at: fileData.created_at || stats.birthtime.toISOString(),
          updated_at: fileData.updated_at || stats.mtime.toISOString(),
          keyword: fileData.keywords || "파일,저장됨",
          source: "file", // 파일에서 온 노드임을 표시
          fileName: file, // 원본 파일명 저장
        };
      });

      // 기존 content 노드와 파일 노드 합치기
      contentData = [...contentData, ...fileNodes];
    }

    res.json({
      contentData,
      edgeData,
      filesCount: contentData.filter((node) => node.source === "file").length,
      staticCount: contentData.filter((node) => !node.source).length,
    });
  } catch (error) {
    console.error("Content API 오류:", error);
    res.status(500).json({
      error: "Content 데이터 조회 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

// SPA를 위한 catch-all 핸들러
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
