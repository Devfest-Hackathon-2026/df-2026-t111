import type { DiagnosisAnswer, DiagnosisResponse } from "@/types/api";
import { errorResponse, isRecord, readJson } from "@/lib/api-response";
import { generateDiagnosis, isMockApiEnabled } from "@/lib/gemini";

// モック：回答の中身にかかわらず固定の結果を返す（USE_MOCK_API=true の場合に使用）
const MOCK_RESULT: DiagnosisResponse = {
  recommended: "nogaku",
  scores: { nogaku: 88, ningyoJoruri: 56, kabuki: 72 },
  message: "（モックの結果です）あなたには能楽がおすすめです。",
};

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!isRecord(body) || !Array.isArray(body.answers) || body.answers.length === 0) {
    return errorResponse("BAD_REQUEST", "回答が届きませんでした。もう一度診断してください。");
  }

  const validAnswers = body.answers.every(
    (answer) =>
      isRecord(answer) &&
      typeof answer.questionId === "string" &&
      typeof answer.choiceId === "string",
  );
  if (!validAnswers) {
    return errorResponse("BAD_REQUEST", "回答の形式が正しくありません。もう一度診断してください。");
  }

  // USE_MOCK_API=true のときはモックを返す
  if (isMockApiEnabled()) {
    return Response.json(MOCK_RESULT);
  }

  try {
    const result = await generateDiagnosis(body.answers as DiagnosisAnswer[]);
    return Response.json(result);
  } catch (error) {
    console.error("Diagnosis error:", error);
    return errorResponse("INTERNAL_ERROR", "診断の作成に失敗しました。もう一度お試しください。");
  }
}
