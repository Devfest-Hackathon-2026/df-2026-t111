# 地図（Google Maps）

担当：D（おたけん）。コードは `src/lib/maps/`。

## 使えるもの

| ファイル | 中身 | キーが必要？ |
|---|---|---|
| `EventMap.tsx` | 会場にピンを立てる地図の部品。キーがない・使えないときは会場の一覧とリンクを出す | 地図の表示だけ必要 |
| `links.ts` | Google マップで場所・道順を開くリンク（`googleMapsUrl`・`googleMapsDirectionsUrl`） | いらない |
| `distance.ts` | 2 地点の距離・近い順に並べる・距離の表示（`distanceKm`・`sortByDistance`・`formatDistance`） | いらない |
| `current-position.ts` | 現在地の取得（`getCurrentPosition`）。保存しない | いらない |
| `load-google-maps.ts` | Google Maps の読み込み（`EventMap` の中で使う） | 必要 |

### 例：③ 詳細の「近くの公演・体験会」

```tsx
const today = useTodayInJapan();
const [here, setHere] = useState<LatLng | null>(null);
const list = today ? getUpcomingEventsForArt(artId, today) : [];
const sorted = here ? sortByDistance(list, here) : list;

<button onClick={() => getCurrentPosition().then(setHere).catch((e) => setMessage(e.message))}>
  現在地から近い順にする
</button>
<EventMap events={sorted} userLocation={here} className="h-64 w-full" />
```

## キーの準備（Google Cloud コンソール）

1. 「Maps JavaScript API」を有効にする
2. 認証情報 → API キーを作る
   - **アプリケーションの制限：ウェブサイト（HTTP リファラー）**
     - `http://localhost:3000/*`（手元で試す用）
     - Cloud Run の URL（例：`https://○○.a.run.app/*`）
   - **API の制限：Maps JavaScript API だけ**
3. （任意）Google Maps Platform → 地図の管理 で地図 ID（ベクター、JavaScript）を作る。なければ `DEMO_MAP_ID` で動く
4. `.env.local` に書く（コミットしない）

   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=ここにキー
   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=ここに地図ID（なければ書かない）
   ```

`NEXT_PUBLIC_` の値はビルドのときに埋め込まれるので、Cloud Run では実行時ではなくビルド時に渡す必要がある（デプロイ担当と相談）。
