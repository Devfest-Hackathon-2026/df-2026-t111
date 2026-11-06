// 「行きたい」をブラウザの localStorage に保存する実装
// Firebase の設定（.env.local）がないときに使う。画面からは直接 import しない（wishlist.ts を使う）。

import type { PerformingArt } from "@/types/api";
import { isArtId, type Wish, WishlistError, type WishlistStore } from "./wishlist-types";

const STORAGE_KEY = "dfhack26-dentou:wishes:v1";
const CHANGE_EVENT = "dfhack26-dentou:wishes-change";

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
  return typeof v.eventId === "string" && typeof v.createdAt === "string" && isArtId(v.artId);
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

async function listWishes(): Promise<Wish[]> {
  return readWishes().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const localStore: WishlistStore = {
  listWishes,

  async hasWish(eventId: string) {
    return readWishes().some((wish) => wish.eventId === eventId);
  },

  async addWish(eventId: string, artId: PerformingArt) {
    const wishes = readWishes();
    if (wishes.some((wish) => wish.eventId === eventId)) return;
    writeWishes([...wishes, { eventId, artId, createdAt: new Date().toISOString() }]);
  },

  async removeWish(eventId: string) {
    const wishes = readWishes();
    const next = wishes.filter((wish) => wish.eventId !== eventId);
    if (next.length === wishes.length) return;
    writeWishes(next);
  },

  onWishesChange(callback) {
    if (typeof window === "undefined") return () => {};
    let active = true;
    const handleChange = () => {
      void listWishes().then((wishes) => {
        if (active) callback(wishes);
      });
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) handleChange();
    };
    window.addEventListener(CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleStorage);
    // Firestore 版とそろえて、最初に一度、今の一覧で呼ぶ
    handleChange();
    return () => {
      active = false;
      window.removeEventListener(CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleStorage);
    };
  },
};
