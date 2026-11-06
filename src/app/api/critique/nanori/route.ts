import type { CritiqueResponse } from "@/types/api";
import { checkDataUrl, errorResponse, isRecord, readJson } from "@/lib/api-response";
import { generateNanoriCritique, isMockApiEnabled } from "@/lib/gemini";

// 音声の上限サイズ（10MB）
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

// モック：音声の中身にかかわらず固定の講評を返す（USE_MOCK_API=true の場合に使用）
const MOCK_RESULT: CritiqueResponse = {
  score: 82,
  title: "（モック）よく通る名乗り！",
  comment: "（モックの講評です）声がはっきりしていて、聞き取りやすい名乗りでした。",
  tips: ["語尾まで息を残しましょう", "最初のひとことをもう少しゆっくり"],
};

export async function POST(request: Request) {
  const body = await readJson(request);
  const check = checkDataUrl(isRecord(body) ? body.audio : undefined, ["audio/"], MAX_AUDIO_BYTES);
  if (check === "too_large") {
    return errorResponse("PAYLOAD_TOO_LARGE", "録音が長すぎます。短めにもう一度録ってください。");
  }
  if (check === "invalid") {
    return errorResponse("BAD_REQUEST", "録音が届きませんでした。もう一度録ってください。");
  }

  // USE_MOCK_API=true のときはモックを返す
  if (isMockApiEnabled()) {
    return Response.json(MOCK_RESULT);
  }

  try {
    const result = await generateNanoriCritique((body as { audio: string }).audio);
    return Response.json(result);
  } catch (error) {
    console.error("Nanori critique error:", error);
    return errorResponse("INTERNAL_ERROR", "講評の作成に失敗しました。もう一度お試しください。");
  }
}
