import type { ApiErrorCode, ApiErrorResponse } from "@/types/api";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_ERROR: 500,
};

/** エラーを決まった形（ApiErrorResponse）で返す */
export function errorResponse(code: ApiErrorCode, message: string): Response {
  const body: ApiErrorResponse = { error: { code, message } };
  return Response.json(body, { status: STATUS_BY_CODE[code] });
}

/** リクエストの JSON を読む。読めなければ null を返す */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * data URL を確かめる。
 * 形式が正しく、MIME が mimePrefixes のどれかで始まり、サイズが上限以内なら "ok" を返す。
 */
export function checkDataUrl(
  value: unknown,
  mimePrefixes: string[],
  maxBytes: number,
): "ok" | "invalid" | "too_large" {
  if (typeof value !== "string") return "invalid";
  const match = /^data:([\w.+-]+\/[\w.+-]+)(;[^,]*)?;base64,/.exec(value);
  if (!match) return "invalid";
  const mime = match[1];
  if (!mimePrefixes.some((prefix) => mime.startsWith(prefix))) return "invalid";
  // base64 は4文字で3バイトなので、おおよそのバイト数を求める
  const base64Length = value.length - match[0].length;
  if (base64Length === 0) return "invalid";
  if ((base64Length * 3) / 4 > maxBytes) return "too_large";
  return "ok";
}
