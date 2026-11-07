// Firebase の初期化と匿名ログイン（ブラウザでだけ使う）
//
// 設定値は .env.local の NEXT_PUBLIC_FIREBASE_* から読む（.env.example を参照）。
// NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true のときは、手元のエミュレーターにつなぐ
// （本物の Firebase には一切つながない）。手順は docs/firebase.md。

import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  connectAuthEmulator,
  getAuth,
  signInAnonymously,
  type User,
} from "firebase/auth";
import { connectFirestoreEmulator, type Firestore, getFirestore } from "firebase/firestore";

// NEXT_PUBLIC_ の値はビルド時に埋め込まれるため、process.env.○○ と1つずつ書く必要がある
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "127.0.0.1";

const firebaseConfig = useEmulator
  ? {
      // エミュレーター用の仮の値。"demo-" で始まるプロジェクトは本物につながらない
      apiKey: "demo-api-key",
      authDomain: "demo-dfhack26-dentou.firebaseapp.com",
      projectId: "demo-dfhack26-dentou",
      appId: "demo-app-id",
    }
  : {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

/** Firebase を使える設定がそろっているか（そろっていなければ localStorage で動かす） */
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

/** エミュレーターにつないでいるか（確認用ページの表示などに使う） */
export function isUsingEmulator(): boolean {
  return useEmulator;
}

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let services: FirebaseServices | null = null;

/** Firebase の app・auth・db を返す。最初に呼ばれたときだけ初期化する */
export function getFirebase(): FirebaseServices {
  if (services) return services;
  if (typeof window === "undefined") {
    throw new Error("Firebase はブラウザでだけ使えます");
  }
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase の設定（NEXT_PUBLIC_FIREBASE_*）がありません");
  }
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (useEmulator) {
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorHost, 8080);
  }
  services = { app, auth, db };
  return services;
}

let signInPromise: Promise<User> | null = null;

/**
 * ログイン中のユーザーを返す。まだなら匿名ログインする。
 * 匿名ログインのユーザーはブラウザに残るので、再読み込みしても同じ uid になる。
 */
export function ensureSignedIn(): Promise<User> {
  const { auth } = getFirebase();
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (!signInPromise) {
    signInPromise = (async () => {
      // 前回のログイン状態の読み込みを待つ
      await auth.authStateReady();
      if (auth.currentUser) return auth.currentUser;
      const credential = await signInAnonymously(auth);
      return credential.user;
    })().catch((error: unknown) => {
      // 失敗したら、次に呼ばれたときにやり直せるようにする
      signInPromise = null;
      throw error;
    });
  }
  return signInPromise;
}
