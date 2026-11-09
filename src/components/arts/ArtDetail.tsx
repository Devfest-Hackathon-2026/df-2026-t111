"use client";

// ③ 詳細：伝統芸能の紹介と、近くの公演（ミニ体験の結果画面・診断結果画面から来る）

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
import { googleMapsDirectionsUrl } from "@/lib/maps/links";
import { formatDay, formatPeriod } from "./format";
import { ArrowLabel, StagePage, StageSection } from "./StagePage";

const actionBtnClass =
  "py-2 px-3 rounded-lg text-sm font-bold shadow-xs transition flex items-center justify-center gap-1";

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
    <li className="bg-[#f4efe6] border border-[#8c7863] rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
      {/* 劇場・開催期間バッジ */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8c7863]/30 pb-2">
        <span className="inline-flex items-center gap-1 font-bold text-sm text-[#017824]">
          🏛️ {event.venueName}
        </span>
        <span className="text-xs bg-[#c9b897]/40 text-[#2a241e] px-2.5 py-1 rounded-full font-bold">
          {formatPeriod(event)}
        </span>
      </div>

      {/* 公演タイトル */}
      <div>
        <h3 className="text-xl font-extrabold text-[#2a241e] leading-snug">{event.title}</h3>
        {here && (
          <p className="mt-1 text-xs text-[#017824] font-bold">
            📍 現在地から約 {formatDistance(distanceKm(here, event.location))}
          </p>
        )}
      </div>

      {/* 公演詳細 */}
      <div className="bg-white/60 rounded-xl p-3 text-sm space-y-1 text-[#3b332a]">
        <p>
          <strong className="text-[#2a241e]">開演時間：</strong>
          {event.showTimes.join(" / ")}
        </p>
        {event.closedDates.length > 0 && (
          <p>
            <strong className="text-[#2a241e]">休演日：</strong>
            {event.closedDates.map(formatDay).join("、")}
          </p>
        )}
        <p>
          <strong className="text-[#2a241e]">演目：</strong>
          {event.programs.join("、")}
        </p>
        <p className="pt-1.5 leading-relaxed text-[#2a241e] border-t border-[#8c7863]/20">
          {event.description}
        </p>
      </div>

      {/* サブアクション（公式・行き方・チケット） */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
        <a
          className={`${actionBtnClass} bg-white/80 border border-[#8c7863] text-[#2a241e] hover:bg-white`}
          href={event.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          🌐 公式ページ
        </a>
        <a
          className={`${actionBtnClass} bg-[#DDB442]/80 border border-[#b89530] text-[#2a241e] hover:bg-[#DDB442]`}
          href={googleMapsDirectionsUrl(event.location, event.venueName)}
          target="_blank"
          rel="noopener noreferrer"
        >
          📍 行き方を見る
        </a>
        {event.ticketUrl && (
          <a
            className={`${actionBtnClass} col-span-2 sm:col-span-1 bg-[#017824] text-white hover:opacity-90`}
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            🎫 チケット購入
          </a>
        )}
      </div>

      {/* メインアクション：行きたいボタン */}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={wished}
        className={`w-full py-3.5 rounded-xl font-extrabold text-base md:text-lg shadow-sm transition cursor-pointer flex items-center justify-center gap-2 ${
          wished
            ? "bg-[#D5512A] text-white shadow-md ring-2 ring-[#a33a1c]"
            : "bg-[#DDB442] text-[#2a241e] hover:bg-[#e4b64e]"
        }`}
      >
        <span>{wished ? "♥" : "♡"}</span>
        <span>{wished ? "行きたいに登録済み" : "行きたいリストに追加"}</span>
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
  const [openHighlight, setOpenHighlight] = useState<number | null>(0);
  const [showMap, setShowMap] = useState<boolean>(true);

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

  // ミニ体験への直行リンク
  const challengeHref =
    artId === "kabuki"
      ? "/challenge/mie"
      : artId === "nogaku"
        ? "/challenge/nanori"
        : "/challenge/ningyo-joruri";

  const challengeTitle =
    artId === "kabuki"
      ? "歌舞伎「見得チャレンジ」"
      : artId === "nogaku"
        ? "能楽「名乗りチャレンジ」"
        : "人形浄瑠璃「ひとり三人遣い」";

  return (
    <StagePage title={art.name} band={art.catchphrase}>
      {/* 画面上部：適性診断・ミニ体験へ戻るクイックナビ */}
      <nav aria-label="ページ上部ナビゲーション" className="mb-4 flex items-center justify-between text-sm border-b border-[#8c7863]/30 pb-3">
        <Link
          href="/diagnosis"
          className="inline-flex items-center gap-1 font-bold text-[#6b5c4d] hover:text-[#2a241e] transition"
        >
          <span className="w-5 h-5 rounded-full bg-[#017824] text-white flex items-center justify-center text-[10px]">
            ◀
          </span>
          <span>適性診断へ戻る</span>
        </Link>
        <Link
          href="/challenge"
          className="inline-flex items-center gap-1 font-bold text-[#6b5c4d] hover:text-[#2a241e] transition"
        >
          <span>ミニ体験一覧</span>
          <span className="w-5 h-5 rounded-full bg-[#017824] text-white flex items-center justify-center text-[10px]">
            ▶
          </span>
        </Link>
      </nav>

      {/* 芸能の基本情報 */}
      <p className="text-sm text-[#6b5c4d] text-center">
        {art.reading}　／　{art.era}に生まれた　／　{art.mood}
      </p>

      {/* YouTube動画 */}
      <div className="mt-4 aspect-video w-full overflow-hidden rounded-xl shadow-md bg-[#c2b59b]">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${art.video.youtubeId}`}
          title={art.video.title}
          loading="lazy"
          allowFullScreen
        />
      </div>
      <p className="mt-1.5 text-xs text-[#6b5c4d] text-center">
        {art.video.title}（{art.video.publisher}）
      </p>

      {/* 芸能の紹介文 */}
      <div className="mt-5 space-y-3 leading-relaxed text-[#2a241e] bg-[#f4efe6]/60 p-4 rounded-xl border border-[#8c7863]/30">
        {art.detailIntro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {/* ========================================= */}
      {/* 見どころナビゲーション（押したら広がる形式） */}
      {/* ========================================= */}
      <StageSection title="見どころナビゲーション">
        <p className="text-xs text-[#6b5c4d] mb-3">
          気になる見どころをタップすると、くわしい解説が広がります。
        </p>
        <div className="space-y-3">
          {art.highlights.map((highlight, index) => {
            const isOpen = openHighlight === index;
            return (
              <div
                key={highlight.title}
                className={`border rounded-2xl transition overflow-hidden shadow-xs ${
                  isOpen
                    ? "bg-[#f4efe6] border-[#D5512A] ring-1 ring-[#D5512A]/30"
                    : "bg-[#f4efe6] border-[#8c7863] hover:bg-white/60"
                }`}
              >
                {/* タップヘッダー */}
                <button
                  type="button"
                  onClick={() => setOpenHighlight(isOpen ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 transition ${
                        isOpen
                          ? "bg-[#D5512A] text-white"
                          : "bg-[#8c7863]/20 text-[#2a241e]"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-base md:text-lg text-[#2a241e]">
                        {highlight.title}
                      </span>
                      {highlight.reading && (
                        <span className="ml-2 text-xs text-[#6b5c4d]">（{highlight.reading}）</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-transform ${
                      isOpen
                        ? "bg-[#D5512A] text-white rotate-180"
                        : "bg-[#8c7863]/20 text-[#6b5c4d]"
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {/* 展開される解説文 */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-[#8c7863]/20">
                    <p className="leading-relaxed text-sm md:text-base text-[#2a241e]">
                      {highlight.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </StageSection>

      {/* 人気の演目 */}
      {art.notablePlays.length > 0 && (
        <StageSection title="人気の演目">
          <ul className="space-y-3">
            {art.notablePlays.map((play) => (
              <li key={play.title} className="bg-[#f4efe6] border border-[#8c7863] rounded-2xl p-4 shadow-xs">
                <p className="font-extrabold text-base md:text-lg text-[#2a241e]">
                  『{play.title}』
                  {play.reading && (
                    <span className="text-xs text-[#6b5c4d] ml-1">（{play.reading}）</span>
                  )}
                </p>
                <p className="mt-1.5 leading-relaxed text-sm text-[#3b332a]">{play.description}</p>
              </li>
            ))}
          </ul>
        </StageSection>
      )}

      {/* 初心者の Q&A */}
      <StageSection title="初心者の Q&A">
        <div className="space-y-2">
          {faqs.map((faq) => (
            <details key={faq.id} className="bg-[#f4efe6] border border-[#8c7863] rounded-2xl p-4 group">
              <summary className="font-extrabold cursor-pointer list-none flex items-center justify-between text-[#2a241e]">
                <span>Q. {faq.question}</span>
                <span className="text-xs font-bold text-[#6b5c4d] group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-2.5 pt-2 leading-relaxed text-sm border-t border-[#8c7863]/20 text-[#3b332a]">
                A. {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </StageSection>

      {/* ========================================= */}
      {/* 本物を見に行こう（大幅刷新） */}
      {/* ========================================= */}
      <StageSection title="本物を見に行こう">
        {/* 初心者向けガイダンスステップ */}
        <div className="mb-4 bg-[#f4efe6] border border-[#8c7863] rounded-2xl p-4 shadow-xs">
          <h3 className="font-extrabold text-[#2a241e] text-base mb-2 flex items-center gap-2">
            <span>✨</span>
            <span>はじめてでも大丈夫！鑑賞の3ステップ</span>
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/70 rounded-xl p-2.5 border border-[#8c7863]/30">
              <span className="block font-extrabold text-[#017824] mb-1">STEP 1</span>
              <span>公演を選ぶ</span>
            </div>
            <div className="bg-white/70 rounded-xl p-2.5 border border-[#8c7863]/30">
              <span className="block font-extrabold text-[#DDB442] mb-1">STEP 2</span>
              <span>「行きたい」保存</span>
            </div>
            <div className="bg-white/70 rounded-xl p-2.5 border border-[#8c7863]/30">
              <span className="block font-extrabold text-[#D5512A] mb-1">STEP 3</span>
              <span>劇場へ！</span>
            </div>
          </div>
          <p className="mt-2.5 text-xs text-[#6b5c4d] leading-relaxed">
            字幕やイヤホンガイドの貸出がある劇場も多く、知識ゼロでも楽しめます。気になる公演は「♡ 行きたい」に登録して、カレンダーや地図で計画を立てましょう！
          </p>
        </div>

        {message && (
          <p className="mb-3 rounded-xl bg-white/80 border border-[#D5512A] p-3 text-sm font-bold text-[#a33a1c]">
            {message}
          </p>
        )}

        {today && events.length === 0 ? (
          <p className="leading-relaxed bg-[#f4efe6] p-4 rounded-xl border border-[#8c7863]">
            いま載せている公演はありません。新しい公演が決まったら、ここに出ます。
          </p>
        ) : (
          <div className="space-y-4">
            {/* 地図トグルと現在地ソート */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="py-2.5 px-4 rounded-xl bg-[#f4efe6] border border-[#8c7863] text-sm font-bold text-[#2a241e] hover:bg-white transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🗺️</span>
                <span>劇場の地図を{showMap ? "隠す" : "見る"}</span>
                <span className="text-xs">{showMap ? "▲" : "▼"}</span>
              </button>
              <button
                type="button"
                onClick={findNearby}
                className="py-2.5 px-4 rounded-xl border-2 border-[#2a241e] bg-white/40 text-sm font-bold text-[#2a241e] cursor-pointer hover:bg-white transition flex items-center justify-center gap-1.5"
              >
                <span>📍</span>
                <span>現在地から近い順</span>
              </button>
            </div>

            {/* 地図コンポーネント（開閉可能） */}
            {showMap && (
              <div className="rounded-2xl overflow-hidden border border-[#8c7863] shadow-xs">
                <EventMap events={events} userLocation={here} className="h-60 w-full" />
              </div>
            )}

            {/* 公演一覧 */}
            <div className="pt-2">
              <h4 className="font-extrabold text-lg text-[#2a241e] mb-3 flex items-center justify-between">
                <span>直近の公演一覧</span>
                <span className="text-xs bg-[#017824] text-white px-2.5 py-0.5 rounded-full">
                  {events.length}件
                </span>
              </h4>
              <ul className="space-y-4">
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
            </div>
          </div>
        )}

        {/* 行きたいリストへのリンク */}
        <Link
          href="/wishlist"
          className="mt-6 block w-full py-4 text-center rounded-2xl bg-[#D5512A] text-white font-extrabold text-lg shadow-md hover:opacity-90 transition"
        >
          ♥ 行きたいリストを見る（{wishedIds.length}件保存中）
        </Link>
      </StageSection>

      {/* ほかの伝統芸能 */}
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

      {/* ========================================= */}
      {/* ミニ体験・適性診断への戻るナビゲーション（下部） */}
      {/* ========================================= */}
      <div className="mt-10 pt-6 border-t-2 border-[#8c7863]/30 space-y-3">
        {/* この芸能のミニ体験へ */}
        <Link
          href={challengeHref}
          className="block w-full py-4 text-center rounded-2xl bg-[#017824] text-white font-extrabold text-lg shadow-md hover:opacity-90 transition"
        >
          🎭 {challengeTitle} を体験する →
        </Link>

        {/* ミニ体験一覧 ＆ 適性診断をやり直す（2分割ボタン） */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/challenge"
            className="py-3.5 px-3 text-center rounded-xl bg-[#f4efe6] border border-[#8c7863] text-[#2a241e] font-extrabold text-sm shadow-xs hover:bg-white transition flex items-center justify-center gap-1.5"
          >
            <span>◀</span>
            <span>ミニ体験一覧</span>
          </Link>
          <Link
            href="/diagnosis"
            className="py-3.5 px-3 text-center rounded-xl bg-[#f4efe6] border border-[#8c7863] text-[#2a241e] font-extrabold text-sm shadow-xs hover:bg-white transition flex items-center justify-center gap-1.5"
          >
            <span>🧭</span>
            <span>適性診断に戻る</span>
          </Link>
        </div>

        {/* トップへ戻る */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-block text-sm font-bold text-[#6b5c4d] hover:text-[#2a241e] underline py-1 transition"
          >
            🏠 トップページへ戻る
          </Link>
        </div>
      </div>
    </StagePage>
  );
}