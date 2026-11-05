import type { CritiqueResponse } from "@/types/api";
import { checkDataUrl, errorResponse, isRecord, readJson } from "@/lib/api-response";

// 音声の上限サイズ（10MB）
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

// モック：音声の中身にかかわらず固定の講評を返す
// TODO: Gemini に音声を渡して講評を作る（音声は保存しない）
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

  return Response.json(MOCK_RESULT);
}
