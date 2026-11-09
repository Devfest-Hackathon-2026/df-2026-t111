"use client";

// 小松菜さんデザインの「おすすめ公演」スタックカード・条件フィルターコンポーネント

import { useEffect, useMemo, useState } from "react";
import type { PerformingArt } from "@/types/api";
import { addWish, onWishesChange, removeWish, WishlistError } from "@/lib/firebase/wishlist";

interface PerformanceItem {
  id: string;
  name: string;
  desc: string;
  stars: { area: string; budget: string; date: string; who: string };
  ratings: { area: string; budget: string; date: string; who: string };
  link: string;
  venue: string;
  mapEmbed: string;
}

const performancesData: Record<string, PerformanceItem[]> = {
  ningyoJoruri: [
    {
      id: "bunraku-1",
      name: "国立文楽劇場 初心者鑑賞教室",
      desc: "人形浄瑠璃の聖地・大阪日本橋で開催される、若者・初心者のための超人気入門公演です。太夫の迫真の語り分けや三人の人形遣いの息の合った神ワザを、親切な生解説付きで間近に体験できます。近松門左衛門の名作『曾根崎心中』のクライマックスは、涙なしには見られない感動が待っています。字幕表示や音声ガイドも完備されており、予備知識ゼロの1人観劇でも安心して世界観に深く没入できます。",
      stars: { area: "★★★", budget: "★★★", date: "★★★", who: "★★★" },
      ratings: { area: "kansai", budget: "cheap", date: "month", who: "alone" },
      link: "https://www.ntj.jac.go.jp/bunraku.html",
      venue: "国立文楽劇場（大阪・日本橋）",
      mapEmbed:
        "https://maps.google.com/maps?q=%E5%9B%BD%E7%AB%8B%E6%96%87%E6%A5%BD%E5%8A%87%E5%A0%B4&z=15&output=embed",
    },
    {
      id: "bunraku-2",
      name: "近松記念館 伝統人形浄瑠璃公演",
      desc: "近松門左衛門ゆかりの寺社が佇む歴史の街で開催される、地元密着の親しみやすい文楽公演です。客席と舞台の距離が驚くほど近く、人形の繊細な指先の震えや表情の移ろいを肌で感じることができます。太棹三味線のズシリと胸に響く生演奏は、重低音好きの若者にも強く刺さる迫力です。終演後には人形遣いと直接触れ合える体験コーナーもあり、伝統の奥深さを存分に楽しめます。",
      stars: { area: "★★★", budget: "★★★", date: "★★☆", who: "★★★" },
      ratings: { area: "kansai", budget: "cheap", date: "month", who: "alone" },
      link: "https://www.city.amagasaki.hyogo.jp/manabu/art/1018501/1018506.html",
      venue: "尼崎市 近松記念館",
      mapEmbed:
        "https://maps.google.com/maps?q=%E8%BF%91%E6%9D%BE%E8%A8%98%E5%BF%B5%E9%A4%A8&z=15&output=embed",
    },
    {
      id: "bunraku-3",
      name: "東京公演 シアター1010特別公演",
      desc: "駅直結の最新劇場で楽しむ三人遣いの神業ステージ。愛憎劇や人間の葛藤を驚くほど情熱的かつリアルに描き出し、現代のサスペンスドラマ以上に心を揺さぶられます。初めての方でもあらすじが手にとるようにわかる無料プログラムの配布やイヤホンガイドが充実。平日夜や土日にも上演され、仕事帰りや休日に1人でふらりと贅沢な非日常を味わうのにぴったりです。",
      stars: { area: "★☆☆", budget: "★★☆", date: "★★★", who: "★★★" },
      ratings: { area: "kanto", budget: "standard", date: "weekday", who: "alone" },
      link: "https://www.t-1010.jp/",
      venue: "シアター1010（北千住駅直結）",
      mapEmbed:
        "https://maps.google.com/maps?q=%E3%82%B7%E3%82%A2%E3%82%BF%E3%83%BC1010&z=15&output=embed",
    },
  ],
  nogaku: [
    {
      id: "noh-1",
      name: "大槻能楽堂 能楽へ行こう特別公演",
      desc: "大阪・谷町四丁目に佇む歴史ある能舞台で開催される、初心者歓迎の特別鑑賞シリーズです。鬼や怨霊が登場するダイナミックな人気曲を取り上げ、開演前にはわかりやすい事前レクチャーを実施。研ぎ澄まされた静寂のなか、笛の澄んだ音と鼓の響きが会場全体を神秘的な空間へと変貌させます。敷居の高さを感じさせないアットホームな雰囲気で、1人でも気軽に本物の幽玄美に浸れます。",
      stars: { area: "★★★", budget: "★★★", date: "★★★", who: "★★★" },
      ratings: { area: "kansai", budget: "cheap", date: "month", who: "alone" },
      link: "http://www.noh-otsuki.com/",
      venue: "大槻能楽堂（大阪・谷町四丁目）",
      mapEmbed:
        "https://maps.google.com/maps?q=%E5%A4%A7%E6%A7%BB%E8%83%BD%E6%A5%BD%E5%A0%82&z=15&output=embed",
    },
    {
      id: "noh-2",
      name: "国立能楽堂 初心者普及公演",
      desc: "千駄ヶ谷の緑豊かな庭園に囲まれた国立能楽堂で、世界最古の舞台芸術の真髄に触れる入門プログラムです。全席に座席パーソナル字幕システムが設置されており、セリフや舞いの意味をリアルタイムで追うことができます。角度によって泣き顔にも笑い顔にも見える能面の不思議な美しさに誰もが息を呑むはず。二千円台〜のお手軽な価格設定で、休日のひとり鑑賞に絶大な支持を得ています。",
      stars: { area: "★☆☆", budget: "★★★", date: "★★★", who: "★★★" },
      ratings: { area: "kanto", budget: "cheap", date: "weekend", who: "friends" },
      link: "https://www.ntj.jac.go.jp/noh.html",
      venue: "国立能楽堂（千駄ヶ谷）",
      mapEmbed:
        "https://maps.google.com/maps?q=%E5%9B%BD%E7%AB%8B%E8%83%BD%E6%A5%BD%E5%A0%82&z=15&output=embed",
    },
    {
      id: "noh-3",
      name: "名古屋能楽堂 特別企画鑑賞会",
      desc: "日本最大規模を誇る壮大な檜舞台で、六百五十年の伝統を体感できる特別公演です。ダークファンタジーの深淵を覗くような怨霊の舞いや、妖艶な神仏の降臨シーンを豪華な装束とともに堪能できます。館内には能面や装束の展示室も併設されており、観劇前後にじっくりと伝統文化の世界に触れることが可能。名古屋城正門前の落ち着いたロケーションで、心を研ぎ澄ます静かな時間を過ごせます。",
      stars: { area: "★★☆", budget: "★★☆", date: "★★☆", who: "★★★" },
      ratings: { area: "tokai", budget: "standard", date: "month", who: "alone" },
      link: "https://www.bunka-hinkaku.or.jp/",
      venue: "名古屋能楽堂（名古屋城正門前）",
      mapEmbed:
        "https://maps.google.com/maps?q=%E5%90%8D%E5%8F%A4%E5%B1%8B%E8%83%BD%E6%A5%BD%E5%A0%82&z=15&output=embed",
    },
  ],
  kabuki: [
    {
      id: "kabuki-1",
      name: "京都南座 幕見席・お試し観劇",
      desc: "歌舞伎発祥の地・京都四条河原町の南座で、好きな幕だけを千円台〜で気軽に見られる夢のようなチケットです。歴史ある登録有形文化財の劇場に足を踏み入れれば、江戸の熱気がそのまま蘇ったようなワクワク感に包まれます。迫真の『見得』やド派手な大立ち回り、豪華絢爛な衣装の美しさを短時間で贅沢に満喫。祇園観光の合間に1人でサクッと観劇する若者にも絶大な人気を誇ります。",
      stars: { area: "★★★", budget: "★★★", date: "★★★", who: "★★★" },
      ratings: { area: "kansai", budget: "cheap", date: "month", who: "alone" },
      link: "https://www.kabuki-bito.jp/theaters/minamiza/",
      venue: "南座（京都・祇園四条）",
      mapEmbed: "https://maps.google.com/maps?q=%E5%8D%97%E5%BA%A7&z=15&output=embed",
    },
    {
      id: "kabuki-2",
      name: "歌舞伎座 一幕見席（幕見席）",
      desc: "東銀座駅直結の最高峰・歌舞伎座で、当日ふらりと好きな演目だけを千円〜二千円程度で鑑賞できる超定番プラン。名優たちの重厚な演技から、宙乗りや大仕掛けの早変わりまで、日本のエンターテインメントの原点を目の前で楽しめます。イヤホンガイドの解説を聞きながら見れば、初めての方でも笑いあり涙ありのストーリーに夢中になれます。銀座の洗練された街並みの中で気軽に楽しめる最高の体験です。",
      stars: { area: "★☆☆", budget: "★★★", date: "★★★", who: "★★★" },
      ratings: { area: "kanto", budget: "cheap", date: "month", who: "alone" },
      link: "https://www.kabuki-bito.jp/theaters/kabukiza/",
      venue: "歌舞伎座（東銀座駅直結）",
      mapEmbed:
        "https://maps.google.com/maps?q=%E6%AD%8C%E8%88%9E%E4%BC%8E%E5%BA%A7&z=15&output=embed",
    },
    {
      id: "kabuki-3",
      name: "浅草公会堂 新春浅草歌舞伎",
      desc: "若手花形俳優たちが熱い情熱をぶつけ合う、若者・初心者人気ナンバーワンの登竜門的公演です。客席と舞台の距離が近く、花道を疾走する迫力の演技にお客さんの一体感ある歓声が飛び交います。開演前には俳優自身による見どころ解説コーナーもあり、歌舞伎のルールが楽しく学べる工夫が満載。下町浅草のグルメや観光と合わせて、エネルギッシュな一日を思いきり楽しめます。",
      stars: { area: "★☆☆", budget: "★★☆", date: "★★★", who: "★★☆" },
      ratings: { area: "kanto", budget: "standard", date: "weekend", who: "friends" },
      link: "https://www.asakusa-kabuki.jp/",
      venue: "浅草公会堂（浅草駅徒歩5分）",
      mapEmbed:
        "https://maps.google.com/maps?q=%E6%B5%85%E8%8D%89%E5%85%AC%E4%BC%9A%E5%A0%82&z=15&output=embed",
    },
  ],
};

const rankNames = ["第一位", "第二位", "第三位", "第四位"];

export function RecommendedPerformances({ artId }: { artId: PerformingArt }) {
  // フィルター状態（初期値：関西・お手軽・一か月以内・1人で）
  const [area, setArea] = useState<string>("kansai");
  const [budget, setBudget] = useState<string>("cheap");
  const [date, setDate] = useState<string>("month");
  const [who, setWho] = useState<string>("alone");

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [flippingNext, setFlippingNext] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Firestore 行きたいリスト連動
  const [wishedIds, setWishedIds] = useState<string[]>([]);

  useEffect(() => {
    return onWishesChange((wishes) => setWishedIds(wishes.map((w) => w.eventId)));
  }, []);

  // スコア計算・フィルタリング
  const filteredList = useMemo(() => {
    const master = performancesData[artId] || [];

    const scored = master.map((item) => {
      let score = 0;
      const matchStars = { area: "★☆☆", budget: "★☆☆", date: "★☆☆", who: "★☆☆" };

      if (area === item.ratings.area) {
        score += 4;
        matchStars.area = "★★★";
      } else if (area === "all") {
        score += 2;
        matchStars.area = "★★☆";
      }

      if (budget === item.ratings.budget) {
        score += 4;
        matchStars.budget = "★★★";
      } else if (budget === "all") {
        score += 2;
        matchStars.budget = "★★☆";
      }

      if (date === item.ratings.date) {
        score += 4;
        matchStars.date = "★★★";
      } else if (date === "all") {
        score += 2;
        matchStars.date = "★★☆";
      }

      if (who === item.ratings.who) {
        score += 4;
        matchStars.who = "★★★";
      } else if (who === "all") {
        score += 2;
        matchStars.who = "★★☆";
      }

      return {
        ...item,
        score,
        dynamicStars: matchStars,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored;
  }, [artId, area, budget, date, who]);

  // フィルター変更時に先頭へ
  function handleFilterChange(setter: (val: string) => void, val: string) {
    setter(val);
    setCurrentIndex(0);
  }

  // 次のカードへめくる
  function handleNext() {
    if (filteredList.length <= 1) return;
    setFlippingNext(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredList.length);
      setFlippingNext(false);
    }, 280);
  }

  // 前のカードへ戻る
  function handlePrev() {
    if (currentIndex <= 0) return;
    setCurrentIndex((prev) => prev - 1);
  }

  // 行きたい保存・解除（Firestore 連動）
  async function handleToggleWish(perf: PerformanceItem) {
    const isWished = wishedIds.includes(perf.id);
    try {
      if (isWished) {
        await removeWish(perf.id);
        showToast(`「${perf.name}」を行きたいリストから外しました`);
      } else {
        await addWish(perf.id, artId);
        showToast(`「${perf.name}」を行きたいリストに追加しました！♥`);
      }
    } catch (e) {
      showToast(e instanceof WishlistError ? e.message : "保存に失敗しました");
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }

  return (
    <div className="recommend-performances-section my-6">
      <style>{`
        .rec-filter-card {
          width: 100%;
          background: #ece4d6;
          border: 1.5px solid #4a4035;
          border-radius: 8px;
          margin-bottom: 12px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5);
        }
        .rec-filter-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          text-align: center;
        }
        .rec-filter-header {
          background: #ded4c3;
          border-bottom: 1.2px solid #4a4035;
          font-size: 13px;
          font-weight: 700;
          color: #4a3e30;
          padding: 6px 0;
          letter-spacing: 0.05em;
        }
        .rec-filter-select-row {
          background: #f4ede2;
        }
        .rec-filter-col {
          border-right: 1.2px solid #4a4035;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .rec-filter-col:last-child {
          border-right: none;
        }
        .rec-filter-dropdown {
          width: 100%;
          padding: 8px 2px;
          background: transparent;
          border: none;
          font-size: 13.5px;
          font-weight: 700;
          color: #1f1a14;
          text-align: center;
          text-align-last: center;
          cursor: pointer;
          outline: none !important;
          appearance: none;
          -webkit-appearance: none;
        }
        .rec-filter-dropdown:hover {
          background: rgba(215, 168, 68, 0.15);
          color: #d14725;
        }
        .rec-filter-dropdown option {
          background: #f4ede2;
          color: #2b251f;
          font-weight: 700;
          padding: 6px;
        }

        /* スタックカードコンテナ */
        .rec-stack-container {
          position: relative;
          width: 100%;
          min-height: 520px;
          display: flex;
          align-items: stretch;
          justify-content: center;
          perspective: 1000px;
        }

        .rec-stack-card {
          position: absolute;
          top: 0;
          left: 14px;
          width: calc(100% - 28px);
          background: #ece5d8;
          border: 1.8px solid #3b342d;
          border-radius: 20px;
          padding: 16px 16px 14px 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 6px 18px rgba(0,0,0,0.12);
          transition: all 0.35s cubic-bezier(0.2, 0.8, 0.25, 1);
          user-select: none;
        }

        .rec-stack-card.card-0 {
          z-index: 10;
          transform: translateX(0) translateY(0) scale(1);
          opacity: 1;
          pointer-events: auto;
        }

        .rec-stack-card.card-1 {
          z-index: 8;
          transform: translateX(8px) translateY(5px) scale(0.98);
          opacity: 0.95;
          pointer-events: none;
        }

        .rec-stack-card.card-2 {
          z-index: 6;
          transform: translateX(16px) translateY(10px) scale(0.96);
          opacity: 0.85;
          pointer-events: none;
        }

        .rec-stack-card.card-hidden {
          z-index: 4;
          transform: translateX(24px) translateY(15px) scale(0.94);
          opacity: 0;
          pointer-events: none;
        }

        .rec-stack-card.card-flipping-next {
          transform: translateX(-120%) rotate(-8deg);
          opacity: 0;
          transition: transform 0.38s ease-out, opacity 0.32s ease-out;
        }

        /* 左右めくりナビ */
        .rec-nav-trigger {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 25;
          transition: opacity 0.2s ease;
        }
        .rec-nav-left { left: -6px; }
        .rec-nav-right { right: -6px; }

        .rec-nav-pill {
          background: rgba(43, 37, 31, 0.85);
          color: #ffd88a;
          width: 24px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          box-shadow: 0 3px 8px rgba(0,0,0,0.25);
          border: 1px solid rgba(255, 216, 138, 0.35);
          transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
        }
        .rec-nav-trigger:hover .rec-nav-pill {
          background: #d14725;
          color: #fff;
          transform: scale(1.08);
        }
        .rec-nav-trigger.disabled {
          opacity: 0;
          pointer-events: none;
        }

        /* トースト */
        .rec-toast {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: rgba(28, 24, 20, 0.95);
          color: #ffd88a;
          padding: 12px 22px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 6px 18px rgba(0,0,0,0.35);
          opacity: 0;
          pointer-events: none;
          transition: all 0.25s ease;
          z-index: 200;
          white-space: nowrap;
          border: 1px solid rgba(255, 216, 138, 0.3);
        }
        .rec-toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>

      {/* 2行条件選択テーブル（地域・予算・日程・誰と） */}
      <div className="rec-filter-card">
        <div className="rec-filter-row rec-filter-header">
          <div className="rec-filter-col">地域</div>
          <div className="rec-filter-col">予算</div>
          <div className="rec-filter-col">日程</div>
          <div className="rec-filter-col">誰と</div>
        </div>
        <div className="rec-filter-row rec-filter-select-row">
          <div className="rec-filter-col">
            <select
              className="rec-filter-dropdown"
              value={area}
              onChange={(e) => handleFilterChange(setArea, e.target.value)}
            >
              <option value="kansai">関西</option>
              <option value="kanto">関東</option>
              <option value="tokai">東海</option>
              <option value="all">全国</option>
            </select>
          </div>
          <div className="rec-filter-col">
            <select
              className="rec-filter-dropdown"
              value={budget}
              onChange={(e) => handleFilterChange(setBudget, e.target.value)}
            >
              <option value="cheap">お手軽</option>
              <option value="standard">標準</option>
              <option value="rich">しっかり</option>
              <option value="all">すべて</option>
            </select>
          </div>
          <div className="rec-filter-col">
            <select
              className="rec-filter-dropdown"
              value={date}
              onChange={(e) => handleFilterChange(setDate, e.target.value)}
            >
              <option value="month">一か月以内</option>
              <option value="next">来月以降</option>
              <option value="weekend">土日のみ</option>
              <option value="weekday">平日夜</option>
              <option value="all">すべて</option>
            </select>
          </div>
          <div className="rec-filter-col">
            <select
              className="rec-filter-dropdown"
              value={who}
              onChange={(e) => handleFilterChange(setWho, e.target.value)}
            >
              <option value="alone">1人で</option>
              <option value="friends">友達と</option>
              <option value="family">家族と</option>
              <option value="all">すべて</option>
            </select>
          </div>
        </div>
      </div>

      {/* スタックカードコンテナ */}
      <div className="rec-stack-container">
        {filteredList.map((perf, idx) => {
          const relPos = idx - currentIndex;
          let posClass = "card-hidden";
          if (relPos === 0) posClass = "card-0";
          else if (relPos === 1) posClass = "card-1";
          else if (relPos === 2) posClass = "card-2";

          const isFlipping = relPos === 0 && flippingNext;
          const isLiked = wishedIds.includes(perf.id);
          const rankText = rankNames[idx] || `第${idx + 1}位`;
          const stars = perf.dynamicStars || perf.stars;

          return (
            <div
              key={perf.id}
              className={`rec-stack-card ${posClass} ${isFlipping ? "card-flipping-next" : ""}`}
            >
              {/* カード上部情報 */}
              <div>
                {/* 1. 順位表示 */}
                <div className="flex items-center justify-between mb-1">
                  <span className="inline-block bg-[#2b251f] text-[#ffd88a] text-xs font-bold px-2.5 py-0.5 rounded tracking-wide">
                    {rankText}
                  </span>
                  <span className="text-xs font-bold text-[#7a6e60] bg-black/5 px-2 py-0.5 rounded-lg">
                    {idx + 1} / {filteredList.length}
                  </span>
                </div>

                {/* 2. 公演名（大きく、朱色） */}
                <h3 className="text-xl md:text-2xl font-extrabold text-[#d14725] leading-snug mb-1.5">
                  {perf.name}
                </h3>

                {/* 3. 条件がどれくらい合っているか表示する枠 */}
                <div className="bg-black/[0.04] border border-black/[0.08] rounded-lg px-3 py-1.5 mb-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs md:text-sm font-bold text-[#2b251f]">
                    <div className="flex justify-between">
                      <span>地域</span>
                      <span className="text-[#d99a18] tracking-widest">{stars.area}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>予算</span>
                      <span className="text-[#d99a18] tracking-widest">{stars.budget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>日程</span>
                      <span className="text-[#d99a18] tracking-widest">{stars.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>誰と</span>
                      <span className="text-[#d99a18] tracking-widest">{stars.who}</span>
                    </div>
                  </div>
                </div>

                {/* 4. 公演の説明文（4行） */}
                <p className="text-sm leading-relaxed text-[#332a21] text-justify mb-1.5 line-clamp-4">
                  {perf.desc}
                </p>

                {/* 5. ホームページへリンク */}
                <div>
                  <a
                    href={perf.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs md:text-sm font-bold text-[#2b251f] underline underline-offset-3 hover:text-[#196a39] transition"
                  >
                    → ホームページへ
                  </a>
                </div>
              </div>

              {/* 6. Google Maps 埋め込み（目的地ピン付き） */}
              <div className="w-full h-32 border-[1.5px] border-[#4a4237] rounded-xl overflow-hidden bg-[#ddd4c5] relative my-2">
                <iframe
                  className="w-full h-full border-none block"
                  src={perf.mapEmbed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={perf.venue}
                />
                <div className="absolute bottom-1.5 left-2 bg-white/95 px-2 py-0.5 rounded text-[11px] font-bold text-[#2b251f] border border-black/10 shadow-xs pointer-events-none">
                  📍 {perf.venue}
                </div>
              </div>

              {/* 7. アクションボタン（チケットを買う ＆ 行きたいハート） */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={perf.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#d7a844] hover:bg-[#e4b64e] text-[#221b10] border-[1.5px] border-[#bf9233] rounded-xl py-3 font-extrabold text-base md:text-lg text-center shadow-sm transition tracking-wider flex items-center justify-center"
                >
                  チケットを買う
                </a>
                <button
                  type="button"
                  onClick={() => handleToggleWish(perf)}
                  title="行きたいリストに保存"
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 transition-all cursor-pointer shadow-md ${
                    isLiked
                      ? "bg-[#d14725] text-white shadow-[#d14725]/40"
                      : "bg-[#196a39] hover:bg-[#1e7d44] text-white shadow-[#196a39]/30"
                  }`}
                >
                  {isLiked ? "♥" : "♡"}
                </button>
              </div>
            </div>
          );
        })}

        {/* 左ナビ：前のカードに戻る（二位以降のみ有効） */}
        <div
          className={`rec-nav-trigger rec-nav-left ${currentIndex <= 0 ? "disabled" : ""}`}
          onClick={handlePrev}
          title="前の公演に戻る"
        >
          <div className="rec-nav-pill">
            <span>❮</span>
          </div>
        </div>

        {/* 右ナビ：次のカードをめくる */}
        <div
          className={`rec-nav-trigger rec-nav-right ${filteredList.length <= 1 ? "disabled" : ""}`}
          onClick={handleNext}
          title="次の公演をめくる"
        >
          <div className="rec-nav-pill">
            <span>❯</span>
          </div>
        </div>
      </div>

      {/* トースト通知 */}
      <div className={`rec-toast ${toastMessage ? "show" : ""}`}>{toastMessage}</div>
    </div>
  );
}
