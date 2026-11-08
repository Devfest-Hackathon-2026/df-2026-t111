"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./diagnosis.module.css";

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
    restChars: "",
    subtitle: "和風ダークファンタジー",
    description:
      "能は、幽霊や神仏、怨霊の想いを描く世界最古の現存舞台芸術。独特の能面（おもて）は角度によって喜怒哀楽を変え、研ぎ澄まされたミニマルな動きと空間は、まるでダークファンタジーの深淵を覗くような神秘の没入感をもたらします。",
    detailsLinkText: "能を詳しく見てみる →",
    detailTitle: "能（能楽）の魅力",
    detailText:
      "無駄を極限まで削ぎ落とした美学「幽玄」。ダークファンタジーや怪異譚が好きな人にはたまらない、異世界へと引き込まれるような独特の静寂とトランス体験が待っています。",
    challengeRoute: "/challenge/nanori",
    challengeName: "狂言名乗りチャレンジ",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
        caption: "一、角度で表情を変える神秘の能面",
      },
      {
        url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&auto=format&fit=crop&q=80",
        caption: "二、静寂を切り裂く幽玄の舞い姿",
      },
      {
        url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80",
        caption: "三、六百五十年受け継がれる能舞台",
      },
    ],
  },
  bunraku: {
    firstChar: "文",
    restChars: "楽",
    subtitle: "神業ミニチュア×人間ドラマ",
    description:
      "文楽（人形浄瑠璃）は、3人の人形遣いが1体の人形に命を吹き込み、物語を語る太夫と三味線が心を震わせる世界最高峰の人形劇。愛憎劇や人間の葛藤を驚くほどリアルかつ情熱的に描き、現代のドラマやアニメ以上に胸に迫るストーリーが特徴です。",
    detailsLinkText: "文楽を詳しく見てみる →",
    detailTitle: "文楽（人形浄瑠璃）の魅力",
    detailText:
      "3人が息を完全に合わせて操る人形は、指先の動きや息遣い、涙を拭う仕草まで生身の人間以上に人間らしく動きます。物語を語る太夫の迫真の声と、情念をかき鳴らす太棹三味線の響きが一体となって圧倒的なドラマを生み出します。",
    challengeRoute: "/challenge",
    challengeName: "ミニ体験選択画面",
    photos: [
      {
        url: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600&auto=format&fit=crop&q=80",
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
      "歌舞伎は、ダイナミックなアクション、息を呑む早変わり、豪華絢爛な舞台装置で観客を圧倒する総合エンターテインメント。バタバタッと鳴るツケの音とともにビシッと決める「見得（みえ）」は、まさに現代のアクション映画やアメコミヒーローの原点です。",
    detailsLinkText: "歌舞伎を詳しく見てみる →",
    detailTitle: "歌舞伎の魅力",
    detailText:
      "隈取（くまどり）メイクや大立ち回り、舞台の早変わりなど、日本のエンタメの原点がここに。歌舞伎座には手軽な一幕見席もあり、気軽に鑑賞できます。",
    challengeRoute: "/challenge/mie",
    challengeName: "見得チャレンジ",
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

  // 初期状態は固定順で持ち、マウント後にクライアント側でシャッフル（プリレンダリングエラー防止）
  const [questions, setQuestions] = useState<Question[]>(MASTER_QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<(ArtType | null)[]>(new Array(7).fill(null));
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");
  const [resultType, setResultType] = useState<ArtType>("bunraku");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // クライアント側でのみシャッフルを実行
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuestions(
      shuffleArray(MASTER_QUESTIONS).map((q) => ({
        ...q,
        options: shuffleArray(q.options),
      }))
    );
  }, []);

  // 選択肢タップ時の処理（約220ms後にサクサク自動遷移）
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

  // 集計して結果を表示
  const finishAndCalculate = (currentAnswers = answers) => {
    const tally: Record<ArtType, number> = { noh: 0, bunraku: 0, kabuki: 0 };
    currentAnswers.forEach((t) => {
      if (t) tally[t]++;
    });

    let maxType: ArtType = "bunraku";
    let maxScore = -1;
    const order: ArtType[] = ["bunraku", "kabuki", "noh"];
    for (const t of order) {
      if (tally[t] > maxScore) {
        maxScore = tally[t];
        maxType = t;
      }
    }

    setResultType(maxType);
    setPhase("result");
    setActivePhotoIdx(0);
  };

  // 前の質問へ
  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx((prev) => prev - 1);
  };

  // 次の質問へ（手動クリック）
  const handleNext = () => {
    if (answers[currentIdx] === null) return;
    if (currentIdx < 6) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishAndCalculate();
    }
  };

  // 診断を最初からやり直す
  const handleReset = () => {
    const shuffled = shuffleArray(MASTER_QUESTIONS).map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }));
    setQuestions(shuffled);
    setCurrentIdx(0);
    setAnswers(new Array(7).fill(null));
    setPhase("quiz");
  };

  // カルーセルのスクロール検知
  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const el = carouselRef.current;
    const itemWidth = el.scrollWidth / 3;
    const idx = Math.round(el.scrollLeft / itemWidth);
    setActivePhotoIdx(Math.min(2, Math.max(0, idx)));
  };

  // 体験フェーズへ進む
  const handleTriggerExperience = (targetType = resultType) => {
    const info = RESULTS_DATA[targetType];
    setToastMessage(`⛩️ ${info.challengeName}へ移動します`);

    setTimeout(() => {
      router.push(info.challengeRoute);
    }, 800);
  };

  const currentQuestion = questions[currentIdx];
  const resultInfo = RESULTS_DATA[resultType];

  return (
    <div className={styles.diagnosisRoot}>
      {/* 開発・デモ用コントロールバー */}
      <div className={styles.previewBar}>
        <div className={styles.previewLabel}>
          <span>画面切り替え:</span>
        </div>
        <div className={styles.previewButtons}>
          <button
            type="button"
            className={`${styles.previewBtn} ${phase === "quiz" ? styles.active : ""}`}
            onClick={() => setPhase("quiz")}
          >
            質問画面
          </button>
          <button
            type="button"
            className={`${styles.previewBtn} ${phase === "result" && resultType === "bunraku" ? styles.active : ""}`}
            onClick={() => {
              setResultType("bunraku");
              setPhase("result");
            }}
          >
            結果：文楽
          </button>
          <button
            type="button"
            className={`${styles.previewBtn} ${phase === "result" && resultType === "kabuki" ? styles.active : ""}`}
            onClick={() => {
              setResultType("kabuki");
              setPhase("result");
            }}
          >
            結果：歌舞伎
          </button>
          <button
            type="button"
            className={`${styles.previewBtn} ${phase === "result" && resultType === "noh" ? styles.active : ""}`}
            onClick={() => {
              setResultType("noh");
              setPhase("result");
            }}
          >
            結果：能
          </button>
          <button
            type="button"
            className={styles.previewBtn}
            onClick={handleReset}
            title="最初からやり直す"
          >
            ↺ やり直す
          </button>
        </div>
      </div>

      {/* 端末外枠コンテナ */}
      <div className={styles.deviceWrapper}>
        <div className={styles.deviceNotch} />

        <div className={styles.appScreen}>
          {/* ヘッダー（質問画面のみ表示） */}
          {phase === "quiz" && (
            <header className={styles.screenHeader}>
              <div className={styles.headerActions}>
                <button
                  type="button"
                  className={styles.skipBtn}
                  onClick={() => finishAndCalculate()}
                >
                  診断を終える
                </button>
                <button
                  type="button"
                  className={styles.headerCloseBtn}
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
            <div className={styles.progressBarContainer}>
              {Array.from({ length: 7 }).map((_, i) => {
                let dotClass = styles.unanswered;
                if (i === currentIdx) {
                  dotClass = styles.current;
                } else if (answers[i] !== null) {
                  dotClass = styles.answered;
                }
                return (
                  <span
                    key={i}
                    className={`${styles.progressDot} ${dotClass}`}
                  />
                );
              })}
            </div>
          )}

          {/* メイン画面本体 */}
          <main className={styles.screenBody}>
            {/* ======================= */}
            {/* 画面1: 質問・診断フェーズ */}
            {/* ======================= */}
            {phase === "quiz" && currentQuestion && (
              <section className={styles.quizView}>
                <div className={styles.questionSection}>
                  <div className={styles.questionBadge}>
                    第 {currentIdx + 1} 問
                  </div>
                  <h2 className={styles.questionText}>
                    {currentQuestion.text}
                  </h2>
                </div>

                <div className={styles.optionsList}>
                  {currentQuestion.options.map((opt, i) => {
                    const isSelected = answers[currentIdx] === opt.type;
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`${styles.optionButton} ${isSelected ? styles.selected : ""}`}
                        onClick={() => handleSelectOption(opt.type)}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>

                <footer className={styles.quizNavigation}>
                  <button
                    type="button"
                    className={`${styles.navArrowBtn} ${currentIdx === 0 ? styles.disabled : ""}`}
                    onClick={handlePrev}
                    disabled={currentIdx === 0}
                  >
                    <span className={styles.circleIcon}>◀</span>
                    <span>前の質問へ</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.navArrowBtn} ${answers[currentIdx] === null ? styles.disabled : ""}`}
                    onClick={handleNext}
                    disabled={answers[currentIdx] === null}
                  >
                    <span>{currentIdx === 6 ? "結果を見る" : "次の質問へ"}</span>
                    <span className={styles.circleIcon}>▶</span>
                  </button>
                </footer>
              </section>
            )}

            {/* ======================= */}
            {/* 画面2: 診断結果画面 */}
            {/* ======================= */}
            {phase === "result" && (
              <section className={styles.resultView}>
                <div className={styles.resultHeaderText}>あなたは…</div>

                {/* サブタイトル */}
                <div className={styles.resultSubtitleTop}>
                  {resultInfo.subtitle}
                </div>

                {/* バッジ表示（極太黒フチ・赤丸中心配置） */}
                <div className={styles.resultBadgeArea}>
                  <div className={styles.badgeContainer}>
                    <div className={styles.badgeFirstCharBox}>
                      <div className={styles.badgeRedCircle} />
                      <span
                        className={styles.badgeCharText}
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
                      <div className={styles.badgeRestCharsBox}>
                        <span
                          className={styles.badgeCharText}
                          style={{
                            fontSize:
                              resultInfo.restChars.length >= 2 ? "48px" : "56px",
                          }}
                        >
                          {resultInfo.restChars}
                        </span>
                      </div>
                    )}

                    <span className={styles.badgeTypeLabel}>タイプ</span>
                  </div>
                </div>

                {/* 3種類の芸能切り替えミニバッジ */}
                <div className={styles.badgePreviewRow}>
                  <button
                    type="button"
                    className={`${styles.miniBadgeBtn} ${resultType === "noh" ? styles.active : ""}`}
                    onClick={() => {
                      setResultType("noh");
                      setActivePhotoIdx(0);
                    }}
                  >
                    <div className={styles.miniBadgeCircle}>能</div>
                    <span className={styles.miniBadgeLabel}>能</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.miniBadgeBtn} ${resultType === "kabuki" ? styles.active : ""}`}
                    onClick={() => {
                      setResultType("kabuki");
                      setActivePhotoIdx(0);
                    }}
                  >
                    <div
                      className={styles.miniBadgeCircle}
                      style={{ fontSize: "14px" }}
                    >
                      歌舞伎
                    </div>
                    <span className={styles.miniBadgeLabel}>歌舞伎</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.miniBadgeBtn} ${resultType === "bunraku" ? styles.active : ""}`}
                    onClick={() => {
                      setResultType("bunraku");
                      setActivePhotoIdx(0);
                    }}
                  >
                    <div className={styles.miniBadgeCircle}>文楽</div>
                    <span className={styles.miniBadgeLabel}>文楽</span>
                  </button>
                </div>

                {/* 説明カード枠（写真＋細かい説明） */}
                <div className={styles.resultCard}>
                  {/* 写真カルーセル */}
                  <div className={styles.photoCarouselWrapper}>
                    <div
                      className={styles.photoCarouselTrack}
                      ref={carouselRef}
                      onScroll={handleCarouselScroll}
                    >
                      {resultInfo.photos.map((p, idx) => (
                        <div key={idx} className={styles.photoCard}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.url}
                            alt={p.caption}
                            className={styles.photoImg}
                            loading="lazy"
                          />
                          <div className={styles.photoCaption}>{p.caption}</div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.carouselIndicator}>
                      {resultInfo.photos.map((_, idx) => (
                        <span
                          key={idx}
                          className={`${styles.carouselDot} ${idx === activePhotoIdx ? styles.active : ""}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 細かい説明 */}
                  <p className={styles.resultCardText}>{resultInfo.description}</p>

                  <button
                    type="button"
                    className={styles.resultDetailsLink}
                    onClick={() => setIsModalOpen(true)}
                  >
                    {resultInfo.detailsLinkText}
                  </button>
                </div>

                {/* 体験するボタン */}
                <div className={styles.actionBtnArea}>
                  <button
                    type="button"
                    className={styles.experienceBtn}
                    onClick={() => handleTriggerExperience(resultType)}
                  >
                    体験する
                  </button>
                </div>
              </section>
            )}
          </main>

          {/* トースト通知 */}
          <div
            className={`${styles.toastNotification} ${toastMessage ? styles.show : ""}`}
          >
            {toastMessage}
          </div>

          {/* モーダル: 詳しく見る */}
          {isModalOpen && (
            <div
              className={styles.modalOverlay}
              onClick={() => setIsModalOpen(false)}
            >
              <div
                className={styles.modalSheet}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  ✕
                </button>
                <h3 className={styles.modalTitle}>{resultInfo.detailTitle}</h3>
                <div className={styles.modalContent}>
                  <p style={{ marginBottom: "12px", fontSize: "15px" }}>
                    {resultInfo.detailText}
                  </p>
                  <div className={styles.modalActionCard}>
                    <strong style={{ fontSize: "16px" }}>
                      ✨ はじめての鑑賞のポイント
                    </strong>
                    <p
                      style={{
                        marginTop: "6px",
                        fontSize: "14px",
                        color: "#4b443c",
                      }}
                    >
                      チケットはオンラインで手軽に購入可能。最近はイヤホンガイドの貸出や字幕表示もあり、予備知識がなくても物語に深く浸ることができます。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
