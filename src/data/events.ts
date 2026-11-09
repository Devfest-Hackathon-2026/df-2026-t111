// 公演・体験会のデータ（③ 詳細 の「近くの公演・体験会」と ④ 行きたい で使う）
//
// ・載せるのは、公式ページで確認できた公演だけ。各公演の officialUrl が出典、checkedOn が確認した日。
// ・description には、公式ページに書いてあることだけを書く（Gemini に作らせない）。
// ・緯度・経度は OpenStreetMap（© OpenStreetMap contributors）の劇場の位置。
// ・体験会は、合うものが見つかっていないため、いまは載せていない。
// ・会期が終わった公演を外したいときは getUpcomingEventsForArt(artId, today) を使う。
//   ※ このプロジェクトの設定（cacheComponents）では、画面を描く途中で new Date() を呼ぶとエラーになる。
//     画面では use-today.ts の useTodayInJapan() で today を受け取る。例：
//       const today = useTodayInJapan();
//       const list = today ? getUpcomingEventsForArt(artId, today) : [];

import type { PerformingArt } from "@/types/api";

/** 緯度・経度 */
export interface LatLng {
  lat: number;
  lng: number;
}

/** 公演・体験会 1 件 */
export interface ArtEvent {
  /** 「行きたい」登録でも使う ID。一度決めたら変えない */
  id: string;
  /** どの伝統芸能か */
  artId: PerformingArt;
  /** performance：公演、workshop：体験会 */
  kind: "performance" | "workshop";
  /** 公演の正式名称 */
  title: string;
  /** 主な演目 */
  programs: string[];
  /** 初心者向けのひとこと（公式ページに書いてあることだけ） */
  description: string;
  venueName: string;
  address: string;
  /** 地図のピンの位置 */
  location: LatLng;
  /** 初日（日本時間、"YYYY-MM-DD"） */
  startDate: string;
  /** 最終日（同上。1 日だけの公演は startDate と同じ） */
  endDate: string;
  /** 開演時刻（日本時間、"HH:MM"）。部ごとに分かれていれば全部 */
  showTimes: string[];
  /** 休演日（"YYYY-MM-DD"） */
  closedDates: string[];
  /** 公演の公式ページ（出典） */
  officialUrl: string;
  /** チケット購入ページ */
  ticketUrl?: string;
  /** 公式ページで内容を確認した日（"YYYY-MM-DD"） */
  checkedOn: string;
}

export const events: ArtEvent[] = [
  {
    id: "kabukiza-2026-12",
    artId: "kabuki",
    kind: "performance",
    title: "十二月大歌舞伎",
    programs: ["春霞歌舞伎草紙", "刺青奇偶", "忠僕元助", "身替座禅", "与話情浮名横櫛", "櫓のお七"],
    description:
      "1日3回（三部制）の公演です。30歳以下の人は、当日に残席があれば、全等級が半額になります（U30当日半額チケット）。",
    venueName: "歌舞伎座",
    address: "東京都中央区銀座4-12-15",
    location: { lat: 35.6697, lng: 139.7681 },
    startDate: "2026-12-02",
    endDate: "2026-12-25",
    showTimes: ["11:00", "14:30", "18:00"],
    closedDates: ["2026-12-09", "2026-12-17"],
    officialUrl: "https://www.kabuki-bito.jp/theaters/kabukiza/play/987/",
    ticketUrl: "https://www1.ticket-web-shochiku.com/t/",
    checkedOn: "2026-11-06",
  },
  {
    id: "bunraku-tokyo-2026-12",
    artId: "ningyoJoruri",
    kind: "performance",
    title: "令和8年12月文楽公演",
    programs: ["加賀見山旧錦絵", "義経千本桜", "曾根崎心中"],
    description:
      "字幕アプリ（日本語・英語）と、解説が聞けるイヤホンガイドがあります。学生料金は 6,300円です。",
    venueName: "東京芸術劇場 プレイハウス",
    address: "東京都豊島区西池袋1-8-1",
    location: { lat: 35.7297, lng: 139.708 },
    startDate: "2026-12-06",
    endDate: "2026-12-19",
    showTimes: ["11:00", "14:30", "19:00"],
    closedDates: ["2026-12-10"],
    officialUrl: "https://www.ntj.jac.go.jp/schedule/kokuritsu_s/2026/0812/",
    ticketUrl: "https://ticket.ntj.jac.go.jp/",
    checkedOn: "2026-11-06",
  },
  {
    id: "bunraku-osaka-2026-11",
    artId: "ningyoJoruri",
    kind: "performance",
    title: "令和8年錦秋文楽公演",
    programs: ["心中宵庚申", "妹背山婦女庭訓", "本朝廿四孝"],
    description: "字幕の表示があります。日本語のイヤホンガイドもあります。学生料金は 4,600円です。",
    venueName: "国立文楽劇場",
    address: "大阪府大阪市中央区日本橋1-12-10",
    location: { lat: 34.6673, lng: 135.5087 },
    startDate: "2026-10-31",
    endDate: "2026-11-23",
    showTimes: ["11:00", "14:15", "17:45"],
    closedDates: ["2026-11-06", "2026-11-16"],
    officialUrl: "https://www.ntj.jac.go.jp/schedule/bunraku/2026/2026bunraku11/",
    ticketUrl: "https://ticket.ntj.jac.go.jp/",
    checkedOn: "2026-11-06",
  },
  {
    id: "nohgakudo-2026-11-20",
    artId: "nogaku",
    kind: "performance",
    title: "11月企画公演 琵琶と能楽 大楠公・伯養・楠露",
    programs: ["大楠公（筑前琵琶）", "伯養（狂言）", "楠露（能）"],
    description:
      "琵琶・狂言・能を続けて見られる公演です。字幕（日本語・英語）があります。学生料金もあります。",
    venueName: "国立能楽堂",
    address: "東京都渋谷区千駄ヶ谷4-18-1",
    location: { lat: 35.6803, lng: 139.7081 },
    startDate: "2026-11-20",
    endDate: "2026-11-20",
    showTimes: ["18:30"],
    closedDates: [],
    officialUrl: "https://www.ntj.jac.go.jp/schedule/nou/2026/85033/",
    ticketUrl: "https://ticket.ntj.jac.go.jp/",
    checkedOn: "2026-11-06",
  },
  {
    id: "nohgakudo-2026-11-21",
    artId: "nogaku",
    kind: "performance",
    title: "11月企画公演 琵琶と能楽 先帝御入水・碇潜",
    programs: ["先帝御入水（平曲）", "碇潜（能）"],
    description:
      "琵琶の語り（平曲）と能を続けて見られる公演です。字幕（日本語・英語）があります。学生料金もあります。",
    venueName: "国立能楽堂",
    address: "東京都渋谷区千駄ヶ谷4-18-1",
    location: { lat: 35.6803, lng: 139.7081 },
    startDate: "2026-11-21",
    endDate: "2026-11-21",
    showTimes: ["13:00"],
    closedDates: [],
    officialUrl: "https://www.ntj.jac.go.jp/schedule/nou/2026/85034/",
    ticketUrl: "https://ticket.ntj.jac.go.jp/",
    checkedOn: "2026-11-06",
  },
];

/** 日時を、日本時間の日付（"YYYY-MM-DD"）にする */
export function todayInJapan(now: Date): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 会期が終わっているか（最終日の翌日から true）。today は日本時間の今日（"YYYY-MM-DD"） */
export function isEventOver(event: ArtEvent, today: string): boolean {
  return event.endDate < today;
}

/** id から公演・体験会を取り出す（会期が終わったものも含む）。見つからなければ undefined */
export function getEvent(id: string): ArtEvent | undefined {
  return events.find((event) => event.id === id);
}

/** その伝統芸能の公演・体験会を、終わったものも含めて、初日の早い順に返す */
export function getEventsForArt(artId: PerformingArt): ArtEvent[] {
  return events
    .filter((event) => event.artId === artId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * その伝統芸能の、まだ終わっていない公演・体験会を、初日の早い順に返す。
 * today は日本時間の今日（"YYYY-MM-DD"）。画面では useTodayInJapan() で受け取る
 */
export function getUpcomingEventsForArt(artId: PerformingArt, today: string): ArtEvent[] {
  return getEventsForArt(artId).filter((event) => !isEventOver(event, today));
}

function addOneDay(ymd: string): string {
  const date = new Date(`${ymd}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** 今日以降で、いちばん近い公演日を返す（休演日は飛ばす）。もう公演日がなければ null */
export function getNextPerformanceDate(event: ArtEvent, today: string): string | null {
  let date = event.startDate > today ? event.startDate : today;
  while (date <= event.endDate) {
    if (!event.closedDates.includes(date)) return date;
    date = addOneDay(date);
  }
  return null;
}

/**
 * Google カレンダーの登録画面を開くリンクを返す（API キーはいらない）。
 * いちばん近い公演日の最初の回で作る。日時は、登録の画面で変えられる。
 * 終演時刻はデータにないので、開演の 3 時間後を仮の終わりにする。もう公演日がなければ null
 */
export function googleCalendarUrl(event: ArtEvent, today: string): string | null {
  const date = getNextPerformanceDate(event, today);
  const showTime = event.showTimes[0];
  if (!date || !showTime) return null;
  const [hour, minute] = showTime.split(":");
  const day = date.replaceAll("-", "");
  const endHour = String(Number(hour) + 3).padStart(2, "0");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${day}T${hour}${minute}00/${day}T${endHour}${minute}00`,
    ctz: "Asia/Tokyo",
    location: `${event.venueName} ${event.address}`,
    details: `開演：${event.showTimes.join(" / ")}\n公式ページ：${event.officialUrl}\n※ 日程や終演時刻は公式ページで確かめてください。`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
