"use client";

// ③ 詳細：伝統芸能の紹介と、近くの公演（ミニ体験の結果画面から来る）

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PerformingArt } from "@/types/api";
import { artOrder, arts } from "@/data/arts";
import { getFaqsForArt } from "@/data/faqs";
import { type ArtEvent, getUpcomingEventsForArt, type LatLng } from "@/data/events";
import { useTodayInJapan } from "@/data/use-today";
import { addWish, onWishesChange, removeWish, WishlistError } from "@/lib/firebase/wishlist";
import { getCurrentPosition, PositionError } from "@/lib/maps/current-position";
import { distanceKm, formatDistance, sortByDistance } from "@/lib/maps/distance";
import { EventMap } from "@/lib/maps/EventMap";
import { googleMapsUrl } from "@/lib/maps/links";
import { formatDay, formatPeriod } from "./format";
import { ArrowLabel, StagePage, StageSection } from "./StagePage";

const linkClass = "underline text-[#017824] font-bold";

function EventCard({
  event,
  here,
  wished,
  onToggle,
}: {
  event: ArtEvent;
  here: LatLng | null;
  wished: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="bg-[#f4efe6] border border-[#8c7863] rounded-xl p-4 shadow-sm">
      <p className="text-lg font-extrabold text-[#2a241e]">{event.title}</p>
      <p className="mt-1 font-bold">
        {formatPeriod(event)}　{event.venueName}
      </p>
      {here && (
        <p className="text-sm text-[#6b5c4d]">
          現在地から約 {formatDistance(distanceKm(here, event.location))}
        </p>
      )}
      <p className="mt-2 text-sm">開演：{event.showTimes.join(" / ")}</p>
      {event.closedDates.length > 0 && (
        <p className="text-sm">休演：{event.closedDates.map(formatDay).join("、")}</p>
      )}
      <p className="text-sm">演目：{event.programs.join("、")}</p>
      <p className="mt-2 leading-relaxed">{event.description}</p>
      <p className="mt-2 text-sm flex flex-wrap gap-x-4 gap-y-1">
        <a className={linkClass} href={event.officialUrl} target="_blank" rel="noopener noreferrer">
          公式ページ
        </a>
        <a
          className={linkClass}
          href={googleMapsUrl(event.location)}
          target="_blank"
          rel="noopener noreferrer"
        >
          地図で開く
        </a>
      </p>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={wished}
        className={`mt-3 w-full py-3 rounded-xl font-extrabold text-lg shadow-sm transition cursor-pointer ${
          wished ? "bg-[#D5512A] text-white" : "bg-[#DDB442] text-[#2a241e] hover:opacity-90"
        }`}
      >
        {wished ? "♥ 行きたいに登録済み" : "♡ 行きたい"}
      </button>
    </li>
  );
}

export function ArtDetail({ artId }: { artId: PerformingArt }) {
  const art = arts[artId];
  const faqs = getFaqsForArt(artId);
  const today = useTodayInJapan();
  const [wishedIds, setWishedIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [here, setHere] = useState<LatLng | null>(null);

  useEffect(() => onWishesChange((wishes) => setWishedIds(wishes.map((wish) => wish.eventId))), []);

  const upcoming = today ? getUpcomingEventsForArt(artId, today) : [];
  const events = here ? sortByDistance(upcoming, here) : upcoming;

  async function toggleWish(event: ArtEvent) {
    setMessage(null);
    try {
      if (wishedIds.includes(event.id)) await removeWish(event.id);
      else await addWish(event.id, event.artId);
    } catch (error) {
      setMessage(
        error instanceof WishlistError
          ? error.message
          : "うまくいきませんでした。もう一度ためしてください。",
      );
    }
  }

  async function findNearby() {
    setMessage(null);
    try {
      setHere(await getCurrentPosition());
    } catch (error) {
      setMessage(error instanceof PositionError ? error.message : "現在地を取得できませんでした。");
    }
  }

  return (
    <StagePage title={art.name} band={art.catchphrase}>
      <p className="text-sm text-[#6b5c4d] text-center">
        {art.reading}　／　{art.era}に生まれた　／　{art.mood}
      </p>

      <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg shadow-md bg-[#c2b59b]">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${art.video.youtubeId}`}
          title={art.video.title}
          loading="lazy"
          allowFullScreen
        />
      </div>
      <p className="mt-1 text-xs text-[#6b5c4d]">
        {art.video.title}（{art.video.publisher}）
      </p>

      <div className="mt-5 space-y-3 leading-relaxed text-[#2a241e]">
        {art.detailIntro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <StageSection title="見どころ">
        <ul className="space-y-3">
          {art.highlights.map((highlight) => (
            <li
              key={highlight.title}
              className="bg-[#f4efe6] border border-[#8c7863] rounded-xl p-4"
            >
              <p className="font-extrabold text-[#2a241e]">
                {highlight.title}
                {highlight.reading && (
                  <span className="text-sm text-[#6b5c4d]">（{highlight.reading}）</span>
                )}
              </p>
              <p className="mt-1 leading-relaxed">{highlight.description}</p>
            </li>
          ))}
        </ul>
      </StageSection>

      {art.notablePlays.length > 0 && (
        <StageSection title="人気の演目">
          <ul className="space-y-3">
            {art.notablePlays.map((play) => (
              <li key={play.title} className="bg-[#f4efe6] border border-[#8c7863] rounded-xl p-4">
                <p className="font-extrabold text-[#2a241e]">
                  『{play.title}』
                  {play.reading && (
                    <span className="text-sm text-[#6b5c4d]">（{play.reading}）</span>
                  )}
                </p>
                <p className="mt-1 leading-relaxed">{play.description}</p>
              </li>
            ))}
          </ul>
        </StageSection>
      )}

      <StageSection title="初心者の Q&A">
        <div className="space-y-2">
          {faqs.map((faq) => (
            <details key={faq.id} className="bg-[#f4efe6] border border-[#8c7863] rounded-xl p-3">
              <summary className="font-extrabold cursor-pointer">Q. {faq.question}</summary>
              <p className="mt-2 leading-relaxed">A. {faq.answer}</p>
            </details>
          ))}
        </div>
      </StageSection>

      <StageSection title="本物を見に行こう">
        {message && (
          <p className="mb-3 rounded-lg bg-white/70 border border-[#D5512A] p-3 text-sm font-bold text-[#a33a1c]">
            {message}
          </p>
        )}
        {today && events.length === 0 ? (
          <p className="leading-relaxed">
            いま載せている公演はありません。新しい公演が決まったら、ここに出ます。
          </p>
        ) : (
          <>
            <div className="pb-7">
              <EventMap events={events} userLocation={here} className="h-56 w-full" />
            </div>
            <button
              type="button"
              onClick={findNearby}
              className="w-full py-2.5 rounded-xl border-2 border-[#2a241e] font-bold text-[#2a241e] cursor-pointer hover:bg-white/40 transition"
            >
              📍 現在地から近い順にする
            </button>
            <ul className="mt-4 space-y-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  here={here}
                  wished={wishedIds.includes(event.id)}
                  onToggle={() => void toggleWish(event)}
                />
              ))}
            </ul>
          </>
        )}
        <Link
          href="/wishlist"
          className="mt-5 block w-full py-4 text-center rounded-xl bg-[#D5512A] text-white font-extrabold text-lg shadow-md hover:opacity-90 transition"
        >
          行きたいリストを見る（{wishedIds.length}件）
        </Link>
      </StageSection>

      <StageSection title="ほかの伝統芸能">
        <ul className="space-y-2">
          {artOrder
            .filter((id) => id !== artId)
            .map((id) => (
              <li key={id}>
                <Link href={`/arts/${id}`} className="hover:opacity-85 transition">
                  <ArrowLabel label={arts[id].name} />
                </Link>
              </li>
            ))}
        </ul>
      </StageSection>

      <div className="mt-9 flex flex-col gap-3">
        <Link
          href={
            artId === "kabuki"
              ? "/challenge/mie"
              : artId === "nogaku"
                ? "/challenge/nanori"
                : "/challenge/ningyo-joruri"
          }
          className="hover:opacity-85 transition"
        >
          <ArrowLabel
            label={
              artId === "kabuki"
                ? "歌舞伎（見得チャレンジ）を体験する"
                : artId === "nogaku"
                  ? "能楽（名乗りチャレンジ）を体験する"
                  : "人形浄瑠璃（ひとり三人遣い）を体験する"
            }
          />
        </Link>
        <Link href="/challenge" className="hover:opacity-85 transition">
          <ArrowLabel label="ミニ体験一覧へ" back />
        </Link>
      </div>
    </StagePage>
  );
}
