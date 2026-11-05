import { Type } from "@google/genai";
import type { DiagnosisAnswer, DiagnosisResponse, PerformingArt } from "@/types/api";
import { getGeminiClient, getGeminiModel } from "./client";
import { TRADITIONAL_ARTS_FACTS } from "./traditional-arts-context";

const DIAGNOSIS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    recommended: {
      type: Type.STRING,
      enum: ["nogaku", "ningyoJoruri", "kabuki"],
      description: "もっとも相性が良くおすすめの伝統芸能",
    },
    scores: {
      type: Type.OBJECT,
      properties: {
        nogaku: {
          type: Type.INTEGER,
          description: "能楽との相性スコア（0〜100）",
        },
        ningyoJoruri: {
          type: Type.INTEGER,
          description: "人形浄瑠璃（文楽）との相性スコア（0〜100）",
        },
        kabuki: {
          type: Type.INTEGER,
          description: "歌舞伎との相性スコア（0〜100）",
        },
      },
      required: ["nogaku", "ningyoJoruri", "kabuki"],
    },
    message: {
      type: Type.STRING,
      description: "おすすめ理由を初心者向けにわかりやすく解説した温かいメッセージ（2〜3文程度）",
    },
  },
  required: ["recommended", "scores", "message"],
};

/**
 * 診断の回答をもとに、Gemini を使っておすすめの伝統芸能と相性スコア・メッセージを判定する
 */
export async function generateDiagnosis(answers: DiagnosisAnswer[]): Promise<DiagnosisResponse> {
  const ai = getGeminiClient();
  const model = getGeminiModel();

  const answersText = answers
    .map((a, i) => `質問${i + 1} (ID: ${a.questionId}): 回答 (ID: ${a.choiceId})`)
    .join("\n");

  const prompt = `
あなたは日本の伝統芸能の魅力を初心者に伝える専門ナビゲーターです。
以下の【伝統芸能の基礎知識】を踏まえ、ユーザーの診断アンケート回答を分析して、ユーザーに最も合う伝統芸能（能楽、人形浄瑠璃文楽、歌舞伎）をおすすめしてください。

${TRADITIONAL_ARTS_FACTS}

【ユーザーの回答】
${answersText}

【指示】
1. 各伝統芸能（nogaku, ningyoJoruri, kabuki）との相性を 0 〜 100 のスコアで採点してください。
2. スコアが最も高いものを recommended（"nogaku" | "ningyoJoruri" | "kabuki"）に指定してください。
3. おすすめ理由（message）は、回答者の好みや興味に寄り添い、その芸能の魅力を親しみやすい言葉で2〜3文程度で伝えてください。
4. 必ず指定された JSON スキーマに従って出力してください。
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: DIAGNOSIS_RESPONSE_SCHEMA,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini からの応答が空でした。");
  }

  const parsed = JSON.parse(text) as DiagnosisResponse;

  // 簡単なバリデーション
  const validArts: PerformingArt[] = ["nogaku", "ningyoJoruri", "kabuki"];
  if (
    !validArts.includes(parsed.recommended) ||
    typeof parsed.scores !== "object" ||
    typeof parsed.message !== "string"
  ) {
    throw new Error("Gemini の応答フォーマットが不正です。");
  }

  return {
    recommended: parsed.recommended,
    scores: {
      nogaku: Math.min(100, Math.max(0, Math.round(Number(parsed.scores.nogaku) || 0))),
      ningyoJoruri: Math.min(100, Math.max(0, Math.round(Number(parsed.scores.ningyoJoruri) || 0))),
      kabuki: Math.min(100, Math.max(0, Math.round(Number(parsed.scores.kabuki) || 0))),
    },
    message: parsed.message,
  };
}
