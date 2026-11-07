// 「行きたい」登録（④ 行きたい・③ 詳細 で使う）
//
// 画面からはこのファイルだけを import する。保存先は設定によって自動で切り替わる。
//   - .env.local に Firebase の設定がある（またはエミュレーターを使う）とき … Firestore（users/{uid}/wishes/{eventId}）
//   - 設定がないとき … ブラウザの localStorage（PR #15 までと同じ動き）
// どちらでも、関数の名前・引数・戻り値は同じ。
//
// ブラウザでだけ使う（"use client" のコンポーネントや、useEffect の中から呼ぶ）。
// サーバー側で呼ぶと、一覧は空、登録は WishlistError になる。

import type { PerformingArt } from "@/types/api";
import { isFirebaseConfigured } from "./client";
import { firestoreStore } from "./wishlist-firestore";
import { localStore } from "./wishlist-local";
import { type Wish, WishlistError, type WishlistStore } from "./wishlist-types";

export { type Wish, WishlistError };

/** いまの保存先（確認用。画面の動きをこれで変える必要はない） */
export function wishlistBackend(): "firestore" | "local" {
  return isFirebaseConfigured() ? "firestore" : "local";
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function store(): WishlistStore {
  return wishlistBackend() === "firestore" ? firestoreStore : localStore;
}

/** 「行きたい」の一覧を、新しく登録した順に返す */
export async function listWishes(): Promise<Wish[]> {
  if (!isBrowser()) return [];
  return store().listWishes();
}

/** 登録済みかどうか */
export async function hasWish(eventId: string): Promise<boolean> {
  if (!isBrowser()) return false;
  return store().hasWish(eventId);
}

/** 「行きたい」に登録する。登録済みなら何もしない */
export async function addWish(eventId: string, artId: PerformingArt): Promise<void> {
  if (!isBrowser()) throw new WishlistError("「行きたい」はブラウザでだけ登録できます。");
  return store().addWish(eventId, artId);
}

/** 「行きたい」から外す。登録されていなければ何もしない */
export async function removeWish(eventId: string): Promise<void> {
  if (!isBrowser()) throw new WishlistError("「行きたい」はブラウザでだけ外せます。");
  return store().removeWish(eventId);
}

/**
 * 「行きたい」が変わったときに呼ばれる関数を登録する（ほかのタブ・端末での変更も含む）。
 * 登録した直後に一度、今の一覧で呼ばれ、そのあとは変わるたびに呼ばれる。
 * 戻り値の関数を呼ぶと登録を解除する。React なら useEffect の後片付けで呼ぶ。
 */
export function onWishesChange(callback: (wishes: Wish[]) => void): () => void {
  if (!isBrowser()) return () => {};
  return store().onWishesChange(callback);
}
