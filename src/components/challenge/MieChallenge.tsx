"use client";

import Link from "next/link";
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

  // ビデオ映像から撮影（長辺最大1024pxに縮小）
  const handleCaptureFromVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    const rawWidth = video.videoWidth || 640;
    const rawHeight = video.videoHeight || 480;

    const MAX_DIMENSION = 1024;
    let targetWidth = rawWidth;
    let targetHeight = rawHeight;

    if (rawWidth > MAX_DIMENSION || rawHeight > MAX_DIMENSION) {
      if (rawWidth >= rawHeight) {
        targetWidth = MAX_DIMENSION;
        targetHeight = Math.round((rawHeight * MAX_DIMENSION) / rawWidth);
      } else {
        targetHeight = MAX_DIMENSION;
        targetWidth = Math.round((rawWidth * MAX_DIMENSION) / rawHeight);
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

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

  // ファイル添付撮影（長辺最大1024pxに縮小）
  const handleFileCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const rawWidth = img.width;
        const rawHeight = img.height;

        const MAX_DIMENSION = 1024;
        let targetWidth = rawWidth;
        let targetHeight = rawHeight;

        if (rawWidth > MAX_DIMENSION || rawHeight > MAX_DIMENSION) {
          if (rawWidth >= rawHeight) {
            targetWidth = MAX_DIMENSION;
            targetHeight = Math.round((rawHeight * MAX_DIMENSION) / rawWidth);
          } else {
            targetHeight = MAX_DIMENSION;
            targetWidth = Math.round((rawWidth * MAX_DIMENSION) / rawHeight);
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

        const base64Data = resizedDataUrl.split(",")[1] || "";
        const byteLength = Math.round((base64Data.length * 3) / 4);

        if (byteLength > MAX_IMAGE_BYTES) {
          setErrorMessage("写真のサイズが大きすぎます。もう一度撮影してください。");
          return;
        }

        setCapturedImage(resizedDataUrl);
        setPhase("preview");
        setActiveStep(1);
      };
      img.onerror = () => {
        setErrorMessage("画像の読み込みに失敗しました。別の写真をお試しください。");
      };
      img.src = dataUrl;
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

      {/* 定式幕ヘッダー（すべてのフェーズで常に表示） */}
      {phase !== "result" && (
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
      )}

      {/* サブタイトル帯（introフェーズのみ） */}
      {phase === "intro" && (
        <div className="w-full bg-[#DDB442] py-2.5 text-center shadow-xs">
          <p className="text-base md:text-lg font-light text-black tracking-wider">
            実際に見得を切ってみよう
          </p>
        </div>
      )}

      <div className="w-full max-w-lg mx-auto px-6 md:px-8 pt-5 pb-12">
        {errorMessage && (
          <div className="w-full mb-4 p-3.5 bg-red-100 border border-red-400 text-red-800 rounded-lg text-sm text-center font-bold">
            {errorMessage}
          </div>
        )}

        {phase === "intro" && (
          <div className="flex flex-col gap-7">
            {/* 選択画面へ戻るリンク */}
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

            {/* 見得とはセクション */}
            <section className="flex gap-5 items-start p-1">
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-[#D5512A]">見得</span>
                  <span className="text-xl md:text-2xl font-bold text-black">とは</span>
                </h2>
                <p className="text-base md:text-xl leading-relaxed text-[#3a3229] font-light pb-1">
                  歌舞伎で役者が感情の高ぶりや重要な場面で動きを一時的に止め、力強いポーズを決める演出のこと
                </p>
              </div>

              {/* 見得の写真 */}
              <div className="w-40 h-52 rounded-lg overflow-hidden shrink-0 shadow-md bg-[#c2b59b] border border-[#8c7863]">
                <img
                  src="/images/kabuki-mie.jpg"
                  alt="歌舞伎役者が見得を切る様子"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </section>

            {/* チャレンジの流れセクション */}
            <section className="my-6">
              <div className="bg-[#DDB442] py-2.5 text-center mb-5 shadow-xs">
                <h3 className="text-xl md:text-2xl font-normal text-black tracking-widest">
                  チャレンジの流れ
                </h3>
              </div>

              <div className="flex items-start justify-between">
                {/* 1. お手本を見る */}
                <button
                  type="button"
                  onClick={() => handleStepClick(0)}
                  className={`flex-1 flex flex-col items-center gap-1.5 transition ${activeStep === 0 ? "opacity-100 scale-105" : "opacity-85"}`}
                >
                  <div className="h-16 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-14 h-14 fill-none stroke-[#1a1a1a] stroke-[1.5]"
                    >
                      <ellipse cx="12" cy="12" rx="8" ry="5" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                  <div
                    className="w-full py-2.5 bg-[#017824] text-white text-xs md:text-sm font-normal leading-tight relative shadow-xs flex items-center justify-center pl-3"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)",
                    }}
                  >
                    お手本を見る
                  </div>
                </button>

                {/* 2. カメラで撮影 */}
                <button
                  type="button"
                  onClick={() => handleStepClick(1)}
                  className={`flex-1 flex flex-col items-center gap-1.5 transition ${activeStep === 1 ? "opacity-100 scale-105" : "opacity-85"}`}
                >
                  <div className="h-16 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-12 h-12 fill-none stroke-[#1a1a1a] stroke-[1.5]"
                    >
                      <rect x="2" y="6" width="20" height="14" rx="2" />
                      <circle cx="12" cy="13" r="3.5" />
                      <path d="M8 6l1.5-3h5L16 6" />
                    </svg>
                  </div>
                  <div
                    className="w-full py-2.5 bg-[#017824] text-white text-xs md:text-sm font-normal leading-tight relative shadow-xs flex items-center justify-center pl-3 pr-1"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)",
                    }}
                  >
                    カメラで撮影
                  </div>
                </button>

                {/* 3. 講評を見る */}
                <button
                  type="button"
                  onClick={() => handleStepClick(2)}
                  className={`flex-1 flex flex-col items-center gap-1.5 transition ${activeStep === 2 ? "opacity-100 scale-105" : "opacity-85"}`}
                >
                  <div className="h-16 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-12 h-12 fill-none stroke-[#1a1a1a] stroke-[1.6]"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M8 12l2.5 2.5L16 9" />
                    </svg>
                  </div>
                  <div
                    className="w-full py-2.5 bg-[#017824] text-white text-xs md:text-sm font-normal leading-tight relative shadow-xs flex items-center justify-center pl-3"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 14px 50%)" }}
                  >
                    講評を見る
                  </div>
                </button>
              </div>
            </section>

            {/* お手本セクション */}
            <section id="example">
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#D5512A] mb-4 tracking-wide">
                お手本
              </h2>

              <div className="flex gap-6 items-center p-1">
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

                <div className="flex-1 flex flex-col justify-around self-stretch text-sm md:text-base text-[#2a241e] font-light tracking-wide py-1">
                  <div className="pb-2.5 border-b border-[#2a241e]/20 flex items-start gap-2">
                    <span className="font-bold text-[#D5512A]">1.</span>
                    <span>視線を一点にグッと据える</span>
                  </div>
                  <div className="pb-2.5 border-b border-[#2a241e]/20 flex items-start gap-2">
                    <span className="font-bold text-[#D5512A]">2.</span>
                    <span>ポーズの瞬間に動きを完全にとめる</span>
                  </div>
                  <div className="flex items-start gap-2 pt-0.5">
                    <span className="font-bold text-[#D5512A]">3.</span>
                    <span>首を力強く傾けて角度をつける</span>
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
          <div className="flex flex-col items-center pt-2 -mx-4">
            <div className="relative w-full aspect-[3/4] bg-neutral-900 overflow-hidden mb-6 shadow-xl border-y-2 border-[#8c7863]">
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

            <div className="w-full px-4">
              <button
                type="button"
                onClick={handleCaptureFromVideo}
                className="w-full py-3.5 bg-[#D5512A] hover:bg-[#be421f] text-white font-extrabold text-base rounded-xl shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>撮影する</span>
              </button>
            </div>
          </div>
        )}

        {/* プレビューフェーズ */}
        {phase === "preview" && capturedImage && (
          <div className="flex flex-col items-center pt-2">
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-black shadow-xl border-2 border-[#8c7863]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="撮影した見得" className="w-full h-full object-cover" />
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleSubmit}
                className="w-full py-3.5 bg-[#D5512A] hover:bg-[#be421f] text-white font-extrabold text-base rounded-xl shadow-md active:scale-95 transition cursor-pointer"
              >
                この写真で講評してもらう
              </button>
              <button
                onClick={handleRetake}
                className="w-full py-3.5 border-2 border-black bg-transparent rounded-xl text-black text-base font-bold hover:bg-black/5 active:scale-95 transition cursor-pointer"
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
          <div className="flex flex-col items-center -mx-6 md:-mx-8 -mt-5">
            <header
              className="w-full py-5 text-center shadow-md relative mb-6"
              style={{
                background:
                  "repeating-linear-gradient(90deg, #017824 0px, #017824 28px, #D5512A 28px, #D5512A 56px, #1a1a1a 56px, #1a1a1a 84px)",
              }}
            >
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-widest inline-block px-4 py-1">
                見得チャレンジ
              </h1>
            </header>

            <div className="w-full px-6 md:px-8 flex flex-col items-center">
              <div className="w-full max-w-[280px] md:max-w-[320px] text-left mb-1">
                <p className="text-2xl md:text-3xl font-extrabold text-[#2a241e]">結果は…</p>
              </div>

              <div className="w-full max-w-[280px] md:max-w-[320px] flex flex-col items-center justify-center my-2 mb-4 gap-2 relative">
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-[#D5512A] flex items-center justify-center shadow-lg shrink-0 pb-3">
                  <span
                    className="text-9xl md:text-9xl font-black text-[#DDB442] tracking-tighter"
                    style={{
                      fontWeight: 900,
                      WebkitTextStroke: "8px #2a241e",
                      paintOrder: "stroke fill",
                    }}
                  >
                    {critique.score}
                  </span>
                </div>
                <div className="w-full flex items-baseline justify-end pr-2">
                  <span className="text-4xl md:text-5xl font-extrabold text-[#D5512A]">点</span>
                  <span className="text-xl md:text-2xl font-bold text-black">で</span>
                  <span className="text-xl md:text-2xl font-bold text-black">し</span>
                  <span className="text-xl md:text-2xl font-bold text-black">た</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4 mt-2 mb-10">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-extrabold text-[#2a241e] mb-2">お手本</span>
                  <div className="w-full aspect-[3/4] rounded-lg overflow-hidden shadow-md bg-[#c2b59b] border border-[#8c7863] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400"
                      alt="お手本"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-lg font-extrabold text-[#2a241e] mb-2">あなた</span>
                  <div className="w-full aspect-[3/4] rounded-lg overflow-hidden shadow-md bg-[#c2b59b] border border-[#8c7863] flex items-center justify-center">
                    {capturedImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={capturedImage}
                        alt="あなたの撮影写真"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl">🎭</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full text-center mb-3">
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#2a241e] tracking-wide">
                  講評
                </h3>
              </div>

              <div className="w-full bg-[#DDB442] rounded-2xl py-10 px-8 mb-6 shadow-md flex flex-col items-center text-center">
                <p className="text-xl md:text-2xl font-bold text-[#2a241e] leading-relaxed whitespace-pre-wrap">
                  {critique.comment}
                </p>
              </div>

              {/* ③ 詳細（本物の公演）へ */}
              <Link
                href="/arts/kabuki"
                className="w-full py-4 mt-2 text-center rounded-2xl bg-[#D5512A] text-white font-extrabold text-xl shadow-md hover:opacity-90 transition"
              >
                本物の歌舞伎を見に行く ▶
              </Link>

              <div className="w-full flex items-center justify-between px-2 pt-6 pb-6">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedImage(null);
                    setCritique(null);
                    setPhase("intro");
                    setActiveStep(0);
                  }}
                  className="inline-flex items-center gap-2 text-base md:text-lg font-bold text-[#2a241e] hover:opacity-85 transition cursor-pointer"
                >
                  <span className="w-7 h-7 rounded-full bg-[#017824] text-white flex items-center justify-center text-xs shrink-0">
                    ◀
                  </span>
                  <span>もう一度挑戦</span>
                </button>

                <a
                  href="/challenge"
                  className="inline-flex items-center gap-2 text-base md:text-lg font-bold text-[#2a241e] hover:opacity-85 transition"
                >
                  <span>選択画面へ</span>
                  <span className="w-7 h-7 rounded-full bg-[#017824] text-white flex items-center justify-center text-xs shrink-0">
                    ▶
                  </span>
                </a>
              </div>
            </div>
          </div>
        )}

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
