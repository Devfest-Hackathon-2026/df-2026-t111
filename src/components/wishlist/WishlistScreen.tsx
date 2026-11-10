"use client";

// ④ 行きたい：登録した公演の一覧と、カレンダー・地図・チケットへのリンク

import Link from "next/link";
import { useEffect, useState } from "react";
import { arts } from "@/data/arts";
import {
  type ArtEvent,
  getEvent,
  getNextPerformanceDate,
  googleCalendarUrl,
  isEventOver,
} from "@/data/events";
import { useTodayInJapan } from "@/data/use-today";
import { onWishesChange, removeWish, type Wish, WishlistError } from "@/lib/firebase/wishlist";
import { EventMap } from "@/lib/maps/EventMap";
import { googleMapsDirectionsUrl, googleMapsDirectionsUrlByName } from "@/lib/maps/links";
import { formatDay, formatPeriod } from "@/components/arts/format";
import {
  getRecommendedPerformance,
  type PerformanceItem,
  recommendedVenueQuery,
} from "@/components/arts/RecommendedPerformances";
import { ArrowLabel, StagePage } from "@/components/arts/StagePage";
import type { PerformingArt } from "@/types/api";

const actionClass =
  "block py-3 rounded-xl text-center font-bold shadow-sm transition hover:opacity-90";

function WishCard({
  event,
  today,
  onRemove,
}: {
  event: ArtEvent;
  today: string | null;
  onRemove: () => void;
}) {
  const over = today ? isEventOver(event, today) : false;
  const nextDate = today ? getNextPerformanceDate(event, today) : null;
  const calendarUrl = today ? googleCalendarUrl(event, today) : null;
  return (
    <li className="bg-[#f4efe6] border border-[#8c7863] rounded-xl p-4 shadow-sm">
      <p className="text-sm font-bold text-[#017824]">{arts[event.artId].name}</p>
      <p className="text-lg font-extrabold text-[#2a241e]">{event.title}</p>
      <p className="mt-1 font-bold">
        {formatPeriod(event)}　{event.venueName}
      </p>
      {over ? (
        <p className="mt-1 text-sm font-bold text-[#a33a1c]">この公演は終わりました。</p>
      ) : (
        nextDate && (
          <p className="mt-1 text-sm">
            いちばん近い公演日：{formatDay(nextDate)}（開演 {event.showTimes.join(" / ")}）
          </p>
        )
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {calendarUrl && (
          <a
            className={`${actionClass} bg-[#DDB442] text-[#2a241e]`}
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            カレンダーに追加
          </a>
        )}
        <a
          className={`${actionClass} bg-[#DDB442] text-[#2a241e]`}
          href={googleMapsDirectionsUrl(event.location, event.venueName)}
          target="_blank"
          rel="noopener noreferrer"
        >
          行き方を見る
        </a>
        {event.ticketUrl && !over && (
          <a
            className={`${actionClass} bg-[#017824] text-white`}
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            チケットを買う
          </a>
        )}
        <a
          className={`${actionClass} bg-white/70 border border-[#8c7863] text-[#2a241e]`}
          href={event.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          公式ページ
        </a>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-3 w-full text-sm font-bold text-[#6b5c4d] underline cursor-pointer"
      >
        リストから外す
      </button>
    </li>
  );
}

// ③ 詳細の「おすすめ公演」カードから登録したもの。日程と座標のデータがないので、
// カレンダー追加と地図のピンは出さず、公式ページと道順だけを案内する。
function RecommendedWishCard({
  artId,
  item,
  onRemove,
}: {
  artId: PerformingArt;
  item: PerformanceItem;
  onRemove: () => void;
}) {
  return (
    <li className="bg-[#f4efe6] border border-[#8c7863] rounded-xl p-4 shadow-sm">
      <p className="text-sm font-bold text-[#017824]">{arts[artId].name}　おすすめ公演</p>
      <p className="text-lg font-extrabold text-[#2a241e]">{item.name}</p>
      <p className="mt-1 font-bold">{item.venue}</p>
      <p className="mt-1 text-sm">日程は公式ページで確認してください。</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          className={`${actionClass} bg-[#DDB442] text-[#2a241e]`}
          href={googleMapsDirectionsUrlByName(recommendedVenueQuery(item))}
          target="_blank"
          rel="noopener noreferrer"
        >
          行き方を見る
        </a>
        <a
          className={`${actionClass} bg-white/70 border border-[#8c7863] text-[#2a241e]`}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          公式ページ
        </a>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-3 w-full text-sm font-bold text-[#6b5c4d] underline cursor-pointer"
      >
        リストから外す
      </button>
    </li>
  );
}

type WishEntry =
  | { kind: "event"; wish: Wish; event: ArtEvent }
  | { kind: "recommended"; wish: Wish; artId: PerformingArt; item: PerformanceItem };

export function WishlistScreen() {
  const today = useTodayInJapan();
  const [wishes, setWishes] = useState<Wish[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => onWishesChange(setWishes), []);

  // 公演データ（events.ts）にあればそちらを、なければおすすめ公演カードのデータを探す
  const items: WishEntry[] = (wishes ?? []).flatMap((wish): WishEntry[] => {
    const event = getEvent(wish.eventId);
    if (event) return [{ kind: "event", wish, event }];
    const recommended = getRecommendedPerformance(wish.eventId);
    return recommended ? [{ kind: "recommended", wish, ...recommended }] : [];
  });
  const mapEvents = items
    .flatMap((entry) => (entry.kind === "event" ? [entry.event] : []))
    .filter((event) => (today ? !isEventOver(event, today) : false));

  async function remove(eventId: string) {
    setMessage(null);
    try {
      await removeWish(eventId);
    } catch (error) {
      setMessage(
        error instanceof WishlistError
          ? error.message
          : "うまくいきませんでした。もう一度ためしてください。",
      );
    }
  }

  return (
    <StagePage title="行きたい" band="気になる公演を、本物の舞台で">
      {message && (
        <p className="mb-4 rounded-lg bg-white/70 border border-[#D5512A] p-3 text-sm font-bold text-[#a33a1c]">
          {message}
        </p>
      )}

      {wishes === null ? (
        <p className="text-center font-bold text-[#6b5c4d]">読み込み中…</p>
      ) : items.length === 0 ? (
        <div className="bg-[#f4efe6] border border-[#8c7863] rounded-xl p-6 text-center">
          <p className="font-bold leading-relaxed text-[#2a241e]">
            まだ登録がありません。
            <br />
            診断で、あなたに合う伝統芸能を見つけてみましょう。
          </p>
          <Link
            href="/diagnosis"
            className="mt-4 block py-3 rounded-xl bg-[#DDB442] font-extrabold text-[#2a241e] shadow-sm"
          >
            診断をはじめる
          </Link>
        </div>
      ) : (
        <>
          {mapEvents.length > 0 && (
            <div className="pb-7 mb-3">
              <EventMap events={mapEvents} className="h-56 w-full" />
            </div>
          )}
          <ul className="space-y-4">
            {items.map((entry) =>
              entry.kind === "event" ? (
                <WishCard
                  key={entry.wish.eventId}
                  event={entry.event}
                  today={today}
                  onRemove={() => void remove(entry.wish.eventId)}
                />
              ) : (
                <RecommendedWishCard
                  key={entry.wish.eventId}
                  artId={entry.artId}
                  item={entry.item}
                  onRemove={() => void remove(entry.wish.eventId)}
                />
              ),
            )}
          </ul>
        </>
      )}

      <div className="mt-9">
        <Link href="/challenge" className="hover:opacity-85 transition">
          <ArrowLabel label="ミニ体験へ戻る" back />
        </Link>
      </div>
    </StagePage>
  );
}
