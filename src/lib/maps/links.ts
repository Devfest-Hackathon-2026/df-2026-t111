// Google マップのアプリ・サイトを開くリンク（Google の「Maps URLs」）
// API キーがいらないので、地図を表示できないときや「行きたい」画面の「地図」ボタンでも使える。
// https://developers.google.com/maps/documentation/urls/get-started

import type { LatLng } from "@/data/events";

function point(location: LatLng): string {
  return `${location.lat},${location.lng}`;
}

/** その場所を Google マップで開くリンク */
export function googleMapsUrl(location: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point(location))}`;
}

/** 現在地からその場所までの道順を Google マップで開くリンク */
export function googleMapsDirectionsUrl(destination: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point(destination))}`;
}
