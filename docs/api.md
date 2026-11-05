# API 仕様

画面（`src/app/`）とサーバー（`src/app/api/`）の約束ごとです。実装はこの仕様に従ってください。
**変更するときは、必ずチームに声をかけてから** この文書と `types/api.ts` を一緒に更新します。

- 型の定義：`types/api.ts`（`import type { ... } from "@/types/api"` で読み込む）
- 送受信はすべて JSON（`Content-Type: application/json`）
- Gemini の呼び出しはサーバー側だけで行う。ブラウザから直接呼ばない
- カメラの画像・マイクの音声は講評にだけ使い、**保存しない**

## 現在の状態：モック

いまの 3 つの API は、**入力の形式だけをチェックし、決まった結果を返すモック**です。
画面の担当は、Gemini の実装を待たずにこの API を使って画面を作れます。
返ってくる文章には「（モック）」と入っています。

本実装に切り替えるときも、入出力の形は変えません。

## 一覧

| メソッド | パス | 用途 | リクエスト型 | レスポンス型 |
|---|---|---|---|---|
| POST | `/api/diagnosis` | ① 診断の結果を返す | `DiagnosisRequest` | `DiagnosisResponse` |
| POST | `/api/critique/mie` | ② 見得チャレンジの講評 | `MieCritiqueRequest` | `CritiqueResponse` |
| POST | `/api/critique/nanori` | ② 名乗りチャレンジの講評 | `NanoriCritiqueRequest` | `CritiqueResponse` |

---

## POST /api/diagnosis

診断の回答を受け取り、三大伝統芸能のうちおすすめを返します。

| 値 | 伝統芸能 |
|---|---|
| `nogaku` | 能楽（能・狂言） |
| `ningyoJoruri` | 人形浄瑠璃（文楽） |
| `kabuki` | 歌舞伎 |

### リクエスト

```json
{
  "answers": [
    { "questionId": "q1", "choiceId": "q1-a" },
    { "questionId": "q2", "choiceId": "q2-c" }
  ]
}
```

| 項目 | 型 | 必須 | 説明 |
|---|---|---|---|
| `answers` | 配列 | ○ | 1 件以上 |
| `answers[].questionId` | string | ○ | 質問の ID |
| `answers[].choiceId` | string | ○ | 選んだ選択肢の ID |

質問と選択肢の ID は、診断画面の担当が決めます（決まったらこの文書に追記する）。

### レスポンス（200）

```json
{
  "recommended": "nogaku",
  "scores": { "nogaku": 88, "ningyoJoruri": 56, "kabuki": 72 },
  "message": "（モックの結果です）あなたには能楽がおすすめです。"
}
```

| 項目 | 型 | 説明 |
|---|---|---|
| `recommended` | `"nogaku"` \| `"ningyoJoruri"` \| `"kabuki"` | いちばんのおすすめ |
| `scores` | 伝統芸能ごとの数値 | 相性（0〜100） |
| `message` | string | おすすめ理由のひとこと |

---

## POST /api/critique/mie

見得チャレンジで撮った写真を受け取り、講評を返します。

### リクエスト

```json
{ "image": "data:image/jpeg;base64,/9j/4AAQ..." }
```

| 項目 | 型 | 必須 | 説明 |
|---|---|---|---|
| `image` | string | ○ | JPEG または PNG の data URL。**5MB まで** |

ブラウザでは `canvas.toDataURL("image/jpeg", 0.8)` の結果をそのまま送れます。

### レスポンス（200）

`CritiqueResponse`（下の「講評の共通レスポンス」を参照）

---

## POST /api/critique/nanori

名乗りチャレンジで録った音声を受け取り、講評を返します。

### リクエスト

```json
{ "audio": "data:audio/webm;base64,GkXfo59..." }
```

| 項目 | 型 | 必須 | 説明 |
|---|---|---|---|
| `audio` | string | ○ | `audio/` で始まる MIME の data URL（`audio/webm`、`audio/mp4` など）。**10MB まで** |

ブラウザでは `MediaRecorder` で録った Blob を `FileReader.readAsDataURL()` で変換して送れます。
録音は 15 秒くらいまでを目安にします。

### レスポンス（200）

`CritiqueResponse`（下の「講評の共通レスポンス」を参照）

---

## 講評の共通レスポンス（CritiqueResponse）

```json
{
  "score": 78,
  "title": "（モック）堂々とした見得！",
  "comment": "（モックの講評です）目線に力があって、ぐっと引きつけられます。",
  "tips": ["あごを少し引いてみましょう", "動きを止める瞬間をもう少し長く"]
}
```

| 項目 | 型 | 説明 |
|---|---|---|
| `score` | number | 点数（0〜100） |
| `title` | string | ひとことの見出し |
| `comment` | string | 講評の本文 |
| `tips` | string[] | 次に試すとよいポイント（1〜3 個） |

---

## エラー（全 API 共通）

エラーのときは次の形で返します。`message` は画面にそのまま出せる日本語です。

```json
{ "error": { "code": "BAD_REQUEST", "message": "写真が届きませんでした。もう一度撮ってください。" } }
```

| `code` | ステータス | いつ |
|---|---|---|
| `BAD_REQUEST` | 400 | 入力が足りない・形式がちがう |
| `PAYLOAD_TOO_LARGE` | 413 | 画像・音声が上限サイズをこえた |
| `INTERNAL_ERROR` | 500 | サーバー側の失敗（Gemini の呼び出し失敗など） |

## 試し方

`npm run dev` のあと、別のターミナルで：

```bash
curl -X POST http://localhost:3000/api/diagnosis \
  -H "Content-Type: application/json" \
  -d '{"answers":[{"questionId":"q1","choiceId":"q1-a"}]}'
```
