// 「行きたい」登録（④ 行きたい・③ 詳細 で使う）
//
// ※ いまはブラウザの localStorage に保存する仮の実装。
//   11/7〜8 に Firestore（users/{uid}/wishes/{eventId}）へ差し替える予定。
//   差し替えても、下の関数の名前・引数・戻り値は変えない。画面側は直さなくてよい。
//
// ブラウザでだけ使う（"use client" のコンポーネントや、useEffect の中から呼ぶ）。

import type { PerformingArt } from "@/types/api";

/** 「行きたい」1 件 */
export interface Wish {
  /** 公演・体験会の ID（src/data/events.ts の id） */
  eventId: string;
  /** どの伝統芸能か */
  artId: PerformingArt;
  /** 登録した日時（ISO 8601） */
  createdAt: string;
}

/** 保存や読み込みに失敗したときのエラー。message は画面にそのまま出せる */
export class WishlistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WishlistError";
  }
}

const STORAGE_KEY = "dfhack26-dentou:wishes:v1";
const CHANGE_EVENT = "dfhack26-dentou:wishes-change";
const ART_IDS: readonly PerformingArt[] = ["nogaku", "ningyoJoruri", "kabuki"];

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // プライベートブラウズなどで使えないことがある
    return null;
  }
}

function isWish(value: unknown): value is Wish {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.eventId === "string" &&
    typeof v.createdAt === "string" &&
    ART_IDS.includes(v.artId as PerformingArt)
  );
}

function readWishes(): Wish[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isWish) : [];
  } catch {
    // 壊れたデータは無視して、空として扱う
    return [];
  }
}

function writeWishes(wishes: Wish[]): void {
  const storage = getStorage();
  if (!storage) {
    throw new WishlistError(
      "このブラウザでは「行きたい」を保存できませんでした。プライベートブラウズをやめて、もう一度ためしてください。",
    );
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(wishes));
  } catch {
    throw new WishlistError("「行きたい」を保存できませんでした。もう一度ためしてください。");
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 「行きたい」の一覧を、新しく登録した順に返す */
export async function listWishes(): Promise<Wish[]> {
  return readWishes().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 登録済みかどうか */
export async function hasWish(eventId: string): Promise<boolean> {
  return readWishes().some((wish) => wish.eventId === eventId);
}

/** 「行きたい」に登録する。登録済みなら何もしない */
export async function addWish(eventId: string, artId: PerformingArt): Promise<void> {
  const wishes = readWishes();
  if (wishes.some((wish) => wish.eventId === eventId)) return;
  writeWishes([...wishes, { eventId, artId, createdAt: new Date().toISOString() }]);
}

/** 「行きたい」から外す。登録されていなければ何もしない */
export async function removeWish(eventId: string): Promise<void> {
  const wishes = readWishes();
  const next = wishes.filter((wish) => wish.eventId !== eventId);
  if (next.length === wishes.length) return;
  writeWishes(next);
}

/**
 * 「行きたい」が変わったときに呼ばれる関数を登録する（ほかのタブでの変更も含む）。
 * 戻り値の関数を呼ぶと登録を解除する。React なら useEffect の後片付けで呼ぶ。
 */
export function onWishesChange(callback: (wishes: Wish[]) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handleChange = () => {
    void listWishes().then(callback);
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) handleChange();
  };
  window.addEventListener(CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleStorage);
  };
}
