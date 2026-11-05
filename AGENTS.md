# AGENTS.md — チーム開発ルール

このファイルは、チーム全員の AI エージェント（Antigravity / Gemini CLI / Claude など）が従う共通ルールです。
ルールを変えるときは、このファイルだけを編集してください（GEMINI.md などはこのファイルを読み込むだけです）。

---

## 1. プロジェクト概要

- イベント：DevFest GDGoC Japan Hackathon 2026（テーマ：Build with Google Cloud & Gemini）
- 作るもの：若者が伝統芸能（歌舞伎・狂言など）に出会うための Web アプリ
- 画面の流れ：**① 診断 → ② ミニ体験 → ③ 詳細 → ④ 行きたい**
  - ① 診断：5問ほどのタップ式診断で、合う伝統芸能をおすすめする
  - ② ミニ体験：歌舞伎「見得チャレンジ」（カメラ）、狂言「名乗りチャレンジ」（マイク）を Gemini が講評する
  - ③ 詳細：初心者向け Q&A、近くの公演・体験会（Google Maps）
  - ④ 行きたい：1タップで登録し、カレンダー追加・地図・チケットページへつなぐ
- 審査基準：Google 技術の活用 / プロダクトの完成度 / 社会課題の解決力 / ピッチ
- **動くものを優先する。作り込みすぎない。**

## 2. 技術スタック（確定）

| 用途 | 技術 |
|---|---|
| フレームワーク | Next.js 16（App Router）+ React 19 + TypeScript |
| スタイル | Tailwind CSS v4 |
| AI | Gemini（Vertex AI 経由。SDK は `@google/genai`） |
| ログイン | Firebase Authentication（Google ログイン） |
| DB | Cloud Firestore（asia-northeast1） |
| 地図 | Google Maps JavaScript API |
| 公開 | Cloud Run（asia-northeast1） |
| Google Cloud プロジェクト ID | `dfhack26-dentou` |

## 3. フォルダ構成と担当

### 担当

| | 担当 | 名前 |
|---|---|---|
| A | 画面①（① 診断・③ 詳細・④ 行きたい） | 小松菜 |
| B | 画面②（② ミニ体験：カメラ・マイク） | ももんぐ |
| C | AI・サーバー・デプロイ | けーの |
| D | データ・Firebase・Maps・資料 | おたけん |

### フォルダと担当

```
src/app/page.tsx、src/app/layout.tsx … トップ・全体の枠       担当：A
src/app/diagnosis/   … ① 診断                              担当：A
src/app/arts/        … ③ 詳細（伝統芸能ごとのページ）        担当：A
src/app/wishlist/    … ④ 行きたい                          担当：A
src/app/challenge/   … ② ミニ体験（見得・名乗り）            担当：B
src/components/      … 画面の部品（challenge/ の下は B、それ以外は A）
src/app/api/         … サーバー処理（Gemini 呼び出し）       担当：C
src/lib/gemini/      … Gemini の共通処理                    担当：C
src/lib/api-response.ts … API のエラー・入力チェックの共通処理 担当：C
src/lib/firebase/    … Firebase（ログイン・Firestore）      担当：D
src/lib/maps/        … Google Maps                         担当：D
src/data/            … 伝統芸能の文章・公演データ（チームで確認済みのもの）担当：D
docs/                … 資料                                担当：D（docs/api.md は下記）
public/              … 画像などの静的ファイル                担当：D
Dockerfile・next.config.ts など … デプロイ・設定              担当：C
types/               … 共通の型定義                        管理：C ※変更前に必ず声をかける
docs/api.md          … API の仕様（担当の境目）              管理：C 実装はこれに従う
```

- **自分の担当フォルダ以外は編集しない。** 必要なときは人間に確認する。
- 画面のパス（`diagnosis` など）は仮。変えるときはこの表も直す。
- `src/lib/` で上にないものを作るときは、先にチームに声をかける。
- `types/` と `docs/api.md` は担当同士の約束ごと。勝手に変えない。

## 4. AI の利用ルール（ハッカソン規定）

- 開発のメインは **Antigravity と Gemini CLI**。Claude などは補助として使う。
- **プロダクト内の AI 機能は Gemini のみを使う。**
- `openai`、`@anthropic-ai/sdk` など、**他社 AI の SDK・API を追加しない。**
- 画像生成が必要なら Imagen、動画なら Veo など、Google の AI を使う。
- Gemini の呼び出しは**必ずサーバー側（`src/app/api/`）で行う。** ブラウザから直接呼ばない。
- Gemini に任せるのは講評・コメント・要約などに限る。伝統芸能の事実（隈取の色の意味、演目のあらすじなど）は、チームで確認した文章を用意して使う。

## 5. 秘密情報（提出用リポジトリは public）

- API キー、パスワード、サービスアカウントの鍵（JSON）は**コードに直接書かない。** 必ず `.env.local` などの環境変数から読み込む。
- `.env*`、`.dev.vars`、`*-key.json`、`service-account*.json` は**絶対にコミットしない。**
- コミット前に `git diff --staged` で秘密情報が含まれていないか確認する。
- 誤ってコミット・push した場合は、作業を止めて**すぐ人間に報告する。** キーは作り直す必要がある。
- ブラウザで使う値（Firebase の `firebaseConfig` など）は `NEXT_PUBLIC_` 付きの環境変数にする。

## 6. Git のルール

- **`main` ブランチで作業・コミットしない。** 作業前に必ず最新の main からブランチを作る。
```
  git switch main
  git pull origin main
  git switch -c feature/担当-内容
```
- ブランチ名：`種類/担当-内容`
  - `feature/`（新機能）例：`feature/front-shindan`
  - `fix/`（バグ修正）例：`fix/ai-koshou-error`
  - `docs/`（資料）例：`docs/api-spec`
- ブランチ1本につき機能1つ。小さく作って、こまめに PR を出す（目安：2〜3時間に1回）。
- コミットメッセージは日本語で「何をしたか」を1行で書く。例：`診断画面の質問を5問追加`
- PR は `.github/pull_request_template.md` の形式で説明を書く。
- **AI は、push・PR 作成・マージを人間の指示があるときだけ行う。**
- **コンフリクトが起きたら、自動で解消せずに人間に報告する。**
- `git push --force` は使わない。
- **`submit`（提出用リポジトリ）には push しない。** 提出は提出担当が行う。

## 7. コーディング規約

- TypeScript は `strict`。`any` はできるだけ使わない。
- 命名：
  - コンポーネント・型：`PascalCase`（例：`MiePoseChallenge`）
  - 変数・関数：`camelCase`（例：`fetchRecommendation`）
  - ファイル：コンポーネントは `PascalCase.tsx`、それ以外は `kebab-case.ts`
- API の入出力の型は `types/` に定義し、画面とサーバーで共有する。
- **新しいライブラリを追加する前に、人間に確認する。**
- コードは整形（Prettier）とリンター（ESLint）に従う。
- 画面はスマホ表示を優先する（審査員がスマホで触る可能性がある）。
- エラー時は画面にやさしい日本語のメッセージを出す。

## 8. 素材・著作権（提出用リポジトリは MIT License で公開）

- 公演の写真・映像、ネットで拾った画像・音声を**リポジトリに入れない。**
- 使ってよいもの：自分たちで作ったもの、Google の生成 AI で作ったもの、ライセンスを確認した素材。
- 外部素材を使う場合は、出典とライセンスを README に書く。
- 動画を見せたいときは、公式の YouTube 動画を埋め込む。
- カメラ・マイクのデータは講評にだけ使い、保存しない。画面にもそう明記する。

## 9. 言語

- 回答、説明、コード内のコメント、コミットメッセージ、PR の説明は**日本語**で書く。
- 変数名・関数名・ファイル名は**英語**にする。

## 10. 締切

| 日時 | 内容 |
|---|---|
| 11/9（月） | 提出用リポジトリへ練習 push、Cloud Run にデプロイ |
| 11/10（火）12:00 | main 凍結（以降はバグ修正のみ） |
| 11/10（火）17:00 | 提出用リポジトリへ最終 push |
| 11/10（火）19:00 | **コードフリーズ（以降 push 不可）** |
