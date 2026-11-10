// Google マップのアプリ・サイトを開くリンク（Google の「Maps URLs」）
// API キーがいらないので、地図を表示できないときや「行きたい」画面の「地図」ボタンでも使える。
// https://developers.google.com/maps/documentation/urls/get-started

import type { LatLng } from "@/data/events";

function point(location: LatLng): string {
  return `${location.lat},${location.lng}`;
}

/** その場所を Google マップで開くリンク（会場名があれば会場名で検索、なければ座標） */
export function googleMapsUrl(location: LatLng, venueName?: string): string {
  const query = venueName ? encodeURIComponent(venueName) : point(location);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/** 現在地からその場所までの道順を Google マップで開くリンク（会場名があれば会場名を目的地に、なければ座標） */
export function googleMapsDirectionsUrl(destination: LatLng, venueName?: string): string {
  const dest = venueName ? encodeURIComponent(venueName) : point(destination);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

/** 現在地からその場所までの道順を、場所の名前だけで開くリンク（座標がないおすすめ公演で使う） */
export function googleMapsDirectionsUrlByName(placeName: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeName)}`;
}
