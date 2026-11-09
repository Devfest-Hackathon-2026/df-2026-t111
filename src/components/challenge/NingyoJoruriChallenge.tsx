"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Phase = "intro" | "stageIntro" | "playing" | "result";
type Stage = 1 | 2 | 3;

export interface NingyoJoruriChallengeProps {
  className?: string;
  children?: React.ReactNode;
}

export function NingyoJoruriChallenge({
  className = "",
  children,
}: NingyoJoruriChallengeProps = {}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [activeStep, setActiveStep] = useState(0);
  const [stage, setStage] = useState<Stage>(1);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [, setMessages] = useState<string[]>([]);
  const [scores, setScores] = useState<{ [key in Stage]?: number }>({});
  const [finalScore, setFinalScore] = useState<number>(0);
  const [masterComment, setMasterComment] = useState<string>("");

  // 各ボタンの波紋インスタンスを完全に独立管理
  const [activeCues, setActiveCues] = useState<{
    ashi: { id: number; startTime: number }[];
    leftHand: { id: number; startTime: number }[];
    head: { id: number; startTime: number }[];
  }>({ ashi: [], leftHand: [], head: [] });

  const cueIdCounter = useRef(0);

  // プレイ中のアクション記録・判定用
  const [actionTimestamps, setActionTimestamps] = useState<{
    ashi: number[];
    leftHand: number[];
    head: number[];
  }>({ ashi: [], leftHand: [], head: [] });

  // ボタンを押したときの押し込みエフェクト用状態
  const [pressedState, setPressedState] = useState({
    ashi: false,
    leftHand: false,
    head: false,
  });

  const [poseState, setPoseState] = useState({
    ashi: false,
    leftHand: false,
    head: false,
  });

  // AudioContextの保持用
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  // 楽器ごとの音色（足＝太鼓、左手＝三味線、頭＝笛）
  const playInstrumentSound = (type: "ashi" | "leftHand" | "head") => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === "ashi") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.7, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      } else if (type === "leftHand") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      } else {
        osc.type = "square";
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error(e);
    }
  };

  const startChallenge = () => {
    initAudio();
    setStage(1);
    setPhase("stageIntro");
    setActiveStep(1);
  };

  // 修業を中断してintroに戻る関数
  const handleAbort = () => {
    setPhase("intro");
    setActiveStep(0);
  };

  // ステージ移行時の案内表示（約2.0秒後に自動でゲーム本編へ移行）
  useEffect(() => {
    if (phase !== "stageIntro") return;

    const introTimer = setTimeout(() => {
      setPhase("playing");
      setTimeLeft(10);
      setActiveCues({ ashi: [], leftHand: [], head: [] });
      setActionTimestamps({ ashi: [], leftHand: [], head: [] });

      if (stage === 1) {
        setMessages(["【段階1：足遣い】緑色の枠が重なる瞬間に【足】（Aキー）を押せ！"]);
      } else if (stage === 2) {
        setMessages(["【段階2：左遣い（10回）】緑と青の枠の色に合わせて使い分けろ！"]);
      } else if (stage === 3) {
        setMessages(["【段階3：主遣い（15回）】3色の枠の色とリズムを正確に捉えろ！"]);
      }
    }, 2000);

    return () => clearTimeout(introTimer);
  }, [phase, stage]);

  const finishAllStages = (finalScoresMap: { [key in Stage]?: number }) => {
    const s1 = finalScoresMap[1] || 70;
    const s2 = finalScoresMap[2] || 70;
    const s3 = finalScoresMap[3] || 70;
    const total = Math.round((s1 + s2 + s3) / 3);
    setFinalScore(total);

    if (total >= 90) {
      setMasterComment("🎵「見事！ 枠と音のタイミングを完全に捉えた見事な主遣いですな！」");
    } else if (total >= 75) {
      setMasterComment(
        "🎵「なかなかの腕前。しかしもう少しテンポよく枠に合わせられると良いですな！」",
      );
    } else {
      setMasterComment("🎵「音と枠の息が少しずれていたようですぞ。出直してまいれ！」");
    }

    setPhase("result");
    setActiveStep(2);
  };

  const handleStageEnd = (currentStage: Stage) => {
    const times = actionTimestamps;
    let stageScore = 70;

    if (currentStage === 1) {
      const count = times.ashi.length;
      if (count >= 4 && count <= 10) stageScore = 95;
      else if (count > 0) stageScore = 80;
      else stageScore = 50;
    } else if (currentStage === 2) {
      const totalCount = times.ashi.length + times.leftHand.length;
      if (totalCount >= 8 && totalCount <= 12) stageScore = 96;
      else if (totalCount >= 5) stageScore = 82;
      else stageScore = 50;
    } else if (currentStage === 3) {
      const totalCount = times.head.length + times.leftHand.length + times.ashi.length;
      if (totalCount >= 13 && totalCount <= 17) {
        stageScore = 96;
      } else if (totalCount >= 9) {
        stageScore = 85;
      } else if (totalCount > 0) {
        stageScore = 70;
      } else {
        stageScore = 40;
      }
    }

    const updatedScores = { ...scores, [currentStage]: stageScore };
    setScores(updatedScores);

    if (currentStage < 3) {
      const nextStage = (currentStage + 1) as Stage;
      setStage(nextStage);
      setActiveStep(nextStage);
      setPhase("stageIntro");
    } else {
      finishAllStages(updatedScores);
    }
  };

  // 波紋を配列として管理し、重なってもアニメーションが途切れないようにする
  const triggerTargetCue = (part: "ashi" | "leftHand" | "head") => {
    const newId = cueIdCounter.current++;
    const now = Date.now();

    setActiveCues((prev) => ({
      ...prev,
      [part]: [...prev[part], { id: newId, startTime: now }],
    }));

    setTimeout(() => {
      playInstrumentSound(part);
    }, 800);

    setTimeout(() => {
      setActiveCues((prev) => ({
        ...prev,
        [part]: prev[part].filter((item) => item.id !== newId),
      }));
    }, 850);
  };

  // ステージごとのリズム生成
  useEffect(() => {
    if (phase !== "playing") return;

    // 間隔：段階1(約7回)＝1400ms、段階2(約10回)＝1000ms、段階3(約15回)＝660ms
    const beatInterval = stage === 1 ? 1400 : stage === 2 ? 1000 : 660;

    let stageQueue: ("ashi" | "leftHand" | "head")[] = [];

    const getNextTarget = (): "ashi" | "leftHand" | "head" => {
      if (stage === 1) {
        return "ashi";
      } else if (stage === 2) {
        if (stageQueue.length === 0) {
          stageQueue = [
            "ashi",
            "ashi",
            "leftHand",
            "leftHand",
            "ashi",
            "leftHand",
            "ashi",
            "leftHand",
            "ashi",
            "leftHand",
          ];
          stageQueue.sort(() => Math.random() - 0.5);
        }
        return stageQueue.pop()!;
      } else {
        if (stageQueue.length === 0) {
          stageQueue = [
            "ashi",
            "ashi",
            "leftHand",
            "leftHand",
            "head",
            "head",
            "ashi",
            "leftHand",
            "head",
            "ashi",
            "leftHand",
            "head",
            "ashi",
            "leftHand",
            "head",
          ];
          stageQueue.sort(() => Math.random() - 0.5);
        }
        return stageQueue.pop()!;
      }
    };

    const beatTimer = setInterval(() => {
      const target = getNextTarget();
      triggerTargetCue(target);
    }, beatInterval);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          clearInterval(beatTimer);
          handleStageEnd(stage);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(beatTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stage]);

  const handleAction = (part: "ashi" | "leftHand" | "head") => {
    if (phase !== "playing") return;

    const now = Date.now();
    setActionTimestamps((prev) => ({
      ...prev,
      [part]: [...prev[part], now],
    }));

    setPressedState((prev) => ({ ...prev, [part]: true }));
    setPoseState((prev) => ({ ...prev, [part]: true }));

    setTimeout(() => {
      setPressedState((prev) => ({ ...prev, [part]: false }));
      setPoseState((prev) => ({ ...prev, [part]: false }));
    }, 150);
  };

  useEffect(() => {
    if (phase !== "playing") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A") handleAction("ashi");
      if (e.key === "s" || e.key === "S") {
        if (stage >= 2) handleAction("leftHand");
      }
      if (e.key === "d" || e.key === "D") {
        if (stage >= 3) handleAction("head");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stage]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    if (index === 0) {
      document.querySelector("#example")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (index === 1) {
      startChallenge();
    }
  };

  return (
    <main className={`min-h-dvh bg-[#d9cfb6] text-black ${className}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap');

        *, :root, body, main, button, input, select, textarea, p, h1, h2, h3, h4, span, div, a, li {
          font-family: "Yuji Syuku", serif !important;
        }

        @keyframes shrinkBox {
          0% {
            transform: scale(1.8);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-shrink {
          animation: 0.8s linear shrinkBox forwards;
        }

        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.95); }
          20% { opacity: 1; transform: scale(1); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); }
        }

        .animate-stage-intro {
          animation: 2.0s ease-in-out forwards fadeInOut;
        }
      `}</style>

      <header
        className="w-full py-5 text-center shadow-md relative"
        style={{
          background:
            "repeating-linear-gradient(90deg, #017824 0px, #017824 28px, #D5512A 28px, #D5512A 56px, #1a1a1a 56px, #1a1a1a 84px)",
        }}
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-widest inline-block px-4 py-1">
          ひとり三人遣い
        </h1>
      </header>

      <div className="w-full bg-[#DDB442] py-2.5 text-center shadow-xs">
        <p className="text-base md:text-lg font-light text-black tracking-wider">
          一人で三人遣いに挑戦してみよう
        </p>
      </div>

      <div className="w-full max-w-lg mx-auto px-6 md:px-8 pt-5 pb-12">
        {phase === "intro" && (
          <div className="flex flex-col gap-7">
            <div className="flex items-center">
              <Link
                href="/challenge"
                className="inline-flex items-center gap-2 text-[17px] md:text-lg font-light text-black hover:opacity-80 transition"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-7 h-7 text-[#017824] shrink-0"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="11" fill="currentColor" />
                  <polygon points="14,6.5 7,12 14,17.5" fill="white" />
                </svg>
                選択画面へ
              </Link>
            </div>

            {children}

            {/* 人形浄瑠璃とは（詳細な説明） */}
            <section className="flex flex-col gap-3 p-1">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#D5512A] tracking-wide">
                三人遣いとは
              </h2>
              <p className="text-base md:text-lg leading-relaxed text-[#2a241e] font-light">
                1体の人形を3人（主遣い・左遣い・足遣い）で息を合わせて動かす、人形浄瑠璃独自の技法です。
                「足十年、左十年」と言われるほど、それぞれの役割を極めるには途方もない年月と修練が必要とされる、非常に奥深い世界です。
              </p>
            </section>

            <section className="my-2">
              <div className="bg-[#DDB442] py-2.5 text-center mb-5 shadow-xs">
                <h3 className="text-xl md:text-2xl font-bold text-black tracking-widest">
                  修業の流れ
                </h3>
              </div>

              {/* もとの緑色の矢印型ボタンデザイン */}
              <div className="flex items-start justify-between">
                <button
                  type="button"
                  onClick={() => handleStepClick(0)}
                  className={`flex-1 flex flex-col items-center gap-1.5 transition ${activeStep === 0 ? "opacity-100 scale-105" : "opacity-85"}`}
                >
                  <div
                    className="w-full py-2.5 bg-[#017824] text-white text-xs md:text-sm font-bold leading-tight relative shadow-xs flex items-center justify-center pl-3"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)",
                    }}
                  >
                    足遣い（初級）
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleStepClick(1)}
                  className={`flex-1 flex flex-col items-center gap-1.5 transition ${activeStep === 1 ? "opacity-100 scale-105" : "opacity-85"}`}
                >
                  <div
                    className="w-full py-2.5 bg-[#017824] text-white text-xs md:text-sm font-bold leading-tight relative shadow-xs flex items-center justify-center pl-3 pr-1"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)",
                    }}
                  >
                    左遣い（中級）
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleStepClick(2)}
                  className={`flex-1 flex flex-col items-center gap-1.5 transition ${activeStep === 2 ? "opacity-100 scale-105" : "opacity-85"}`}
                >
                  <div
                    className="w-full py-2.5 bg-[#017824] text-white text-xs md:text-sm font-bold leading-tight relative shadow-xs flex items-center justify-center pl-3"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%)" }}
                  >
                    主遣い（上級）
                  </div>
                </button>
              </div>
            </section>

            <section id="example">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#D5512A] mb-4 tracking-wide">
                修業の心得
              </h2>

              <div className="flex flex-col gap-4 p-1">
                <p className="text-base md:text-lg text-[#2a241e] font-light leading-relaxed">
                  足遣いと左遣いの修業を経て、ようやく主遣いへと進める道のりを体験してみましょう。
                </p>

                <div className="flex flex-col space-y-3 text-base md:text-lg text-[#2a241e] font-light tracking-wide">
                  <div className="pb-2 border-b border-[#2a241e]/20 flex items-start gap-2">
                    <span className="font-bold text-[#D5512A] shrink-0">1.</span>
                    <div className="flex-1 grid grid-cols-[auto_1fr] gap-x-2">
                      <span className="font-bold text-[#2a241e]">足遣い（初級）：</span>
                      <span>【足】のみをリズムに合わせて動かす</span>
                    </div>
                  </div>
                  <div className="pb-2 border-b border-[#2a241e]/20 flex items-start gap-2">
                    <span className="font-bold text-[#D5512A] shrink-0">2.</span>
                    <div className="flex-1 grid grid-cols-[auto_1fr] gap-x-2">
                      <span className="font-bold text-[#2a241e]">左遣い（中級）：</span>
                      <span>【足】【左手】を動かす</span>
                    </div>
                  </div>
                  <div className="pb-2 border-b border-[#2a241e]/20 flex items-start gap-2">
                    <span className="font-bold text-[#D5512A] shrink-0">3.</span>
                    <div className="flex-1 grid grid-cols-[auto_1fr] gap-x-2">
                      <span className="font-bold text-[#2a241e]">主遣い（上級）：</span>
                      <span>【足】【左手】【頭】すべての部位を動かす</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="pt-3 pb-2 flex flex-col items-center">
              <button
                type="button"
                onClick={startChallenge}
                className="w-full py-4 px-6 bg-[#D5512A] hover:bg-[#be421f] active:scale-95 text-white font-extrabold text-lg rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>修行を開始する</span>
              </button>
            </div>
          </div>
        )}

        {/* シンプルな段階案内表示画面 */}
        {phase === "stageIntro" && (
          <div className="w-full aspect-[4/3] bg-[#c2b59b] border-2 border-[#8c7863] rounded-2xl overflow-hidden shadow-xl flex flex-col items-center justify-center relative p-6 text-center animate-stage-intro my-10">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="text-3xl md:text-4xl font-extrabold text-[#D5512A] tracking-wider">
                {stage === 1 && "【初級】"}
                {stage === 2 && "【中級】"}
                {stage === 3 && "【上級】"}
              </div>
              <div className="text-3xl md:text-4xl font-extrabold text-[#D5512A] tracking-wider">
                {stage === 1 && "足遣い"}
                {stage === 2 && "左遣い"}
                {stage === 3 && "主遣い"}
              </div>
            </div>
          </div>
        )}

        {phase === "playing" && (
          <div className="flex flex-col items-center pt-2 space-y-6">
            {/* シンプルなステージ切り替えタブ風ヘッダー */}
            <div className="w-full bg-[#DDB442] p-2 rounded-xl shadow-xs grid grid-cols-3 gap-2 text-center font-bold text-sm">
              <div
                className={`py-1.5 rounded-lg ${stage === 1 ? "bg-[#017824] text-white" : "text-[#2a241e]"}`}
              >
                足遣い
              </div>
              <div
                className={`py-1.5 rounded-lg ${stage === 2 ? "bg-[#017824] text-white" : "text-[#2a241e]"}`}
              >
                左遣い
              </div>
              <div
                className={`py-1.5 rounded-lg ${stage === 3 ? "bg-[#017824] text-white" : "text-[#2a241e]"}`}
              >
                主遣い
              </div>
            </div>

            <div className="w-full aspect-[4/3] bg-white border-2 border-[#8c7863] rounded-2xl overflow-hidden shadow-xl flex flex-col items-center justify-center relative p-4">
              <div className="text-sm font-bold absolute top-4 left-5 text-[#2a241e]">
                残り <span className="text-[#D5512A] text-lg">{timeLeft}</span> 秒
              </div>

              {/* 人形プレビュー（両手を長く修正） */}
              <svg
                width="140"
                height="180"
                viewBox="0 0 140 200"
                className="transition-all duration-150 my-2 relative z-10"
              >
                <circle
                  cx="70"
                  cy="30"
                  r="18"
                  fill="#2a241e"
                  className={`transition-transform origin-bottom ${poseState.head ? "-translate-y-2 scale-105" : ""}`}
                />
                <rect x="55" y="50" width="30" height="70" rx="5" fill="#2a241e" opacity="0.9" />
                {/* 長くなった左手 */}
                <rect
                  x={poseState.leftHand ? "10" : "20"}
                  y="55"
                  width="35"
                  height="8"
                  rx="3"
                  fill="#2a241e"
                  className="origin-right transition-transform"
                />
                {/* 長くなった右手 */}
                <rect x="85" y="55" width="35" height="8" rx="3" fill="#2a241e" />
                <rect
                  x={poseState.ashi ? "58" : "63"}
                  y="120"
                  width="10"
                  height="60"
                  rx="3"
                  fill="#2a241e"
                  className={`origin-top transition-transform ${poseState.ashi ? "rotate-12" : ""}`}
                />
              </svg>
            </div>

            {/* 操作ボタン配置 */}
            <div className="grid grid-cols-3 gap-3 w-full">
              {/* 足ボタン（Aキー・緑） */}
              <div className="relative">
                {activeCues.ashi.map((cue) => (
                  <div
                    key={cue.id}
                    className="absolute inset-0 rounded-xl border-4 border-[#017824] bg-[#017824]/10 animate-shrink pointer-events-none z-20"
                  />
                ))}
                <button
                  onClick={() => handleAction("ashi")}
                  className={`w-full h-24 rounded-xl border-2 flex flex-col items-center justify-center font-bold shadow-sm transition-transform relative z-10 bg-[#DDB442] border-[#8c7863] text-[#2a241e] hover:bg-[#cca435] ${
                    pressedState.ashi ? "scale-90 bg-[#c49b32] shadow-inner" : "active:scale-95"
                  }`}
                >
                  <span className="text-lg font-black text-[#017824]">足</span>
                  <span className="text-xs font-bold text-[#4a3e32] mt-1">[ A キー ]</span>
                </button>
              </div>

              {/* 左手ボタン（Sキー・青） */}
              <div className="relative">
                {activeCues.leftHand.map((cue) => (
                  <div
                    key={cue.id}
                    className="absolute inset-0 rounded-xl border-4 border-[#2563eb] bg-[#2563eb]/10 animate-shrink pointer-events-none z-20"
                  />
                ))}
                <button
                  onClick={() => handleAction("leftHand")}
                  disabled={stage < 2}
                  className={`w-full h-24 rounded-xl border-2 flex flex-col items-center justify-center font-bold shadow-sm transition-transform relative z-10 ${
                    stage < 2
                      ? "opacity-40 bg-[#c2b59b]/40 border-[#8c7863]/50 text-neutral-500 cursor-not-allowed"
                      : pressedState.leftHand
                        ? "scale-90 bg-[#c49b32] shadow-inner text-[#2a241e]"
                        : "active:scale-95 bg-[#DDB442] border-[#8c7863] text-[#2a241e] hover:bg-[#cca435]"
                  }`}
                >
                  <span
                    className={`text-lg font-black ${stage >= 2 ? "text-[#2563eb]" : "text-neutral-500"}`}
                  >
                    左手
                  </span>
                  <span className="text-xs font-bold text-[#4a3e32] mt-1">[ S キー ]</span>
                </button>
              </div>

              {/* 頭ボタン（Dキー・朱色） */}
              <div className="relative">
                {activeCues.head.map((cue) => (
                  <div
                    key={cue.id}
                    className="absolute inset-0 rounded-xl border-4 border-[#D5512A] bg-[#D5512A]/10 animate-shrink pointer-events-none z-20"
                  />
                ))}
                <button
                  onClick={() => handleAction("head")}
                  disabled={stage < 3}
                  className={`w-full h-24 rounded-xl border-2 flex flex-col items-center justify-center font-bold shadow-sm transition-transform relative z-10 ${
                    stage < 3
                      ? "opacity-40 bg-[#c2b59b]/40 border-[#8c7863]/50 text-neutral-500 cursor-not-allowed"
                      : pressedState.head
                        ? "scale-90 bg-[#c49b32] shadow-inner text-[#2a241e]"
                        : "active:scale-95 bg-[#DDB442] border-[#8c7863] text-[#2a241e] hover:bg-[#cca435]"
                  }`}
                >
                  <span
                    className={`text-lg font-black ${stage >= 3 ? "text-[#D5512A]" : "text-neutral-500"}`}
                  >
                    頭
                  </span>
                  <span className="text-xs font-bold text-[#4a3e32] mt-1">[ D キー ]</span>
                </button>
              </div>
            </div>

            {/* ボタン下の操作説明と、中央配置された修業中止ボタン */}
            <div className="w-full flex flex-col items-center pt-2 space-y-4">
              <p className="text-sm md:text-base font-light text-[#2a241e] leading-relaxed text-center">
                縮んできた枠がボタンの枠とぴったり重なった瞬間に押す
              </p>

              <button
                type="button"
                onClick={handleAbort}
                className="inline-flex items-center gap-2 text-base md:text-lg font-bold text-[#2a241e] hover:opacity-85 transition cursor-pointer py-2 px-4"
              >
                <span className="w-7 h-7 rounded-full bg-[#017824] text-white flex items-center justify-center text-xs shrink-0">
                  ◀
                </span>
                <span>修業を中止する</span>
              </button>
            </div>
          </div>
        )}

        {phase === "result" && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[280px] md:max-w-[320px] text-left mb-1">
              <p className="text-2xl md:text-3xl font-extrabold text-[#2a241e]">修業の結果は…</p>
            </div>

            <div className="w-full max-w-[280px] md:max-w-[320px] flex flex-col items-center justify-center my-2 mb-4 gap-2 relative">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-[#D5512A] flex items-center justify-center shadow-lg shrink-0">
                <span className="text-7xl md:text-8xl font-black text-[#DDB442] tracking-tighter">
                  {finalScore}
                </span>
              </div>
              <div className="w-full flex items-baseline justify-end pr-2">
                <span className="text-4xl md:text-5xl font-extrabold text-[#D5512A]">点</span>
                <span className="text-xl md:text-2xl font-bold text-black">でした</span>
              </div>
            </div>

            <div className="w-full text-center mb-3">
              <h3 className="text-2xl md:text-3xl font-extrabold text-[#2a241e] tracking-wide">
                師匠の講評
              </h3>
            </div>

            <div className="w-full bg-[#DDB442] rounded-2xl py-10 px-8 mb-6 shadow-md flex flex-col items-center text-center">
              <p className="text-xl md:text-2xl font-bold text-[#2a241e] leading-relaxed">
                {masterComment}
              </p>
            </div>

            {/* ③ 詳細（本物の公演・イベント案内）へ */}
            <Link
              href="/arts/ningyoJoruri"
              className="w-full py-4 mt-2 text-center rounded-2xl bg-[#D5512A] text-white font-extrabold text-xl shadow-md hover:opacity-90 transition"
            >
              本物の人形浄瑠璃を見に行く ▶
            </Link>

            <div className="w-full flex items-center justify-between px-2 pt-6 pb-6">
              <button
                type="button"
                onClick={() => {
                  setPhase("intro");
                  setActiveStep(0);
                }}
                className="inline-flex items-center gap-2 text-base md:text-lg font-bold text-[#2a241e] hover:opacity-85 transition cursor-pointer"
              >
                <span className="w-7 h-7 rounded-full bg-[#017824] text-white flex items-center justify-center text-xs shrink-0">
                  ◀
                </span>
                <span>もう一度修業する</span>
              </button>

              <Link
                href="/challenge"
                className="inline-flex items-center gap-2 text-base md:text-lg font-bold text-[#2a241e] hover:opacity-85 transition"
              >
                <span>選択画面へ</span>
                <span className="w-7 h-7 rounded-full bg-[#017824] text-white flex items-center justify-center text-xs shrink-0">
                  ▶
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default NingyoJoruriChallenge;
