import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// JSON 파일 읽기
export async function readJSONFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

// JSON 파일 쓰기
export async function writeJSONFile(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
}

// 컨텐츠 데이터 관리
export async function getContentData() {
  return await readJSONFile("content.json");
}

export async function saveContentData(data) {
  return await writeJSONFile("content.json", data);
}

// 엣지 데이터 관리
export async function getEdgeData() {
  return await readJSONFile("edges.json");
}

export async function saveEdgeData(data) {
  return await writeJSONFile("edges.json", data);
}

// ID 생성기
export function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
