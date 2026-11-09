"use client";

// 公演・体験会の会場を地図に表示する部品（③ 詳細 の「近くの公演・体験会」で使う）
//
// 使い方：
//   <EventMap events={list} />                       … 会場にピンを立てる
//   <EventMap events={list} userLocation={here} />   … 現在地のピンも出す
//   <EventMap events={list} onSelectEvent={(id) => ...} />  … ピンを押したときに知らせる
//
// ・Google Maps のキーがない、またはキーが使えないときは、地図の代わりに会場の一覧と
//   「Google マップで開く」リンクを出す（画面は止まらない）
// ・高さは className で決める（初期値は h-64）。地図は高さがないと表示されない
// ・events の中身（id の並び）が変わったときだけ、地図を作り直す

import { useEffect, useRef, useState } from "react";
import type { PerformingArt } from "@/types/api";
import { arts } from "@/data/arts";
import type { ArtEvent, LatLng } from "@/data/events";
import { googleMapsUrl } from "./links";
import {
  type GoogleAdvancedMarker,
  type GoogleInfoWindow,
  type GoogleMap,
  hasMapsApiKey,
  loadGoogleMaps,
  MapsError,
  mapId,
  onMapsAuthFailure,
} from "./load-google-maps";

/** ピンの色（芸能ごと） */
const PIN_COLORS: Record<PerformingArt, string> = {
  kabuki: "#c2410c",
  nogaku: "#15803d",
  ningyoJoruri: "#1d4ed8",
};
const USER_PIN_COLOR = "#6b7280";

/** 公演がないときの地図の中心（東京駅あたり） */
const DEFAULT_CENTER: LatLng = { lat: 35.6812, lng: 139.7671 };

interface EventMapProps {
  events: ArtEvent[];
  /** 現在地（あればピンを出す） */
  userLocation?: LatLng | null;
  /** 地図の大きさなど（高さは必ず指定する） */
  className?: string;
  /** ピンを押したときに呼ばれる */
  onSelectEvent?: (eventId: string) => void;
}

/** 吹き出しの中身（文字は textContent で入れ、HTML として解釈させない） */
function infoContent(event: ArtEvent): HTMLElement {
  const root = document.createElement("div");
  root.style.maxWidth = "220px";
  root.style.fontSize = "13px";
  root.style.lineHeight = "1.5";
  const title = document.createElement("p");
  title.style.fontWeight = "bold";
  title.textContent = event.title;
  const venue = document.createElement("p");
  venue.textContent = `${arts[event.artId].name}・${event.venueName}`;
  const link = document.createElement("a");
  link.href = googleMapsUrl(event.location);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.style.color = "#1d4ed8";
  link.style.textDecoration = "underline";
  link.textContent = "Google マップで開く";
  root.append(title, venue, link);
  return root;
}

/** 地図を出せないときの代わり：会場の一覧と Google マップへのリンク */
function VenueList({
  events,
  reason,
  className,
}: {
  events: ArtEvent[];
  reason: string;
  className: string;
}) {
  // 同じ会場はまとめる
  const venues = [...new Map(events.map((event) => [event.venueName, event])).values()];
  return (
    <div className={`${className} overflow-auto rounded border bg-zinc-50 p-3 text-sm`}>
      <p className="text-zinc-600">{reason}会場は Google マップで開けます。</p>
      {venues.length === 0 ? (
        <p className="mt-2 text-zinc-500">表示する会場がありません。</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {venues.map((event) => (
            <li key={event.venueName} className="flex items-center justify-between gap-2">
              <span>{event.venueName}</span>
              <a
                href={googleMapsUrl(event.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-blue-700 underline"
              >
                Google マップで開く
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EventMap({
  events,
  userLocation = null,
  className = "h-64 w-full",
  onSelectEvent,
}: EventMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const infoRef = useRef<GoogleInfoWindow | null>(null);

  // 最新の events と onSelectEvent を、地図を作り直さずに使えるようにしておく
  const latest = useRef({ events, onSelectEvent });
  useEffect(() => {
    latest.current = { events, onSelectEvent };
  });

  const eventsKey = events.map((event) => event.id).join(",");
  const userLat = userLocation?.lat;
  const userLng = userLocation?.lng;

  useEffect(() => {
    if (!hasMapsApiKey()) return;
    let cancelled = false;
    const markers: GoogleAdvancedMarker[] = [];
    const stopListening = onMapsAuthFailure(() => {
      if (!cancelled) setFailure("地図を表示できませんでした（キーの設定を確認してください）。");
    });

    loadGoogleMaps()
      .then((lib) => {
        const container = containerRef.current;
        if (cancelled || !container) return;
        const current = latest.current.events;
        const here =
          userLat !== undefined && userLng !== undefined ? { lat: userLat, lng: userLng } : null;
        // 公演データの読み込み前は作らない（作り直すと表示がずれるため、地図は 1 回だけ作って使い回す）
        if (current.length === 0 && !here) return;
        const map =
          mapRef.current ??
          new lib.Map(container, {
            mapId,
            center: current[0]?.location ?? DEFAULT_CENTER,
            zoom: 14,
            disableDefaultUI: true,
            zoomControl: true,
            // スマホでページをスクロールしたときに、地図が動いてしまわないようにする
            gestureHandling: "cooperative",
            clickableIcons: false,
          });
        mapRef.current = map;
        infoRef.current?.close();
        const infoWindow = infoRef.current ?? new lib.InfoWindow();
        infoRef.current = infoWindow;
        const bounds = new lib.LatLngBounds();

        for (const event of current) {
          const pin = new lib.PinElement({
            background: PIN_COLORS[event.artId],
            borderColor: "#ffffff",
            glyphColor: "#ffffff",
          });
          const marker = new lib.AdvancedMarkerElement({
            map,
            position: event.location,
            title: `${event.title}（${event.venueName}）`,
            content: pin.element,
          });
          marker.addListener("click", () => {
            infoWindow.setContent(infoContent(event));
            infoWindow.open({ map, anchor: marker });
            latest.current.onSelectEvent?.(event.id);
          });
          markers.push(marker);
          bounds.extend(event.location);
        }

        if (here) {
          const pin = new lib.PinElement({
            background: USER_PIN_COLOR,
            borderColor: "#ffffff",
            glyphColor: "#ffffff",
            scale: 0.8,
          });
          markers.push(
            new lib.AdvancedMarkerElement({
              map,
              position: here,
              title: "現在地",
              content: pin.element,
            }),
          );
          bounds.extend(here);
        }

        // 1 か所だけならその場所を中心に、2 か所以上なら全部が入るように
        if (markers.length > 1) map.fitBounds(bounds, 48);
        else {
          map.setCenter(current[0]?.location ?? here ?? DEFAULT_CENTER);
          map.setZoom(15);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setFailure(
          error instanceof MapsError
            ? error.message
            : "地図を表示できませんでした。もう一度ためしてください。",
        );
      });

    return () => {
      cancelled = true;
      stopListening();
      markers.forEach((marker) => {
        marker.map = null;
      });
    };
  }, [eventsKey, userLat, userLng]);

  if (!hasMapsApiKey()) {
    return <VenueList events={events} reason="地図はまだ準備中です。" className={className} />;
  }
  if (failure) {
    return <VenueList events={events} reason={failure} className={className} />;
  }
  return (
    <div className={className}>
      <div
        ref={containerRef}
        role="region"
        aria-label="公演会場の地図"
        className="h-full w-full overflow-hidden rounded"
      />
      <ul className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-600">
        {(Object.keys(PIN_COLORS) as PerformingArt[]).map((artId) => (
          <li key={artId} className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: PIN_COLORS[artId] }}
            />
            {arts[artId].name}
          </li>
        ))}
        {userLocation && (
          <li className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: USER_PIN_COLOR }}
            />
            現在地
          </li>
        )}
      </ul>
    </div>
  );
}
