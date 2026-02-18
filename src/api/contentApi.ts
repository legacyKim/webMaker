// 서버 API에서 content 데이터 (기존 + files 폴더) 가져오기
export async function fetchContent() {
  try {
    // 새로운 통합 API 엔드포인트 사용
    const response = await fetch("/api/content");

    if (!response.ok) {
      throw new Error(`API 응답 오류: ${response.status}`);
    }

    const data = await response.json();

    console.log(
      `📊 Content 로딩 완료: ${data.staticCount}개 고정 노드, ${data.filesCount}개 파일 노드`,
    );

    return {
      contentData: data.contentData,
      edgeData: data.edgeData,
    };
  } catch (error) {
    console.error("Content API 로딩 오류:", error);

    // API 실패 시 정적 파일들로 fallback
    try {
      const [contentResponse, edgeResponse] = await Promise.all([
        fetch("/data/content.json"),
        fetch("/data/edges.json"),
      ]);

      if (contentResponse.ok && edgeResponse.ok) {
        const contentData = await contentResponse.json();
        const edgeData = await edgeResponse.json();

        console.log("⚠️ API 실패로 정적 파일 사용 중");

        return {
          contentData,
          edgeData,
        };
      }
    } catch (fallbackError) {
      console.error("Fallback도 실패:", fallbackError);
    }

    // 최종 기본 데이터 반환
    console.log("🔴 모든 데이터 로딩 실패, 기본 데이터 사용");
    return {
      contentData: [
        {
          id: "sample-1",
          title: "샘플 노드 1",
          content: "이것은 샘플 컨텐츠입니다.",
          position_x: 100,
          position_y: 100,
          lock: 0,
          fixed: 0,
          created_at: "2026-02-17T00:00:00.000Z",
          keyword: "샘플,테스트",
        },
      ],
      edgeData: [],
    };
  }
}
