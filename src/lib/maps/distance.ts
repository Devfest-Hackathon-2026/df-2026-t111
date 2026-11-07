// 距離の計算（「近くの公演・体験会」で、現在地から近い順に並べるときに使う）
// Google Maps のキーがなくても使える。

import type { LatLng } from "@/data/events";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** 2 地点の直線距離（km）。道のりではなく、地図上のまっすぐな距離 */
export function distanceKm(from: LatLng, to: LatLng): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** 現在地から近い順に並べた新しい配列を返す（元の配列は変えない） */
export function sortByDistance<T extends { location: LatLng }>(items: T[], from: LatLng): T[] {
  return [...items].sort((a, b) => distanceKm(from, a.location) - distanceKm(from, b.location));
}

/** 距離を画面向けの文字にする（例："850 m"、"3.2 km"、"420 km"） */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 100) * 10} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
