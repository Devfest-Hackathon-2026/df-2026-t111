"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./diagnosis.css";

export type ArtType = "noh" | "bunraku" | "kabuki";

interface Option {
  text: string;
  type: ArtType;
}

interface Question {
  id: number;
  text: string;
  options: Option[];
}

interface Photo {
  url: string;
  caption: string;
}

interface ResultInfo {
  firstChar: string;
  restChars: string;
  subtitle: string;
  description: string;
  detailsLinkText: string;
  detailTitle: string;
  detailText: string;
  photos: Photo[];
  challengeRoute: string;
  challengeName: string;
  artRoute: string;
}

const MASTER_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "映画やアニメで一番好きな雰囲気は？",
    options: [
      { text: "ファンタジー・ダーク（鬼・幽霊・異世界）", type: "noh" },
      { text: "サスペンス・ドラマ（愛憎劇・リアルな日常）", type: "bunraku" },
      { text: "ヒーロー・アクション（ド派手・スカッと爽快）", type: "kabuki" },
    ],
  },
  {
    id: 2,
    text: "観劇やライブで「一番見たいもの」は？",
    options: [
      { text: "神秘的な世界観・静かな空気感", type: "noh" },
      { text: "神業レベルの凄まじい「職人技」", type: "bunraku" },
      { text: "豪華な衣装・ド派手な演出・決めポーズ", type: "kabuki" },
    ],
  },
  {
    id: 3,
    text: "物語の主人公で一番惹かれるのは？",
    options: [
      { text: "悲しい過去を持つ幽霊や、美しい妖怪", type: "noh" },
      { text: "運命に振り回されるフツーの人間", type: "bunraku" },
      { text: "圧倒的に強いヒーローや、魅力的な悪役", type: "kabuki" },
    ],
  },
  {
    id: 4,
    text: "観終わったあと、どんな気持ちになりたい？",
    options: [
      { text: "静かな世界に没頭して、リフレッシュしたい", type: "noh" },
      { text: "「どうやってやってるの！？」と驚きたい", type: "bunraku" },
      { text: "テンションを上げて、スカッと盛り上がりたい", type: "kabuki" },
    ],
  },
  {
    id: 5,
    text: "パッと見でグッとくる visual は？",
    options: [
      { text: "無駄のないシンプルさ・仮面の神秘的な美", type: "noh" },
      { text: "精巧なミニチュア・フィギュア・精密な動き", type: "bunraku" },
      { text: "ギラギラしたメイク・豪華な着物・フライング", type: "kabuki" },
    ],
  },
  {
    id: 6,
    text: "旅先で行ってみたい場所は？",
    options: [
      { text: "静寂に包まれた古い神社・お寺", type: "noh" },
      { text: "伝統工芸を作る職人の工房", type: "bunraku" },
      { text: "華やかなテーマパーク・賑やかな祭り", type: "kabuki" },
    ],
  },
  {
    id: 7,
    text: "普段聴いていて心地いいサウンドは？",
    options: [
      { text: "ヒーリング曲・和楽器の静かで澄んだ音", type: "noh" },
      { text: "ラジオドラマや声優の一人何役もの語り", type: "bunraku" },
      { text: "ライブ会場の重低音・打楽器の力強い音", type: "kabuki" },
    ],
  },
];

const RESULTS_DATA: Record<ArtType, ResultInfo> = {
  noh: {
    firstChar: "能",
    restChars: "楽",
    subtitle: "幽玄の世界・和風ダークファンタジー",
    description:
      "能楽（能・狂言）は、幽霊や神仏、怨霊の想いを描く世界最古の現存舞台芸術。独特の能面は角度によって表情を変え、神秘的な没入感をもたらします。",
    detailsLinkText: "能楽を詳しく見てみる →",
    detailTitle: "能楽の魅力",
    detailText:
      "無駄を極限まで削ぎ落とした美学「幽玄」。ダークファンタジーや怪異譚が好きな人にはたまらない、異世界へと引き込まれるような独特の静寂とトランス体験が待っています。",
    challengeRoute: "/challenge/nanori",
    challengeName: "能楽（名乗り）チャレンジ",
    artRoute: "/arts/nogaku",
    photos: [
      {
        url: "/images/noh-stage-mask.png",
        caption: "一、神秘の能面",
      },
      {
        url: "/images/noh-dance-mai.png",
        caption: "二、静寂を切り裂く幽玄の舞い姿",
      },
      {
        url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80",
        caption: "三、六百五十年受け継がれる能舞台",
      },
    ],
  },
  bunraku: {
    firstChar: "人形",
    restChars: "浄瑠璃",
    subtitle: "神業ミニチュア×人間ドラマ",
    description:
      "人形浄瑠璃（文楽）は、3人の人形遣いが1体の人形に命を吹き込み、物語を語る太夫と三味線が心を震わせる世界最高峰の人形劇。愛憎劇や人間の葛藤を驚くほどリアルかつ情熱的に描きます。",
    detailsLinkText: "人形浄瑠璃を詳しく見てみる →",
    detailTitle: "人形浄瑠璃（文楽）の魅力",
    detailText:
      "3人が息を完全に合わせて操る人形は、指先の動きや息遣い、涙を拭う仕草まで生身の人間以上に人間らしく動きます。物語を語る太夫の迫真の声と、情念をかき鳴らす太棹三味線の響きが一体となって圧倒的なドラマを生み出します。",
    challengeRoute: "/challenge/ningyo-joruri",
    challengeName: "人形浄瑠璃（ひとり三人遣い）チャレンジ",
    artRoute: "/arts/ningyoJoruri",
    photos: [
      {
        url: "/images/bunraku-three-puppeteers.jpg",
        caption: "一、三人で命を吹き込む精密な人形",
      },
      {
        url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80",
        caption: "二、太夫の語りと三味線の圧倒的熱量",
      },
      {
        url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
        caption: "三、息を呑む情熱的な愛憎劇の舞台",
      },
    ],
  },
  kabuki: {
    firstChar: "歌",
    restChars: "舞伎",
    subtitle: "ド派手な和風ヒーローショー",
    description:
      "歌舞伎は、ダイナミックなアクション、息を呑む早変わり、豪華絢爛な舞台装置で観客を圧倒する総合エンターテインメント。バタバタッと鳴るツケの音とともにビシッと決める「見得」は、まさに現代のアクション映画やアメコミヒーローの原点です。",
    detailsLinkText: "歌舞伎を詳しく見てみる →",
    detailTitle: "歌舞伎の魅力",
    detailText:
      "隈取（くまどり）メイクや大立ち回り、舞台の早変わりなど、日本のエンタメの原点がここに。歌舞伎座には手軽な一幕見席もあり、気軽に鑑賞できます。",
    challengeRoute: "/challenge/mie",
    challengeName: "歌舞伎（見得）チャレンジ",
    artRoute: "/arts/kabuki",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1576085898323-218337e3e43c?w=600&auto=format&fit=crop&q=80",
        caption: "一、迫力満点の隈取メイクと見得",
      },
      {
        url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
        caption: "二、豪華絢爛な舞台装置と立ち回り",
      },
      {
        url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
        caption: "三、客席を沸かせるド派手な演出",
      },
    ],
  },
};

function shuffleArray<T>(array: readonly T[]): T[] {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = cloned[i]!;
    cloned[i] = cloned[j]!;
    cloned[j] = temp;
  }
  return cloned;
}

export function DiagnosisScreen() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>(MASTER_QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<(ArtType | null)[]>(new Array(7).fill(null));
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");
  const [resultType, setResultType] = useState<ArtType>("noh");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuestions(
      shuffleArray(MASTER_QUESTIONS).map((q) => ({
        ...q,
        options: shuffleArray(q.options),
      })),
    );
  }, []);

  const handleSelectOption = (selectedType: ArtType) => {
    const updated = [...answers];
    updated[currentIdx] = selectedType;
    setAnswers(updated);

    setTimeout(() => {
      if (currentIdx < 6) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        finishAndCalculate(updated);
      }
    }, 220);
  };

  const finishAndCalculate = (currentAnswers = answers) => {
    const tally: Record<ArtType, number> = { noh: 0, bunraku: 0, kabuki: 0 };
    currentAnswers.forEach((t) => {
      if (t) tally[t]++;
    });

    let maxType: ArtType = "noh";
    let maxScore = -1;
    const order: ArtType[] = ["noh", "kabuki", "bunraku"];
    for (const t of order) {
      if (tally[t] > maxScore) {
        maxScore = tally[t];
        maxType = t;
      }
    }

    setResultType(maxType);
    setPhase("result");
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx((prev) => prev - 1);
  };

  const handleNext = () => {
    if (answers[currentIdx] === null) return;
    if (currentIdx < 6) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishAndCalculate();
    }
  };

  const handleReset = () => {
    setQuestions(
      shuffleArray(MASTER_QUESTIONS).map((q) => ({
        ...q,
        options: shuffleArray(q.options),
      })),
    );
    setCurrentIdx(0);
    setAnswers(new Array(7).fill(null));
    setPhase("quiz");
  };

  const handleTriggerExperience = () => {
    const info = RESULTS_DATA[resultType];
    setToastMessage(`⛩️ ${info.challengeName}へ移動します`);

    setTimeout(() => {
      router.push(info.challengeRoute);
    }, 800);
  };

  const currentQuestion = questions[currentIdx];
  const resultInfo = RESULTS_DATA[resultType];

  return (
    <div className="diagnosis-root">
      <div className="screen-container">
        {/* ヘッダー（質問画面のみ表示） */}
        {phase === "quiz" && (
          <header className="screen-header">
            <div className="header-actions">
              <button type="button" className="skip-btn" onClick={() => finishAndCalculate()}>
                診断を終える
              </button>
              <button
                type="button"
                className="header-close-btn"
                onClick={handleReset}
                aria-label="リセット"
              >
                ✕
              </button>
            </div>
          </header>
        )}

        {/* 進捗インジケーター（質問画面のみ表示） */}
        {phase === "quiz" && (
          <div className="progress-bar-container">
            {Array.from({ length: 7 }).map((_, i) => {
              let dotClass = "unanswered";
              if (i === currentIdx) {
                dotClass = "current";
              } else if (answers[i] !== null) {
                dotClass = "answered";
              }
              return <span key={i} className={`progress-dot ${dotClass}`} />;
            })}
          </div>
        )}

        {/* メイン画面本体 */}
        <main className="screen-body">
          {/* ======================= */}
          {/* 画面1: 質問・診断フェーズ */}
          {/* ======================= */}
          {phase === "quiz" && currentQuestion && (
            <section className="quiz-view">
              <div className="question-section">
                <div className="question-badge">第 {currentIdx + 1} 問</div>
                <h2 className="question-text">{currentQuestion.text}</h2>
              </div>

              <div className="options-list">
                {currentQuestion.options.map((opt, i) => {
                  const isSelected = answers[currentIdx] === opt.type;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`option-button ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectOption(opt.type)}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>

              <footer className="quiz-navigation">
                <button
                  type="button"
                  className={`nav-arrow-btn ${currentIdx === 0 ? "disabled" : ""}`}
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                >
                  <span className="circle-icon">◀</span>
                  <span>前の質問へ</span>
                </button>

                <button
                  type="button"
                  className={`nav-arrow-btn ${answers[currentIdx] === null ? "disabled" : ""}`}
                  onClick={handleNext}
                  disabled={answers[currentIdx] === null}
                >
                  <span>{currentIdx === 6 ? "結果を見る" : "次の質問へ"}</span>
                  <span className="circle-icon">▶</span>
                </button>
              </footer>
            </section>
          )}

          {/* ======================= */}
          {/* 画面2: 診断結果フェーズ */}
          {/* ======================= */}
          {phase === "result" && (
            <section className="result-view">
              <div className="result-top-area">
                <div className="result-header-text">あなたは…</div>
                <div className="result-subtitle-top">{resultInfo.subtitle}</div>

                {/* バッジ表示 */}
                <div className="result-badge-area">
                  <div className="badge-container">
                    <div className="badge-first-char-box">
                      <div className="badge-red-circle" />
                      <span
                        className="badge-char-text"
                        style={{
                          fontSize:
                            resultInfo.restChars.length >= 2
                              ? "50px"
                              : resultInfo.restChars.length === 1
                                ? "56px"
                                : "60px",
                        }}
                      >
                        {resultInfo.firstChar}
                      </span>
                    </div>

                    {resultInfo.restChars && (
                      <div className="badge-rest-chars-box">
                        <span
                          className="badge-char-text"
                          style={{
                            fontSize: resultInfo.restChars.length >= 2 ? "48px" : "56px",
                          }}
                        >
                          {resultInfo.restChars}
                        </span>
                      </div>
                    )}

                    <span className="badge-type-label">タイプ</span>
                  </div>
                </div>
              </div>

              {/* 説明カード枠（写真カルーセル＋解説＋詳細リンク） */}
              <div className="result-card">
                <div className="photo-carousel-wrapper">
                  <div className="photo-carousel-track" ref={carouselRef}>
                    {resultInfo.photos.map((p, idx) => (
                      <div key={idx} className="photo-card">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={p.caption} className="photo-img" loading="lazy" />
                        <div className="photo-caption">{p.caption}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="result-card-text">{resultInfo.description}</p>

                <Link
                  href={resultInfo.artRoute}
                  className="result-details-link"
                >
                  {resultInfo.detailsLinkText}
                </Link>
              </div>

              {/* 画面下部：体験するボタン */}
              <div className="experience-btn-area">
                <button type="button" className="experience-btn" onClick={handleTriggerExperience}>
                  体験する
                </button>
              </div>
            </section>
          )}
        </main>

        {/* トースト通知 */}
        <div className={`toast-notification ${toastMessage ? "show" : ""}`}>{toastMessage}</div>
      </div>
    </div>
  );
}
