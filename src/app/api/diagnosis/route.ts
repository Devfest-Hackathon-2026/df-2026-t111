import type { DiagnosisResponse } from "@/types/api";
import { errorResponse, isRecord, readJson } from "@/lib/api-response";

// モック：回答の中身にかかわらず固定の結果を返す
// TODO: 回答から相性を計算し、Gemini でおすすめ理由を作る
const MOCK_RESULT: DiagnosisResponse = {
  recommended: "kyogen",
  scores: { kabuki: 72, kyogen: 88, noh: 41, bunraku: 56 },
  message: "（モックの結果です）あなたには狂言がおすすめです。",
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

  return Response.json(MOCK_RESULT);
}
