"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import type { CritiqueResponse, NanoriCritiqueRequest } from "@/types/api";

type Phase = "intro" | "ready" | "recording" | "preview" | "loading" | "result";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10MB上限 (docs/api.md)
const MAX_RECORDING_SECONDS = 15;

const MOCK_NANORI_RESULT: CritiqueResponse = {
  score: 88,
  title: "（モック）見事な名乗り声！千両役者！",
  comment: "（モック講評）声の通りが良く、リズミカルでユーモラスな調子がしっかり表現されています！",
  tips: [
    "語尾をもう少し力強く言い切るとさらに迫力が出ます。",
    "最初のひとことをゆっくり発声すると聞き取りやすくなります。",
  ],
};

export interface NanoriChallengeProps {
  className?: string;
  children?: React.ReactNode;
}

export function NanoriChallenge({ className = "", children }: NanoriChallengeProps = {}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [activeStep, setActiveStep] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [critique, setCritique] = useState<CritiqueResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [isStartingMic, setIsStartingMic] = useState<boolean>(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const instagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = instagramRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => {
      (
        window as Window & {
          instgrm?: { Embeds?: { process: () => void } };
        }
      ).instgrm?.Embeds?.process();
    };

    container.appendChild(script);
  }, []);

  // マイク・タイマー停止処理
  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanup();
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioBlobUrl]);

  // マイク起動処理
  const startMicrophone = async () => {
    cleanup();
    setErrorMessage(null);
    setPermissionError(false);
    setIsStartingMic(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("マイクがサポートされていません");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      setPhase("ready");
      setActiveStep(1);
    } catch (err) {
      console.warn("Microphone access failed", err);
      setPermissionError(true);
      setErrorMessage("マイクへのアクセスが拒否されました。ブラウザの設定をご確認ください。");
    } finally {
      setIsStartingMic(false);
    }
  };

  // 録音開始
  const startRecording = () => {
    const stream = mediaStreamRef.current;
    if (!stream) {
      startMicrophone();
      return;
    }

    setErrorMessage(null);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        const blobUrl = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(blobUrl);

        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const base64Data = dataUrl.split(",")[1] || "";
          const byteLength = Math.round((base64Data.length * 3) / 4);

          if (byteLength > MAX_AUDIO_BYTES) {
            setErrorMessage("音声データが大きすぎます。短めに録音し直してください。");
            setPhase("intro");
            return;
          }

          setAudioDataUrl(dataUrl);
          setPhase("preview");
          setActiveStep(1);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start(200);
      setPhase("recording");
      setActiveStep(1);

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordingSeconds(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.error("Start recording error:", err);
      setErrorMessage("録音の開始に失敗しました。もう一度お試しください。");
      setPhase("intro");
    }
  };

  // 録音停止
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    cleanup();
  };

  // 撮り直し
  const handleRetake = () => {
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }
    setAudioDataUrl(null);
    setErrorMessage(null);
    startMicrophone();
  };

  // API送信処理
  const handleSubmit = async () => {
    if (!audioDataUrl) return;

    setPhase("loading");
    setErrorMessage(null);

    try {
      const payload: NanoriCritiqueRequest = { audio: audioDataUrl };
      const res = await fetch("/api/critique/nanori", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCritique(data as CritiqueResponse);
      } else {
        setCritique(MOCK_NANORI_RESULT);
      }
    } catch {
      setCritique(MOCK_NANORI_RESULT);
    } finally {
      setPhase("result");
      setActiveStep(2);
    }
  };

  const handleStepClick = (index: number) => {
    if (index === 1) {
      startMicrophone();
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

      {/* 定式幕ヘッダーは常に表示 */}
      <header
        className="w-full py-5 text-center shadow-md relative"
        style={{
          background:
            "repeating-linear-gradient(90deg, #017824 0px, #017824 28px, #D5512A 28px, #D5512A 56px, #1a1a1a 56px, #1a1a1a 84px)",
        }}
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-widest inline-block px-4 py-1">
          名乗りチャレンジ
        </h1>
      </header>

      {/* サブタイトル帯（イントロ・準備時のみ） */}
      {phase !== "recording" && phase !== "preview" && phase !== "result" && (
        <div className="w-full bg-[#DDB442] py-2.5 text-center shadow-xs">
          <p className="text-base md:text-lg font-light text-black tracking-wider">
            実際に名乗ってみよう
          </p>
        </div>
      )}

      <div className="w-full max-w-lg mx-auto px-6 md:px-8 pt-5 pb-12">
        {errorMessage && (
          <div className="w-full mb-4 p-3.5 bg-red-100 border border-red-400 text-red-800 rounded-lg text-sm text-center font-bold">
            {errorMessage}
          </div>
        )}

        {permissionError && (
          <div className="w-full mb-4 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm">
            <p className="font-bold mb-1">マイクが使えません</p>
            <p className="text-xs mb-3">
              ブラウザのマイクアクセスが許可されていません。設定を確認してください。
            </p>
            <button
              onClick={startMicrophone}
              className="py-2 px-4 bg-amber-600 text-white rounded-lg text-xs font-bold"
            >
              もう一度試す
            </button>
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
                チャレンジ一覧へ
              </a>
            </div>

            {children}

            {/* 名乗りとはセクション */}
            <section className="flex gap-5 items-start p-1">
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter flex items-baseline gap-1.5 whitespace-nowrap">
                  <span className="text-[#D5512A]">名乗り</span>
                  <span className="text-xl md:text-2xl font-bold text-black">とは</span>
                </h2>
                <p className="text-base md:text-xl leading-relaxed text-[#3a3229] font-light pb-1">
                  能楽で登場人物が素性や役割をリズミカルな調子で高らかに語り、物語の世界へと観客を引き込む演出のこと
                </p>
              </div>

              {/* イラスト／画像枠 */}
              <div className="w-40 h-52 rounded-lg overflow-hidden shrink-0 shadow-md bg-[#c2b59b] border border-[#8c7863] flex flex-col items-center justify-center text-center p-2">
                <div className="text-5xl mb-2">📜</div>
                <span className="text-sm font-bold text-[#3a3229]">名乗りのイメージ</span>
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
                {/* 1. お手本を聞く */}
                <button
                  type="button"
                  onClick={() => handleStepClick(0)}
                  className={`flex-1 flex flex-col items-center gap-1.5 transition ${activeStep === 0 ? "opacity-100 scale-105" : "opacity-85"}`}
                >
                  <div className="h-16 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-12 h-12 fill-none stroke-[#1a1a1a] stroke-[1.5]"
                    >
                      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  </div>
                  <div
                    className="w-full py-2.5 bg-[#017824] text-white text-xs md:text-sm font-normal leading-tight relative shadow-xs flex items-center justify-center pl-3"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)",
                    }}
                  >
                    お手本を聞く
                  </div>
                </button>

                {/* 2. マイクで録音 */}
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
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </div>
                  <div
                    className="w-full py-2.5 bg-[#017824] text-white text-xs md:text-sm font-normal leading-tight relative shadow-xs flex items-center justify-center pl-3 pr-1"
                    style={{
                      clipPath:
                        "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)",
                    }}
                  >
                    マイクで録音
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

            {/* お手本・コツセクション */}
            <section id="example">
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#D5512A] mb-4 tracking-wide">
                お手本
              </h2>

              <div className="flex flex-col gap-6 p-1">
                {" "}
                <div className="w-full h-[520px] rounded-lg overflow-hidden shadow-md bg-white border border-[#8c7863]">
                  {" "}
                  <iframe
                    src="https://www.instagram.com/reel/DBSEpNsSYzF/embed"
                    title="名乗りのお手本"
                    className="h-full w-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="flex-1 flex flex-col justify-around self-stretch text-sm md:text-base text-[#2a241e] font-light tracking-wide py-1">
                  <div className="pb-2.5 border-b border-[#2a241e]/20 flex items-start gap-2">
                    <span className="font-bold text-[#D5512A]">1.</span>
                    <span>お腹から大きな声を出す</span>
                  </div>
                  <div className="pb-2.5 border-b border-[#2a241e]/20 flex items-start gap-2">
                    <span className="font-bold text-[#D5512A]">2.</span>
                    <span>声に抑揚をつけて話す</span>
                  </div>
                  <div className="flex items-start gap-2 pt-0.5">
                    <span className="font-bold text-[#D5512A]">3.</span>
                    <span>ゆっくりと間をとって話す</span>
                  </div>
                </div>
              </div>
            </section>

            {/* マイク起動ボタン */}
            <div className="pt-3 pb-2 flex flex-col items-center">
              <button
                type="button"
                onClick={startMicrophone}
                disabled={isStartingMic}
                className="w-full py-4 px-6 bg-[#D5512A] hover:bg-[#be421f] active:scale-95 text-white font-extrabold text-lg rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isStartingMic ? "マイクを準備中..." : "マイクを起動する"}</span>
              </button>
            </div>
          </div>
        )}

        {/* 録音待機フェーズ */}
        {phase === "ready" && (
          <div className="flex flex-col items-center pt-8 pb-10">
            <div className="w-full bg-[#f4efe6] border-2 border-[#8c7863] rounded-2xl p-8 shadow-xl flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-[#D5512A]/10 rounded-full flex items-center justify-center mb-6 border-4 border-[#D5512A]">
                <svg
                  viewBox="0 0 24 24"
                  className="w-12 h-12 fill-none stroke-[#D5512A] stroke-[2]"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </div>

              <h2 className="text-2xl font-extrabold mb-2 text-[#2a241e]">
                さあ、名乗りを始めましょう
              </h2>
              <p className="text-sm font-light text-[#6b5c4d] mb-8">
                下のボタンを押すと、録音が始まります。
              </p>

              <button
                type="button"
                onClick={startRecording}
                className="w-full py-4 bg-[#D5512A] hover:bg-[#be421f] text-white font-extrabold text-lg rounded-xl shadow-md active:scale-95 transition cursor-pointer"
              >
                録音を開始する
              </button>
            </div>
          </div>
        )}

        {/* 録音中フェーズ */}
        {phase === "recording" && (
          <div className="flex flex-col items-center pt-10 pb-10">
            <div className="w-full bg-[#f4efe6] border-2 border-[#8c7863] rounded-2xl p-8 shadow-xl flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse border-4 border-red-300">
                <div className="w-8 h-8 bg-red-600 rounded-full animate-ping" />
              </div>

              <h2 className="text-2xl font-extrabold mb-2 text-[#2a241e]">名乗りを録音中…</h2>
              <p className="text-lg font-bold text-[#D5512A] mb-8">
                {recordingSeconds} / {MAX_RECORDING_SECONDS} 秒
              </p>

              <button
                type="button"
                onClick={stopRecording}
                className="w-full py-4 bg-[#2a241e] hover:bg-black text-white font-extrabold text-base rounded-xl shadow-md active:scale-95 transition cursor-pointer"
              >
                録音を停止する
              </button>
            </div>
          </div>
        )}

        {/* プレビューフェーズ */}
        {phase === "preview" && audioBlobUrl && (
          <div className="flex flex-col items-center pt-2">
            <div className="w-full bg-[#f4efe6] border-2 border-[#8c7863] rounded-2xl p-6 shadow-xl flex flex-col items-center mb-6">
              <h3 className="text-xl font-extrabold mb-4 text-[#2a241e]">録音した音声を確認</h3>
              <audio src={audioBlobUrl} controls className="w-full mb-6" />
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleSubmit}
                className="w-full py-3.5 bg-[#D5512A] hover:bg-[#be421f] text-white font-extrabold text-base rounded-xl shadow-md active:scale-95 transition cursor-pointer"
              >
                この音声で講評してもらう
              </button>
              <button
                onClick={handleRetake}
                className="w-full py-3.5 border-2 border-black bg-transparent rounded-xl text-black text-base font-bold hover:bg-black/5 active:scale-95 transition cursor-pointer"
              >
                もう一度録り直す
              </button>
            </div>
          </div>
        )}

        {/* 判定中フェーズ */}
        {phase === "loading" && (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="w-14 h-14 border-4 border-[#D5512A] border-t-transparent rounded-full animate-spin mb-4" />
            <h3 className="text-xl font-extrabold mb-1 text-[#2a241e]">名乗りを鑑定中…</h3>
            <p className="text-xs text-neutral-700 font-bold">
              Gemini があなたの音声を講評しています
            </p>
          </div>
        )}

        {/* 講評結果フェーズ */}
        {phase === "result" && critique && (
          <div className="flex flex-col items-center">
            <div className="w-full px-0 flex flex-col items-center">
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

              {/* 音声比較セクション（お手本 vs あなた） */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 mb-6">
                <div className="flex flex-col items-center bg-[#f4efe6] border border-[#8c7863] rounded-xl p-4 shadow-sm">
                  <span className="text-base font-extrabold text-[#2a241e] mb-2">お手本音声</span>
                  {/* お手本の音声ファイルパスは適宜調整してください */}
                  <audio src="/audio/nanori-example.mp3" controls className="w-full" />
                </div>

                <div className="flex flex-col items-center bg-[#f4efe6] border border-[#8c7863] rounded-xl p-4 shadow-sm">
                  <span className="text-base font-extrabold text-[#2a241e] mb-2">あなたの音声</span>
                  {audioBlobUrl ? (
                    <audio src={audioBlobUrl} controls className="w-full" />
                  ) : (
                    <p className="text-xs text-neutral-600 py-2">音声データがありません</p>
                  )}
                </div>
              </div>

              {/* 講評見出し */}
              <div className="w-full text-center mb-3 mt-2">
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#2a241e] tracking-wide">
                  講評
                </h3>
              </div>

              {/* 講評コメントボックス */}
              <div className="w-full bg-[#DDB442] rounded-2xl py-10 px-8 mb-6 shadow-md flex flex-col items-center text-center">
                <p className="text-xl md:text-2xl font-bold text-[#2a241e] leading-relaxed whitespace-pre-wrap">
                  {critique.comment}
                </p>
              </div>

              {/* ③ 詳細（本物の公演）へ */}
              <Link
                href="/arts/nogaku"
                className="w-full py-4 mt-2 text-center rounded-2xl bg-[#D5512A] text-white font-extrabold text-xl shadow-md hover:opacity-90 transition"
              >
                本物の狂言を見に行く ▶
              </Link>

              {/* 下部リンク */}
              <div className="w-full flex items-center justify-between px-2 pt-6 pb-6">
                <button
                  type="button"
                  onClick={() => {
                    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
                    setAudioBlobUrl(null);
                    setAudioDataUrl(null);
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

export default NanoriChallenge;
