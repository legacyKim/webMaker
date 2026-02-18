// Google Drive 파일 업로드 모듈 (from booknote)
import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive",
];
const CREDENTIALS_PATH = path.join(__dirname, "credentials.json");

// 간단한 인증
function authorize() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error("credentials.json 파일이 필요합니다.");
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));

  // Service Account 방식 사용
  if (credentials.type === "service_account") {
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: SCOPES,
    });
    return auth;
  }

  // OAuth2 방식 (다양한 구조 지원)
  let client_secret, client_id, redirect_uris;

  if (credentials.installed) {
    // Google Cloud Console에서 다운받은 기본 형식
    ({ client_secret, client_id, redirect_uris } = credentials.installed);
  } else if (credentials.web) {
    // 웹 애플리케이션 형식
    ({ client_secret, client_id, redirect_uris } = credentials.web);
  } else if (credentials.client_secret) {
    // 직접 구성된 형식
    client_secret = credentials.client_secret;
    client_id = credentials.client_id;
    redirect_uris = credentials.redirect_uris || ["urn:ietf:wg:oauth:2.0:oob"];
  } else {
    throw new Error(
      "지원되지 않는 credentials.json 형식입니다. installed, web 또는 직접 구성된 형식이 필요합니다."
    );
  }

  // redirect_uris 안전 처리
  const redirectUri =
    redirect_uris && redirect_uris.length > 0
      ? redirect_uris[0]
      : "urn:ietf:wg:oauth:2.0:oob";

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirectUri
  );

  // 미리 설정된 토큰 사용
  if (credentials.refresh_token) {
    oAuth2Client.setCredentials({
      refresh_token: credentials.refresh_token,
    });
  } else {
    // 토큰이 없는 경우 에러와 함께 인증 URL 제공
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    throw new Error(
      `인증이 필요합니다. 다음 URL에 접속하여 인증 후 코드를 받아주세요: ${authUrl}`
    );
  }

  return oAuth2Client;
}

// 인증 코드로 토큰 받기
async function getTokenFromCode(authCode) {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));

  let client_secret, client_id, redirect_uris;

  if (credentials.web) {
    ({ client_secret, client_id, redirect_uris } = credentials.web);
  } else if (credentials.installed) {
    ({ client_secret, client_id, redirect_uris } = credentials.installed);
  } else {
    throw new Error("지원되지 않는 credentials 형식입니다.");
  }

  const redirectUri =
    redirect_uris && redirect_uris.length > 0
      ? redirect_uris[0]
      : "urn:ietf:wg:oauth:2.0:oob";

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirectUri
  );

  try {
    const { tokens } = await oAuth2Client.getToken(authCode);

    console.log("받은 토큰 정보:", JSON.stringify(tokens, null, 2));

    if (!tokens.refresh_token) {
      console.warn(
        "⚠️  refresh_token이 없습니다. 이미 인증된 계정일 수 있습니다."
      );
      throw new Error(
        "refresh_token이 발급되지 않았습니다. Google에서 앱 권한을 해제하고 다시 시도하세요: https://myaccount.google.com/permissions"
      );
    }

    // credentials.json에 refresh_token 추가
    credentials.refresh_token = tokens.refresh_token;
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));

    console.log("✅ refresh_token이 성공적으로 저장되었습니다!");

    return tokens;
  } catch (error) {
    throw new Error("인증 코드가 유효하지 않습니다: " + error.message);
  }
}

// 파일 업로드 (폴더 지원) - 간단한 버전
async function uploadFileToFolder(filePath, fileName, folderName) {
  const auth = authorize();
  const drive = google.drive({ version: "v3", auth });

  // 폴더 검색
  const folders = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
    fields: "files(id, name)",
  });

  if (folders.data.files.length === 0) {
    throw new Error(
      `Google Drive에서 '${folderName}' 폴더를 찾을 수 없습니다.`
    );
  }

  const folderId = folders.data.files[0].id;

  // 파일 메타데이터 설정
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  // 해당 폴더에서 기존 파일 검색
  const existingFiles = await drive.files.list({
    q: `name='${fileName}' and '${folderId}' in parents`,
    fields: "files(id, name)",
  });

  const media = { mimeType: "text/plain", body: fs.createReadStream(filePath) };

  try {
    let res;
    if (existingFiles.data.files.length > 0) {
      // 기존 파일 덮어쓰기
      const fileId = existingFiles.data.files[0].id;
      res = await drive.files.update({
        fileId: fileId,
        media: media,
        fields: "id",
      });
    } else {
      // 새 파일 생성
      res = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id",
      });
    }

    return { id: res.data.id };
  } catch (err) {
    console.error(`${folderName}/${fileName} 업로드 실패:`, err);
    throw err;
  }
}

// 폴더의 파일 목록 가져오기
async function getFilesFromFolder(folderName) {
  const auth = authorize();
  const drive = google.drive({ version: "v3", auth });

  // 폴더 검색
  const folders = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
    fields: "files(id, name)",
  });

  if (folders.data.files.length === 0) {
    throw new Error(
      `Google Drive에서 '${folderName}' 폴더를 찾을 수 없습니다.`
    );
  }

  const folderId = folders.data.files[0].id;

  // 폴더 내 파일 목록 가져오기
  const files = await drive.files.list({
    q: `'${folderId}' in parents`,
    fields: "files(id, name, size, createdTime, modifiedTime)",
  });

  return files.data.files;
}

// 특정 파일 다운로드
async function downloadFile(fileId, fileName, localPath) {
  const auth = authorize();
  const drive = google.drive({ version: "v3", auth });

  try {
    const res = await drive.files.get({
      fileId: fileId,
      alt: "media",
    });

    const dest = fs.createWriteStream(localPath);
    res.data.pipe(dest);

    return new Promise((resolve, reject) => {
      dest.on("error", reject);
      dest.on("finish", () => {
        resolve({ fileName, localPath, size: res.headers["content-length"] });
      });
    });
  } catch (error) {
    throw new Error(`파일 다운로드 실패: ${error.message}`);
  }
}

export {
  authorize,
  getTokenFromCode,
  uploadFileToFolder,
  getFilesFromFolder,
  downloadFile,
};