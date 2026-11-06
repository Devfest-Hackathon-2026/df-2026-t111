import { Type } from "@google/genai";
import type { CritiqueResponse } from "@/types/api";
import { getGeminiClient, getGeminiModel, parseDataUrl } from "./client";
import {
  MIE_CRITIQUE_POINTS,
  NANORI_CRITIQUE_POINTS,
  TRADITIONAL_ARTS_FACTS,
} from "./traditional-arts-context";

const CRITIQUE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "0〜100の点数（初心者を励ますため基本は60点以上とし、良さに応じて高得点を付与）",
    },
    title: {
      type: Type.STRING,
      description:
        "挑戦の良さを表すひと言の見出し（例：『堂々とした気迫の見得！』『響き渡る爽やかな名乗り！』）",
    },
    comment: {
      type: Type.STRING,
      description: "初心者の挑戦を前向きに称え、伝統芸能の魅力を交えた温かい講評本文（2〜4文）",
    },
    tips: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "さらに良くするための実践的なワンポイントアドバイス（1〜3個）",
    },
  },
  required: ["score", "title", "comment", "tips"],
};

/**
 * 見得チャレンジの写真（画像）を Gemini で講評する
 * ※ 画像データはメモリ上でのみ処理し、外部・内部ストレージには一切保存しません。
 */
export async function generateMieCritique(imageDataUrl: string): Promise<CritiqueResponse> {
  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed) {
    throw new Error("画像のフォーマットが不正です。");
  }

  const ai = getGeminiClient();
  const model = getGeminiModel();

  const prompt = `
あなたは歌舞伎の魅力を広める親しみやすい師匠・ナビゲーターです。
ユーザーが歌舞伎の「見得（みえ）」のポーズに挑戦して撮影した写真が送られてきました。

${TRADITIONAL_ARTS_FACTS}
${MIE_CRITIQUE_POINTS}

【指示】
1. 写真のポーズ、目線（にらみ）、構え、全体の気迫や堂々とした雰囲気を優しく観察してください。
2. 初心者の挑戦を前向きに肯定し、歌舞伎の見得らしさが出ている点をしっかり褒めてください。
3. 点数（score）は 0 〜 100 点で設定してください（楽しく続けられるよう、基本的に 60 点以上の甘めで温かい採点にしてください）。
4. 見出し（title）、講評本文（comment）、ワンポイント改善点（tips: 1〜3個）を出力してください。
5. 必ず指定の JSON スキーマに従って出力してください。
`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.base64Data,
        },
      },
      {
        text: prompt,
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: CRITIQUE_RESPONSE_SCHEMA,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini からの応答が空でした。");
  }

  const result = JSON.parse(text) as CritiqueResponse;

  return {
    score: Math.min(100, Math.max(0, Math.round(Number(result.score) || 75))),
    title: result.title || "素晴らしい見得！",
    comment: result.comment || "気迫がしっかり伝わってくる見事な構えでした！",
    tips:
      Array.isArray(result.tips) && result.tips.length > 0
        ? result.tips
        : ["目線をピタッと止めてみましょう"],
  };
}

/**
 * 名乗りチャレンジの音声（オーディオ）を Gemini で講評する
 * ※ 音声データはメモリ上でのみ処理し、外部・内部ストレージには一切保存しません。
 */
export async function generateNanoriCritique(audioDataUrl: string): Promise<CritiqueResponse> {
  const parsed = parseDataUrl(audioDataUrl);
  if (!parsed) {
    throw new Error("音声のフォーマットが不正です。");
  }

  const ai = getGeminiClient();
  const model = getGeminiModel();

  const prompt = `
あなたは狂言の楽しさを伝える明るい師匠・ナビゲーターです。
ユーザーが狂言の「名乗り（なのり）」の発声に挑戦した音声録音が送られてきました。

${TRADITIONAL_ARTS_FACTS}
${NANORI_CRITIQUE_POINTS}

【指示】
1. 音声の発声、声の張り、話すスピード（ゆっくり、はっきり）、堂々とした響きを聴いてください。
2. 初心者の発声を前向きに称賛し、狂言らしい大らかさや良さを褒めてください。
3. 点数（score）は 0 〜 100 点で設定してください（楽しく親しめるよう、基本的に 60 点以上の温かい採点にしてください）。
4. 見出し（title）、講評本文（comment）、ワンポイント改善点（tips: 1〜3個）を出力してください。
5. 必ず指定の JSON スキーマに従って出力してください。
`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.base64Data,
        },
      },
      {
        text: prompt,
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: CRITIQUE_RESPONSE_SCHEMA,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini からの応答が空でした。");
  }

  const result = JSON.parse(text) as CritiqueResponse;

  return {
    score: Math.min(100, Math.max(0, Math.round(Number(result.score) || 75))),
    title: result.title || "よく通る名乗り！",
    comment: result.comment || "声がしっかり前に出ていて、聞き取りやすい名乗りでした！",
    tips:
      Array.isArray(result.tips) && result.tips.length > 0
        ? result.tips
        : ["お腹からゆっくり息を届けてみましょう"],
  };
}
