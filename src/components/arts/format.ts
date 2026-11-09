// 公演の日付を画面向けの文字にする

import type { ArtEvent } from "@/data/events";

/** "2026-12-02" → "12/2(水)" */
export function formatDay(ymd: string): string {
  return new Date(`${ymd}T00:00:00+09:00`).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  });
}

/** 期間の文字（1 日だけの公演はその日だけ） */
export function formatPeriod(event: ArtEvent): string {
  return event.startDate === event.endDate
    ? formatDay(event.startDate)
    : `${formatDay(event.startDate)}〜${formatDay(event.endDate)}`;
}
