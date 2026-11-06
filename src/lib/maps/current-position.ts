// 現在地の取得（「近くの公演・体験会」用。ブラウザでだけ使う）
//
// ・ボタンを押したときなど、ユーザーが操作したときに呼ぶ（いきなり許可を求めない）
// ・現在地は並べ替えにだけ使い、保存しない・サーバーに送らない

import type { LatLng } from "@/data/events";

/** 現在地を取れなかったときのエラー。message は画面にそのまま出せる */
export class PositionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PositionError";
  }
}

/** 現在地を取得する。取れなければ PositionError */
export function getCurrentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new PositionError("このブラウザでは現在地を使えません。"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(
            new PositionError(
              "現在地の使用が許可されていません。ブラウザの設定で位置情報を許可すると、近い順に並べられます。",
            ),
          );
        } else if (error.code === error.TIMEOUT) {
          reject(
            new PositionError("現在地の取得に時間がかかっています。もう一度ためしてください。"),
          );
        } else {
          reject(new PositionError("現在地を取得できませんでした。もう一度ためしてください。"));
        }
      },
      // 近い順に並べるだけなので、だいたいの位置で十分（電池の消費も少ない）
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  });
}
