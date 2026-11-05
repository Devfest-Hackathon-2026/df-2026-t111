// API の入出力の型（画面とサーバーで共有する）
// 仕様の説明は docs/api.md を参照。変更するときは必ずチームに声をかけること。

/** 診断でおすすめする伝統芸能 */
export type PerformingArt = "kabuki" | "kyogen" | "noh" | "bunraku";

// ---- POST /api/diagnosis ----

/** 診断の1問ぶんの回答 */
export interface DiagnosisAnswer {
  /** 質問の ID（例："q1"） */
  questionId: string;
  /** 選んだ選択肢の ID（例："q1-a"） */
  choiceId: string;
}

export interface DiagnosisRequest {
  answers: DiagnosisAnswer[];
}

export interface DiagnosisResponse {
  /** いちばんおすすめの伝統芸能 */
  recommended: PerformingArt;
  /** 伝統芸能ごとの相性（0〜100） */
  scores: Record<PerformingArt, number>;
  /** おすすめ理由のひとこと */
  message: string;
}

// ---- POST /api/critique/mie, POST /api/critique/nanori ----

/** 見得チャレンジ：カメラで撮った1枚 */
export interface MieCritiqueRequest {
  /** JPEG または PNG の data URL（例："data:image/jpeg;base64,..."） */
  image: string;
}

/** 名乗りチャレンジ：マイクで録った音声 */
export interface NanoriCritiqueRequest {
  /** 音声の data URL（例："data:audio/webm;base64,..."） */
  audio: string;
}

/** Gemini による講評（見得・名乗りで共通） */
export interface CritiqueResponse {
  /** 点数（0〜100） */
  score: number;
  /** ひとことの見出し（例："堂々とした見得！"） */
  title: string;
  /** 講評の本文 */
  comment: string;
  /** 次に試すとよいポイント（1〜3個） */
  tips: string[];
}

// ---- エラー（全 API 共通） ----

export type ApiErrorCode = "BAD_REQUEST" | "PAYLOAD_TOO_LARGE" | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    /** 画面にそのまま出せる、やさしい日本語のメッセージ */
    message: string;
  };
}
