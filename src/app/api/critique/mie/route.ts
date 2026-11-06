import type { CritiqueResponse } from "@/types/api";
import { checkDataUrl, errorResponse, isRecord, readJson } from "@/lib/api-response";
import { generateMieCritique, isMockApiEnabled } from "@/lib/gemini";

// 画像の上限サイズ（5MB）
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// モック：画像の中身にかかわらず固定の講評を返す（USE_MOCK_API=true の場合に使用）
const MOCK_RESULT: CritiqueResponse = {
  score: 78,
  title: "（モック）堂々とした見得！",
  comment: "（モックの講評です）目線に力があって、ぐっと引きつけられます。",
  tips: ["あごを少し引いてみましょう", "動きを止める瞬間をもう少し長く"],
};

export async function POST(request: Request) {
  const body = await readJson(request);
  const check = checkDataUrl(
    isRecord(body) ? body.image : undefined,
    ["image/jpeg", "image/png"],
    MAX_IMAGE_BYTES,
  );
  if (check === "too_large") {
    return errorResponse("PAYLOAD_TOO_LARGE", "写真が大きすぎます。もう一度撮ってください。");
  }
  if (check === "invalid") {
    return errorResponse("BAD_REQUEST", "写真が届きませんでした。もう一度撮ってください。");
  }

  // USE_MOCK_API=true のときはモックを返す
  if (isMockApiEnabled()) {
    return Response.json(MOCK_RESULT);
  }

  try {
    const result = await generateMieCritique((body as { image: string }).image);
    return Response.json(result);
  } catch (error) {
    console.error("Mie critique error:", error);
    return errorResponse("INTERNAL_ERROR", "講評の作成に失敗しました。もう一度お試しください。");
  }
}
