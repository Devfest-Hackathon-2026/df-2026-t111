// Google Maps JavaScript API の読み込み（ブラウザでだけ使う）
//
// ・キーは .env.local の NEXT_PUBLIC_GOOGLE_MAPS_API_KEY（リファラー制限をかけたキーを使う）
// ・地図のスタイル用 ID は NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID。なければ Google の DEMO_MAP_ID を使う
// ・ライブラリは追加せず、Google 公式の読み込み方（loading=async ＋ importLibrary）を使う
// ・使う機能の型だけを下に書いている（@types/google.maps は入れていない）

import type { LatLng } from "@/data/events";

// NEXT_PUBLIC_ の値はビルド時に埋め込まれるため、process.env.○○ と1つずつ書く
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
/** マーカー（AdvancedMarkerElement）を使うのに必要な地図 ID */
export const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

/** 地図を読み込めなかったときのエラー。message は画面にそのまま出せる */
export class MapsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MapsError";
  }
}

// ---- 使う機能だけの型 ----

export interface GoogleMap {
  fitBounds(bounds: GoogleLatLngBounds, padding?: number): void;
  setCenter(center: LatLng): void;
  setZoom(zoom: number): void;
}

export interface GoogleLatLngBounds {
  extend(point: LatLng): void;
}

export interface GoogleInfoWindow {
  setContent(content: Node | string): void;
  open(options: { map: GoogleMap; anchor: GoogleAdvancedMarker }): void;
  close(): void;
}

export interface GoogleAdvancedMarker {
  map: GoogleMap | null;
  addListener(eventName: "click", handler: () => void): unknown;
}

export interface GoogleMapsLibraries {
  Map: new (
    element: HTMLElement,
    options: {
      mapId: string;
      center: LatLng;
      zoom: number;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      gestureHandling?: "cooperative" | "greedy" | "none" | "auto";
      clickableIcons?: boolean;
    },
  ) => GoogleMap;
  InfoWindow: new (options?: { content?: Node | string }) => GoogleInfoWindow;
  LatLngBounds: new () => GoogleLatLngBounds;
  AdvancedMarkerElement: new (options: {
    map: GoogleMap;
    position: LatLng;
    title?: string;
    content?: HTMLElement;
    /** REQUIRED にすると、地図の文字やアイコンに隠されず必ず表示される */
    collisionBehavior?: "REQUIRED";
    zIndex?: number;
  }) => GoogleAdvancedMarker;
}

interface GoogleMapsNamespace {
  importLibrary(name: "maps" | "core" | "marker"): Promise<Record<string, unknown>>;
}

interface WindowWithGoogleMaps {
  google?: { maps?: GoogleMapsNamespace };
  gm_authFailure?: () => void;
  [callbackName: `__dfhack26Maps${string}`]: (() => void) | undefined;
}

// ---- 読み込み ----

/** キーが設定されているか（なければ地図を出さず、会場の一覧とリンクだけにする） */
export function hasMapsApiKey(): boolean {
  return Boolean(apiKey);
}

let scriptPromise: Promise<void> | null = null;
let authFailed = false;
const authFailureListeners = new Set<() => void>();

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const w = window as unknown as WindowWithGoogleMaps;
    // キーがまちがっている・リファラー制限で弾かれたときに Google が呼ぶ関数
    w.gm_authFailure = () => {
      authFailed = true;
      authFailureListeners.forEach((listener) => listener());
    };
    const callbackName = "__dfhack26MapsLoaded" as const;
    w[callbackName] = () => resolve();

    const params = new URLSearchParams({
      key: apiKey ?? "",
      v: "weekly",
      loading: "async",
      language: "ja",
      region: "JP",
      callback: callbackName,
    });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      // 次に呼ばれたときにやり直せるようにする
      scriptPromise = null;
      script.remove();
      reject(
        new MapsError("地図を読み込めませんでした。電波のよいところで、もう一度ためしてください。"),
      );
    };
    document.head.append(script);
  });
  return scriptPromise;
}

/** Google Maps を読み込み、使う機能をまとめて返す。何回呼んでも読み込みは1回だけ */
export async function loadGoogleMaps(): Promise<GoogleMapsLibraries> {
  if (typeof window === "undefined") {
    throw new MapsError("地図はブラウザでだけ表示できます。");
  }
  if (!apiKey) {
    throw new MapsError("地図のキーが設定されていません。");
  }
  await loadScript();
  const maps = (window as unknown as WindowWithGoogleMaps).google?.maps;
  if (!maps) {
    throw new MapsError("地図を読み込めませんでした。もう一度ためしてください。");
  }
  const [mapsLib, coreLib, markerLib] = await Promise.all([
    maps.importLibrary("maps"),
    maps.importLibrary("core"),
    maps.importLibrary("marker"),
  ]);
  return {
    Map: mapsLib.Map,
    InfoWindow: mapsLib.InfoWindow,
    LatLngBounds: coreLib.LatLngBounds,
    AdvancedMarkerElement: markerLib.AdvancedMarkerElement,
  } as GoogleMapsLibraries;
}

/**
 * キーが使えなかったとき（まちがい・制限）に呼ばれる関数を登録する。
 * すでに失敗していれば、すぐに呼ぶ。戻り値の関数で登録を解除する。
 */
export function onMapsAuthFailure(listener: () => void): () => void {
  if (authFailed) queueMicrotask(listener);
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}
