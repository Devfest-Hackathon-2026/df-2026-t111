"use client";

import React, { useEffect, useRef, useState } from "react";

export interface CritiqueResponse {
  score: number;
  title: string;
  comment: string;
  tips: string[];
  error?: {
    message: string;
  };
}

export interface MieCritiqueRequest {
  image: string;
}

export interface MieChallengeProps {
  className?: string;
  children?: React.ReactNode;
}

type Phase = "intro" | "camera" | "preview" | "loading" | "result";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB上限 (docs/api.md)

const MOCK_MIE_RESULT: CritiqueResponse = {
  score: 88,
  title: "（モック）見事な大見得！千両役者！",
  comment:
    "（モック講評）視線と顔の角度に力があり、歌舞伎の伝統的な躍動感がしっかり表現されています！",
  tips: [
    "首をもう少しだけ斜めに傾けると、さらに動作が映えます。",
    "目線を一箇所にグッと集中させると迫力が増します。",
  ],
};

export function MieChallenge({ className = "", children }: MieChallengeProps = {}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [activeStep, setActiveStep] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [critique, setCritique] = useState<CritiqueResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // カメラ停止処理
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // カメラ起動処理（フォールバック付き）
  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);
    setIsStartingCamera(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("カメラがサポートされていません");
      }

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isMobile ? { facingMode: "user" } : true,
        audio: false,
      });

      mediaStreamRef.current = stream;
      setPhase("camera");
      setActiveStep(1);
    } catch (err) {
      console.warn("Camera access failed, falling back to file input", err);
      fileInputRef.current?.click();
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    if (phase !== "camera") return;
    const video = videoRef.current;
    const stream = mediaStreamRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.play().catch((err) => console.warn("video.play failed:", err));
    }
  }, [phase]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // ビデオ映像から撮影
  const handleCaptureFromVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

    const base64Data = dataUrl.split(",")[1] || "";
    const byteLength = Math.round((base64Data.length * 3) / 4);

    if (byteLength > MAX_IMAGE_BYTES) {
      setErrorMessage("写真のサイズが大きすぎます。もう一度撮影してください。");
      return;
    }

    stopCamera();
    setCapturedImage(dataUrl);
    setPhase("preview");
  };

  // ファイル添付撮影
  const handleFileCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMessage(
        "写真のサイズが5MBを超えています。別の写真をお試しのうえ再送信してください。",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCapturedImage(dataUrl);
      setPhase("preview");
      setActiveStep(1);
    };
    reader.readAsDataURL(file);
  };

  // 撮り直し
  const handleRetake = () => {
    setCapturedImage(null);
    setErrorMessage(null);
    startCamera();
  };

  // API送信処理
  const handleSubmit = async () => {
    if (!capturedImage) return;

    setPhase("loading");
    setErrorMessage(null);

    try {
      const payload: MieCritiqueRequest = { image: capturedImage };
      const res = await fetch("/api/critique/mie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCritique(data as CritiqueResponse);
      } else {
        setCritique(MOCK_MIE_RESULT);
      }
    } catch {
      setCritique(MOCK_MIE_RESULT);
    } finally {
      setPhase("result");
      setActiveStep(2);
    }
  };

  const handleStepClick = (index: number) => {
    if (index === 1) {
      startCamera();
      return;
    }
    setActiveStep(index);
    if (index === 0) {
      document.querySelector("#example")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <main className={`min-h-dvh bg-[#d9cfb6] text-black ${className}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap');

        *, :root, body, main, button, input, select, textarea, p, h1, h2, h3, h4, span, div, a, li {
          font-family: "Yuji Syuku", serif !important;
        }
      `}</style>

      {/* ヘッダー */}
      <header
        className="w-full py-5 text-center shadow-md relative"
        style={{
          background:
            "repeating-linear-gradient(90deg, #017824 0px, #017824 28px, #D5512A 28px, #D5512A 56px, #1a1a1a 56px, #1a1a1a 84px)",
        }}
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-widest inline-block px-4 py-1">
          見得チャレンジ
        </h1>
      </header>

      {/* サブタイトル帯 */}
      <div className="w-full bg-[#DDB442] py-2.5 text-center shadow-xs">
        <p className="text-base md:text-lg font-light text-black tracking-wider">
          実際に見得を切ってみよう
        </p>
      </div>

      <div className="w-full max-w-lg mx-auto px-4 pt-5 pb-12">
        {errorMessage && (
          <div className="w-full mb-4 p-3.5 bg-red-100 border border-red-400 text-red-800 rounded-lg text-sm text-center font-bold">
            {errorMessage}
          </div>
        )}

        {phase === "intro" && (
          <div className="flex flex-col gap-7">
            {/* 選択画面へ戻るリンク（文字を細く、フォントサイズ・中央三角調整） */}
            <div className="flex items-center">
              <a
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
              </a>
            </div>

            {children}

            {/* 見得とはセクション（説明を下端に揃える） */}
            <section className="flex gap-5 items-start p-1">
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#D5512A] tracking-wide">
                  見得<span className="text-xl md:text-2xl font-bold text-[#2a241e]">とは</span>
                </h2>
                <p className="text-base md:text-xl leading-relaxed text-[#3a3229] font-light pb-1">
                  歌舞伎で役者が感情の高ぶりや重要な場面で動きを一時的に止め、力強いポーズを決める演出のこと
                </p>
              </div>

              {/* 写真プレビュー枠 */}
              <div className="w-40 h-52 rounded-lg overflow-hidden shrink-0 shadow-md bg-[#c2b59b] border border-[#8c7863] flex flex-col items-center justify-center text-center p-2">
                <div className="text-5xl mb-2">🎭</div>
                <span className="text-sm font-bold text-[#3a3229]">見得の写真</span>
              </div>
            </section>

            {/* チャレンジの流れセクション（余白を現在の2/3に調整） */}
            <section className="my-10">
              <div className="bg-[#DDB442] py-2.5 text-center -mx-4 mb-5 shadow-xs">
                <h3 className="text-xl md:text-2xl font-bold text-black tracking-widest">
                  チャレンジの流れ
                </h3>
              </div>

              {/* 3ステップ：左右端を完全に揃えた矢印リボン */}
              <div className="flex items-start justify-between -mx-4">
                {/* ステップ1 */}
                <button
                  type="button"
                  onClick={() => handleStepClick(0)}
                  className={`flex-1 flex flex-col items-center gap-1.5 transition ${activeStep === 0 ? "opacity-100 scale-105" : "opacity-85"}`}
                >
                  <div className="h-16 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-14 h-14 fill-none stroke-[#1a1a1a] stroke-[2.2]"
                    >
                      <ellipse cx="12" cy="12" rx="8" ry="5" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <div
                    className="w-full py-2.5 bg-[#017824] text-white text-xs md:text-sm font-bold leading-tight relative shadow-xs flex items-center justify-center pl-2"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)",
                    }}
                  >
                    お手本を見る
                  </div>
                </button>

                {/* ステップ2 */}
                <button
                  type="button"
                  onClick={() => handleStepClick(1)}
                  className={`flex-1 flex flex-col items-center gap-1.5 transition ${activeStep === 1 ? "opacity-100 scale-105" : "opacity-85"}`}
                >
                  <div className="h-16 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-12 h-12 fill-none stroke-[#1a1a1a] stroke-[2.2]"
                    >
                      <rect x="2" y="6" width="20" height="14" rx="2" />
                      <circle cx="12" cy="13" r="3.5" />
                      <path d="M8 6l1.5-3h5L16 6" />
                    </svg>
                  </div>
                  <div
                    className="w-full py-2.5 bg-[#017824] text-white text-xs md:text-sm font-bold leading-tight relative shadow-xs flex items-center justify-center px-2"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)",
                    }}
                  >
                    カメラで撮影
                  </div>
                </button>

                {/* ステップ3 */}
                <button
                  type="button"
                  onClick={() => handleStepClick(2)}
                  className={`flex-1 flex flex-col items-center gap-1.5 transition ${activeStep === 2 ? "opacity-100 scale-105" : "opacity-85"}`}
                >
                  <div className="h-16 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-12 h-12 fill-none stroke-[#1a1a1a] stroke-[2.5]"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8 12l2.5 2.5L16 9" />
                    </svg>
                  </div>
                  <div
                    className="w-full py-2.5 bg-[#017824] text-white text-xs md:text-sm font-bold leading-tight relative shadow-xs flex items-center justify-center pr-2"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%)" }}
                  >
                    講評を見る
                  </div>
                </button>
              </div>
            </section>

            {/* お手本セクション */}
            <section id="example">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#D5512A] mb-4 tracking-wide">
                お手本
              </h2>

              <div className="flex gap-8 items-center p-1">
                <div className="w-40 h-52 rounded-lg overflow-hidden shrink-0 shadow-md bg-[#c2b59b] border border-[#8c7863] flex flex-col items-center justify-center text-center p-2">
                  {capturedImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={capturedImage}
                      alt="撮影画像"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="text-5xl mb-2">👘</div>
                      <span className="text-sm font-bold text-[#3a3229]">お手本ポーズ</span>
                    </>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-3 text-base md:text-lg text-[#2a241e] font-light tracking-wide">
                  <div className="pb-2 border-b border-[#2a241e]/20 flex items-start gap-2">
                    <span className="font-bold text-[#D5512A]">1.</span>
                    <span>視線を一点にグッと据える</span>
                  </div>
                  <div className="pb-2 border-b border-[#2a241e]/20 flex items-start gap-2">
                    <span className="font-bold text-[#D5512A]">2.</span>
                    <span>ポーズの瞬間に動きを完全にとめる</span>
                  </div>
                  <div className="pb-2 border-b border-[#2a241e]/20 flex items-start gap-2">
                    <span className="font-bold text-[#D5512A]">3.</span>
                    <span>首を力強く傾けて角度をつける</span>
                  </div>
                  <div className="pb-2 flex items-start gap-2">
                    <span className="font-bold text-[#D5512A]">4.</span>
                    <span>足を踏みしめて下半身を安定させる</span>
                  </div>
                </div>
              </div>
            </section>

            {/* カメラ起動ボタン */}
            <div className="pt-3 pb-2 flex flex-col items-center">
              {capturedImage && (
                <p className="text-sm font-bold text-[#017824] mb-2">
                  撮影できました。講評を確認しましょう。
                </p>
              )}
              <button
                type="button"
                onClick={startCamera}
                disabled={isStartingCamera}
                className="w-full py-4 px-6 bg-[#D5512A] hover:bg-[#be421f] active:scale-95 text-white font-extrabold text-lg rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none stroke-white stroke-[2]">
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <circle cx="12" cy="13" r="3.5" />
                  <path d="M8 6l1.5-3h5L16 6" />
                </svg>
                <span>
                  {isStartingCamera
                    ? "準備中..."
                    : capturedImage
                      ? "もう一度撮影する"
                      : "カメラを起動する"}
                </span>
              </button>
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileCapture}
              />
            </div>
          </div>
        )}

        {/* カメラ撮影フェーズ */}
        {phase === "camera" && (
          <div className="flex flex-col items-center pt-2">
            <div className="relative w-full aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden mb-4 shadow-xl border-2 border-[#8c7863]">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              <div className="absolute inset-6 border-2 border-dashed border-white/80 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-xs font-bold text-white bg-black/60 px-4 py-2 rounded-full">
                  枠の中に顔をあわせて見得！
                </span>
              </div>
            </div>

            <div className="w-full flex gap-3">
              <button
                onClick={() => {
                  stopCamera();
                  setPhase("intro");
                }}
                className="py-3 px-5 border border-[#8c7863] bg-white/80 rounded-xl text-neutral-800 text-sm font-bold hover:bg-white"
              >
                もどる
              </button>
              <button
                onClick={handleCaptureFromVideo}
                className="flex-1 py-3.5 bg-[#D5512A] hover:bg-[#be421f] text-white font-extrabold text-base rounded-xl shadow-md active:scale-95 transition cursor-pointer"
              >
                📸 撮影する
              </button>
            </div>
          </div>
        )}

        {/* プレビューフェーズ */}
        {phase === "preview" && capturedImage && (
          <div className="flex flex-col items-center pt-2">
            <h3 className="font-extrabold text-base mb-3 text-[#2a241e]">
              この写真で判定しますか？
            </h3>
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-black shadow-xl border-2 border-[#8c7863]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="撮影した見得" className="w-full h-full object-cover" />
            </div>

            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={handleSubmit}
                className="w-full py-3.5 bg-[#D5512A] hover:bg-[#be421f] text-white font-extrabold text-base rounded-xl shadow-md active:scale-95 transition cursor-pointer"
              >
                この写真で講評してもらう
              </button>
              <button
                onClick={handleRetake}
                className="w-full py-2.5 border border-[#8c7863] bg-white/70 rounded-xl text-neutral-800 text-sm font-bold hover:bg-white"
              >
                もう一度撮り直す
              </button>
            </div>
          </div>
        )}

        {/* 判定中フェーズ */}
        {phase === "loading" && (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="w-14 h-14 border-4 border-[#D5512A] border-t-transparent rounded-full animate-spin mb-4" />
            <h3 className="text-xl font-extrabold mb-1 text-[#2a241e]">見得を鑑定中…</h3>
            <p className="text-xs text-neutral-700 font-bold">
              Gemini があなたのポーズを講評しています
            </p>
          </div>
        )}

        {/* 講評結果フェーズ */}
        {phase === "result" && critique && (
          <div className="flex flex-col items-center pt-2">
            <div className="w-full bg-[#f4ebd9] border-2 border-[#8c7863] rounded-2xl p-5 mb-6 shadow-md text-left">
              <h2 className="text-xs font-bold text-[#8c7863] mb-1">講評結果</h2>
              <div className="text-4xl font-extrabold text-[#D5512A] mb-2">
                {critique.score}
                <span className="text-lg">点</span>
              </div>
              <h3 className="text-lg font-extrabold text-[#2a241e] mb-2">{critique.title}</h3>
              <p className="text-sm font-bold text-[#3a3229] leading-relaxed mb-4">
                {critique.comment}
              </p>

              {critique.tips && critique.tips.length > 0 && (
                <div className="bg-white/70 p-3 rounded-lg border border-[#8c7863]/40">
                  <p className="text-xs font-bold text-[#2a241e] mb-1">アドバイス：</p>
                  <ul className="text-xs text-[#2a241e] font-bold list-disc list-inside space-y-1">
                    {critique.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setCapturedImage(null);
                setCritique(null);
                setPhase("intro");
                setActiveStep(0);
              }}
              className="w-full py-3.5 bg-[#017824] hover:bg-[#015e1c] text-white font-extrabold text-base rounded-xl active:scale-95 transition shadow-md cursor-pointer"
            >
              もう一度チャレンジする
            </button>
          </div>
        )}

        {/* プライバシー注記 */}
        <footer className="px-4 text-center mt-6">
          <p className="text-[11px] text-[#6b5c4d] font-bold">
            ※ カメラ・マイクのデータは講評にだけ使い、保存しません。
          </p>
        </footer>
      </div>
    </main>
  );
}

export default MieChallenge;
