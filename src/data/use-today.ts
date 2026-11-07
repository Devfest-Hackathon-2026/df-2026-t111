// 日本時間の「今日の日付」を、画面（クライアントコンポーネント）で安全に使うためのフック
//
// このプロジェクトの設定（cacheComponents）では、画面を描く途中で new Date() を呼ぶとエラーになる。
// このフックは、サーバーで描くときは null を返し、ブラウザで表示されてから今日の日付を返す。
// 使い方：
//   const today = useTodayInJapan();
//   const list = today ? getUpcomingEventsForArt(artId, today) : [];

import { useSyncExternalStore } from "react";
import { todayInJapan } from "./events";

// 日付は表示中に変わることがほとんどないので、変化の通知はしない
function subscribe(): () => void {
  return () => {};
}

/** 日本時間の今日の日付（"YYYY-MM-DD"）。サーバーで描くときと、表示される直前は null */
export function useTodayInJapan(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => todayInJapan(new Date()),
    () => null,
  );
}
