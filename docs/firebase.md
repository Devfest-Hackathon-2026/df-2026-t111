# Firebase（ログイン・Firestore）

担当：D（おたけん）。コードは `src/lib/firebase/`、ルールは `firestore.rules`。

## いまの使いみち

| 機能 | 保存場所 | だれが読み書きできるか |
|---|---|---|
| 「行きたい」登録 | `users/{uid}/wishes/{eventId}` | 本人だけ |

- ログインは **匿名ログイン**（ログイン画面なしで `uid` がもらえる）。Google ログインは「余裕があれば」。
- 1 件のデータは `eventId`（公演・体験会の ID）・`artId`（`nogaku` など）・`createdAt`（登録日時）の 3 つだけ。
- 画面からは `src/lib/firebase/wishlist.ts` の関数だけを使う（`addWish` など）。

## 保存先の切り替え

`.env.local` の中身で、保存先が自動で変わる。画面のコードは同じまま。

| `.env.local` | 保存先 |
|---|---|
| Firebase の設定がない | ブラウザの localStorage（その端末だけ） |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` | 手元のエミュレーター（本物の Firebase にはつながない） |
| `NEXT_PUBLIC_FIREBASE_*` がそろっている | 本物の Firestore |

## エミュレーターで試す（キーがなくても試せる）

Java（21 以上）が必要。初回は firebase-tools とエミュレーターのダウンロードに少し時間がかかる。

1. `.env.local` に次の 1 行を書く（`.env.local` はコミットしない）

   ```
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
   ```

2. ターミナルを 2 つ開き、それぞれで実行する

   ```powershell
   # 1つ目：エミュレーター（止めるときは Ctrl + C）
   npx firebase-tools@15.35.0 emulators:start --only auth,firestore --project demo-dfhack26-dentou
   ```

   ```powershell
   # 2つ目：アプリ
   npm run dev
   ```

3. アプリを開いて「行きたい」を押す。保存された中身は http://127.0.0.1:4000/firestore で見られる
4. エミュレーターを止めると、保存した中身は消える

## 本物の Firebase につなぐ（Firebase コンソールでの準備）

1. Firestore を作る。**場所は `asia-northeast1`（東京）。あとから変えられない**
2. Authentication → ログイン方法 → **匿名** を有効にする
3. プロジェクトの設定 → マイアプリ → ウェブアプリを登録し、`firebaseConfig` の値を `.env.local` の `NEXT_PUBLIC_FIREBASE_*` に入れる
4. Firestore → ルール に `firestore.rules` の中身を貼って公開する（または `npx firebase-tools deploy --only firestore:rules --project dfhack26-dentou`）
   - **テストモードのまま公開しない。** テストモードは誰でも読み書きできる
5. Cloud Run で公開したら、Authentication → 設定 → 承認済みドメイン に Cloud Run の URL を足す

`NEXT_PUBLIC_` の値はビルドのときに埋め込まれるので、Cloud Run では実行時ではなくビルド時に渡す必要がある（デプロイ担当と相談）。
