// 公演・体験会のデータ（③ 詳細 の「近くの公演・体験会」と ④ 行きたい で使う）
//
// ※ いまは画面をつなぐための仮データ。タイトルに「（仮）」がつき、isSample が true のものは本物ではない。
//   公演は会場だけ実在（緯度・経度はおおよそ）、日時・内容は架空。体験会は会場も架空。
//   本物の公演情報は、公式サイトで確認したものに差し替える（11/7〜8 予定）。

import type { PerformingArt } from "@/types/api";

/** 緯度・経度 */
export interface LatLng {
  lat: number;
  lng: number;
}

/** 公演・体験会 1 件 */
export interface ArtEvent {
  /** 「行きたい」登録でも使う ID。一度決めたら変えない */
  id: string;
  /** どの伝統芸能か */
  artId: PerformingArt;
  /** performance：公演、workshop：体験会 */
  kind: "performance" | "workshop";
  title: string;
  /** ひとことの説明 */
  description: string;
  venueName: string;
  address: string;
  /** 地図のピンの位置 */
  location: LatLng;
  /** 開始日時（日本時間、ISO 8601。例："2026-11-21T13:00:00+09:00"） */
  startAt: string;
  /** 終了日時（同上） */
  endAt: string;
  /** チケット・申し込みページ。仮データにはない */
  ticketUrl?: string;
  /** 仮データなら true */
  isSample: boolean;
}

export const events: ArtEvent[] = [
  {
    id: "sample-kabuki-performance",
    artId: "kabuki",
    kind: "performance",
    title: "（仮）歌舞伎の公演",
    description: "画面確認用の仮データです。",
    venueName: "歌舞伎座",
    address: "東京都中央区銀座4-12-15",
    location: { lat: 35.6695, lng: 139.7679 },
    startAt: "2026-11-21T11:00:00+09:00",
    endAt: "2026-11-21T15:00:00+09:00",
    isSample: true,
  },
  {
    id: "sample-kabuki-workshop",
    artId: "kabuki",
    kind: "workshop",
    title: "（仮）見得の体験会",
    description: "画面確認用の仮データです。",
    venueName: "（仮）名古屋の会場",
    address: "（仮の住所）愛知県名古屋市",
    location: { lat: 35.1709, lng: 136.8815 },
    startAt: "2026-11-28T14:00:00+09:00",
    endAt: "2026-11-28T15:30:00+09:00",
    isSample: true,
  },
  {
    id: "sample-nogaku-performance",
    artId: "nogaku",
    kind: "performance",
    title: "（仮）能と狂言の公演",
    description: "画面確認用の仮データです。",
    venueName: "国立能楽堂",
    address: "東京都渋谷区千駄ケ谷4-18-1",
    location: { lat: 35.6807, lng: 139.7088 },
    startAt: "2026-11-22T13:00:00+09:00",
    endAt: "2026-11-22T16:00:00+09:00",
    isSample: true,
  },
  {
    id: "sample-nogaku-workshop",
    artId: "nogaku",
    kind: "workshop",
    title: "（仮）狂言の名乗りの体験会",
    description: "画面確認用の仮データです。",
    venueName: "（仮）京都の会場",
    address: "（仮の住所）京都府京都市",
    location: { lat: 35.0116, lng: 135.7681 },
    startAt: "2026-12-05T10:00:00+09:00",
    endAt: "2026-12-05T11:30:00+09:00",
    isSample: true,
  },
  {
    id: "sample-ningyo-joruri-performance",
    artId: "ningyoJoruri",
    kind: "performance",
    title: "（仮）文楽の公演",
    description: "画面確認用の仮データです。",
    venueName: "国立文楽劇場",
    address: "大阪府大阪市中央区日本橋1-12-10",
    location: { lat: 34.6658, lng: 135.5066 },
    startAt: "2026-11-23T11:00:00+09:00",
    endAt: "2026-11-23T15:00:00+09:00",
    isSample: true,
  },
  {
    id: "sample-ningyo-joruri-workshop",
    artId: "ningyoJoruri",
    kind: "workshop",
    title: "（仮）人形を動かす体験会",
    description: "画面確認用の仮データです。",
    venueName: "（仮）福岡の会場",
    address: "（仮の住所）福岡県福岡市",
    location: { lat: 33.5902, lng: 130.4017 },
    startAt: "2026-12-06T14:00:00+09:00",
    endAt: "2026-12-06T15:30:00+09:00",
    isSample: true,
  },
];

/** id から公演・体験会を取り出す。見つからなければ undefined */
export function getEvent(id: string): ArtEvent | undefined {
  return events.find((event) => event.id === id);
}

/** その伝統芸能の公演・体験会を、開始日時の早い順に返す */
export function getEventsForArt(artId: PerformingArt): ArtEvent[] {
  return events
    .filter((event) => event.artId === artId)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}
