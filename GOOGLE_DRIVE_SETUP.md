# webMaker - .txt 파일 저장 및 구글 드라이브 업로드 기능

booknote 프로젝트에서 참조하여 webMaker에 .txt 파일 저장 및 구글 드라이브 업로드 기능을 구현했습니다.

## 🚀 새로 추가된 기능

### 1. .txt 파일 다운로드
- 작성한 글을 JSON 형태의 .txt 파일로 브라우저에서 직접 다운로드
- 파일명은 제목을 기반으로 자동 생성

### 2. 서버에 .txt 파일 저장
- 작성한 글을 서버의 `server/task` 폴더에 .txt 파일로 저장
- JSON 형태로 메타데이터와 함께 저장

### 3. 구글 드라이브 업로드
- 서버에 저장된 .txt 파일을 구글 드라이브로 업로드
- 저장된 파일 관리 인터페이스 제공

### 4. 파일 관리 인터페이스
- 저장된 .txt 파일 목록 조회
- 파일 내용 미리보기
- 개별 파일 구글 드라이브 업로드

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

새로 추가된 패키지들:
- googleapis: 구글 드라이브 API 사용
- chokidar: 파일 시스템 감시

### 2. 구글 드라이브 설정 (선택사항)

구글 드라이브 업로드 기능을 사용하려면 `credentials.json` 파일이 필요합니다.

#### Google Cloud Console 설정:
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. Google Drive API 활성화
4. 서비스 계정 또는 OAuth 2.0 클라이언트 생성
5. credentials.json 파일 다운로드
6. `src/credentials.json` 경로에 저장

#### 구글 드라이브 폴더 설정:
- 구글 드라이브에 `task` 폴더 생성
- 업로드된 파일들이 이 폴더에 저장됩니다

### 3. 서버 실행
```bash
npm run dev
```

## 🎯 사용 방법

### Write 페이지에서:
1. **글 작성**: HTML 형식으로 글을 작성하고 포맷팅 도구 사용
2. **제목/부제목**: 글의 제목과 부제목 입력
3. **키워드**: 쉼표로 구분된 키워드 입력
4. **.txt 다운로드**: 브라우저에서 즉시 파일 다운로드
3. **서버에 .txt 저장**: 서버에 파일 저장
4. **저장하고 보기**: 기존 기능 (브라우저 저장 + 미리보기)

### 파일 관리 섹션에서:
1. **파일 목록**: 서버에 저장된 모든 .txt 파일 확인
2. **파일 보기**: 새 창에서 파일 내용 미리보기
3. **구글 업로드**: 개별 파일을 구글 드라이브에 업로드

## 📁 파일 저장 형식

저장되는 .txt 파일은 JSON 형태로 구조화됩니다:

```json
{
  "title": "글 제목",
  "author": "webMaker 사용자",
  "keywords": "키워드1, 키워드2",
  "content": "마크다운 형태의 본문 내용",
  "created_at": "2026-02-17T10:30:00.000Z",
  "updated_at": "2026-02-17T10:30:00.000Z"
}
```

## 🛠 추가된 API 엔드포인트

- `POST /api/save-txt`: .txt 파일 저장
- `GET /api/txt-files`: 저장된 파일 목록 조회
- `GET /api/txt-file/:filename`: 특정 파일 내용 조회
- `POST /api/upload-to-drive/:filename`: 구글 드라이브 업로드
- `GET /api/drive/:folderName/files`: 구글 드라이브 파일 목록

## 🔧 구글 드라이브 설정 예시

### OAuth 2.0 방식 credentials.json:
```json
{
  "installed": {
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob"]
  },
  "refresh_token": "your-refresh-token"
}
```

### Service Account 방식 credentials.json:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

## ⚠️ 주의사항

1. `credentials.json` 파일은 민감한 정보이므로 Git에 커밋하지 마세요
2. 구글 드라이브 기능 없이도 .txt 다운로드와 서버 저장은 정상 작동합니다
3. 처음 구글 인증 시 브라우저에서 인증 과정을 거쳐야 할 수 있습니다

## 📚 참고

이 기능은 `필사/booknote` 프로젝트의 파일 관리 시스템을 참조하여 구현되었습니다.