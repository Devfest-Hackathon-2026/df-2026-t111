import { GoogleGenAI } from "@google/genai";

let clientInstance: GoogleGenAI | null = null;

/**
 * Gemini クライアントを取得する（サーバー側専用）
 * 常に Vertex AI 経由で初期化します。
 */
export function getGeminiClient(): GoogleGenAI {
  if (!clientInstance) {
    clientInstance = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT || "dfhack26-dentou",
      location: process.env.GOOGLE_CLOUD_LOCATION || "global",
    });
  }
  return clientInstance;
}

/**
 * 使用する Gemini モデル名を取得する
 */
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

/**
 * モック API を使用するかどうかを判定する
 */
export function isMockApiEnabled(): boolean {
  return process.env.USE_MOCK_API === "true";
}

/**
 * data URL から MIME タイプと base64 文字列を抽出する
 * 例: "data:audio/webm;codecs=opus;base64,..." や "data:image/jpeg;base64,..."
 */
export function parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string } | null {
  const match = /^data:([\w.+-]+\/[\w.+-]+)(;[^,]*)?;base64,(.*)$/.exec(dataUrl);
  if (!match) return null;
  return {
    mimeType: match[1],
    base64Data: match[3],
  };
}
