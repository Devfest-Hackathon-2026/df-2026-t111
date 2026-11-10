// 「行きたい」の型とエラー（wishlist.ts・wishlist-local.ts・wishlist-firestore.ts で共有）
// 画面からは wishlist.ts だけを import する。

import type { PerformingArt } from "@/types/api";

/** 「行きたい」1 件 */
export interface Wish {
  /** 公演・体験会の ID（src/data/events.ts の id、または ③ のおすすめ公演カードの id） */
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

/** 保存先ごとの実装がそろえる関数 */
export interface WishlistStore {
  listWishes(): Promise<Wish[]>;
  hasWish(eventId: string): Promise<boolean>;
  addWish(eventId: string, artId: PerformingArt): Promise<void>;
  removeWish(eventId: string): Promise<void>;
  onWishesChange(callback: (wishes: Wish[]) => void): () => void;
}

export const ART_IDS: readonly PerformingArt[] = ["nogaku", "ningyoJoruri", "kabuki"];

export function isArtId(value: unknown): value is PerformingArt {
  return ART_IDS.includes(value as PerformingArt);
}
