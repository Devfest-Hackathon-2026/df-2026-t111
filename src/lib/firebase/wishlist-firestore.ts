// 「行きたい」を Firestore に保存する実装
// 保存場所：users/{uid}/wishes/{eventId}（uid は匿名ログインのもの）
// 本人だけが読み書きできるように、firestore.rules で制限している。
// 画面からは直接 import しない（wishlist.ts を使う）。

import type { PerformingArt } from "@/types/api";
import { FirebaseError } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  type QueryDocumentSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { ensureSignedIn, getFirebase } from "./client";
import { isArtId, type Wish, WishlistError, type WishlistStore } from "./wishlist-types";

async function wishesCollection() {
  const user = await ensureSignedIn();
  return collection(getFirebase().db, "users", user.uid, "wishes");
}

function toWish(snapshot: QueryDocumentSnapshot): Wish | null {
  // serverTimestamp() がまだ確定していないときは、見込みの時刻を使う
  const data = snapshot.data({ serverTimestamps: "estimate" });
  if (typeof data.eventId !== "string" || !isArtId(data.artId)) return null;
  const createdAt =
    data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : new Date().toISOString();
  return { eventId: data.eventId, artId: data.artId, createdAt };
}

/** Firebase のエラーを、画面に出せるやさしい日本語に変える */
function toWishlistError(error: unknown, action: "load" | "save"): WishlistError {
  if (error instanceof WishlistError) return error;
  // 開発者が原因を調べられるように、元のエラーはコンソールに残す
  console.error("[wishlist]", error);
  const code = error instanceof FirebaseError ? error.code : "";
  if (code === "unavailable" || code === "auth/network-request-failed") {
    return new WishlistError(
      "通信がうまくいきませんでした。電波のよいところで、もう一度ためしてください。",
    );
  }
  return new WishlistError(
    action === "load"
      ? "「行きたい」を読み込めませんでした。時間をおいて、もう一度ためしてください。"
      : "「行きたい」を保存できませんでした。時間をおいて、もう一度ためしてください。",
  );
}

export const firestoreStore: WishlistStore = {
  async listWishes() {
    try {
      const snapshot = await getDocs(query(await wishesCollection(), orderBy("createdAt", "desc")));
      return snapshot.docs.map(toWish).filter((wish): wish is Wish => wish !== null);
    } catch (error) {
      throw toWishlistError(error, "load");
    }
  },

  async hasWish(eventId: string) {
    try {
      return (await getDoc(doc(await wishesCollection(), eventId))).exists();
    } catch (error) {
      throw toWishlistError(error, "load");
    }
  },

  async addWish(eventId: string, artId: PerformingArt) {
    try {
      const ref = doc(await wishesCollection(), eventId);
      // 登録済みなら何もしない（登録日時を上書きしない）
      if ((await getDoc(ref)).exists()) return;
      try {
        await setDoc(ref, { eventId, artId, createdAt: serverTimestamp() });
      } catch (error) {
        // ボタンの連打などで同時に登録すると、あとの書き込みは「書き換え」になり、
        // ルール（登録後の書き換えは不可）で拒否される。もう登録されていれば成功として扱う
        if (
          error instanceof FirebaseError &&
          error.code === "permission-denied" &&
          (await getDoc(ref)).exists()
        ) {
          return;
        }
        throw error;
      }
    } catch (error) {
      throw toWishlistError(error, "save");
    }
  },

  async removeWish(eventId: string) {
    try {
      // 登録されていなくてもエラーにはならない
      await deleteDoc(doc(await wishesCollection(), eventId));
    } catch (error) {
      throw toWishlistError(error, "save");
    }
  },

  onWishesChange(callback) {
    let unsubscribe: (() => void) | null = null;
    let active = true;
    wishesCollection()
      .then((wishes) => {
        if (!active) return;
        unsubscribe = onSnapshot(
          query(wishes, orderBy("createdAt", "desc")),
          (snapshot) => {
            callback(snapshot.docs.map(toWish).filter((wish): wish is Wish => wish !== null));
          },
          (error) => {
            toWishlistError(error, "load");
          },
        );
      })
      .catch((error: unknown) => {
        toWishlistError(error, "load");
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  },
};
