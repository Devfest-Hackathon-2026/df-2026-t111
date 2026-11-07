"use client";

import { useEffect, useRef, useState } from "react";
import type { CritiqueResponse, MieCritiqueRequest } from "@/types/api";

type Phase = "ready" | "camera" | "preview" | "loading" | "result";

// 5MBの上限バイト数（docs/api.md 仕様）
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// 仮の講評モックデータ（docs/api.md 仕様準拠）
const MOCK_MIE_RESULT: CritiqueResponse = {
  score: 78,
  title: "（モック）堂々とした見得！",
  comment: "（モックの講評です）目線に力があって、ぐっと引きつけられます。",
  tips: ["あごを少し引いてみましょう", "動きを止める瞬間をもう少し長く"],
};

export function MieChallenge() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [critique, setCritique] = useState<CritiqueResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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

  // カメラを起動する
  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);
    setPermissionError(false);
    setIsStartingCamera(true);

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === "videoinput");

      const sortedInputs = [...videoInputs].sort((a, b) => {
        const aIsVirtual = /obs|virtual|dummy/i.test(a.label);
        const bIsVirtual = /obs|virtual|dummy/i.test(b.label);
        if (aIsVirtual && !bIsVirtual) return 1;
        if (!aIsVirtual && bIsVirtual) return -1;
        return 0;
      });

      let stream: MediaStream | null = null;

      for (const dev of sortedInputs) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: dev.deviceId ? { deviceId: { exact: dev.deviceId } } : true,
            audio: false,
          });
          if (stream) break;
        } catch {
          // 次の候補を試行
        }
      }

      if (!stream) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        stream = await navigator.mediaDevices.getUserMedia({
          video: isMobile ? { facingMode: "user" } : true,
          audio: false,
        });
      }

      mediaStreamRef.current = stream;
      setPhase("camera");
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setPermissionError(true);
    } finally {
      setIsStartingCamera(false);
    }
  };

  // phase が "camera" になったら video 要素に stream をセットして再生
  useEffect(() => {
    if (phase !== "camera") return;

    const video = videoRef.current;
    const stream = mediaStreamRef.current;

    if (video && stream) {
      video.srcObject = stream;
      video.play().catch((playErr) => {
        console.warn("video.play() failed:", playErr);
      });
    }
  }, [phase]);

  // コンポーネント破棄時にカメラを止める
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // 写真を撮影する
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // インカメラ表示に合わせて鏡像反転して描画
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // canvas.toDataURL("image/jpeg", 0.8) （docs/api.md 仕様）
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

    // サイズチェック（5MB）
    const base64Data = dataUrl.split(",")[1] || "";
    const byteLength = Math.round((base64Data.length * 3) / 4);

    if (byteLength > MAX_IMAGE_BYTES) {
      setErrorMessage("写真のサイズが大きすぎます。もう一度撮影してください。");
      return;
    }

    // カメラストリームを停止してプレビューへ
    stopCamera();
    setCapturedImage(dataUrl);
    setPhase("preview");
  };

  // 撮り直し
  const handleRetake = () => {
    setCapturedImage(null);
    setErrorMessage(null);
    startCamera();
  };

  // 講評APIを呼ぶ（APIがエラーでも確実に仮の講評を表示）
  const handleSubmit = async () => {
    if (!capturedImage) return;

    setPhase("loading");
    setErrorMessage(null);

    try {
      const payload: MieCritiqueRequest = {
        image: capturedImage,
      };

      const res = await fetch("/api/critique/mie", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setCritique(data as CritiqueResponse);
      } else {
        setCritique(MOCK_MIE_RESULT);
      }
      setPhase("result");
    } catch {
      setCritique(MOCK_MIE_RESULT);
      setPhase("result");
    }
  };

  // もう一度最初から挑戦
  const handleReset = () => {
    setCapturedImage(null);
    setCritique(null);
    setErrorMessage(null);
    setPermissionError(false);
    setPhase("ready");
  };

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col items-center">
      {/* エラーメッセージ */}
      {errorMessage && (
        <div className="w-full mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
          {errorMessage}
        </div>
      )}

      {/* カメラ許可拒否時の案内 */}
      {permissionError && (
        <div className="w-full mb-4 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900">
          <h3 className="font-bold text-sm mb-1">カメラが使えません</h3>
          <p className="text-xs mb-3 leading-relaxed">
            ブラウザのカメラアクセスが許可されていないようです。ブラウザの設定でカメラを許可して、もう一度お試しください。
          </p>
          <button
            onClick={startCamera}
            className="w-full py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 active:opacity-90"
          >
            もう一度カメラを試す
          </button>
        </div>
      )}

      {/* 1. 開始フェーズ */}
      {phase === "ready" && (
        <div className="w-full flex flex-col items-center text-center pt-8">
          <h1 className="text-2xl font-bold mb-2">見得チャレンジ</h1>
          <p className="text-sm text-neutral-600 mb-8">
            カメラで写真を撮影して、見得のポーズを講評してもらいましょう。
          </p>

          <button
            onClick={startCamera}
            disabled={isStartingCamera}
            className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 active:scale-95 transition disabled:opacity-50"
          >
            {isStartingCamera ? "カメラを起動中…" : "カメラを起動する"}
          </button>
        </div>
      )}

      {/* 2. 撮影フェーズ */}
      {phase === "camera" && (
        <div className="w-full flex flex-col items-center">
          <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover -scale-x-100"
            />

            {/* ガイド枠 */}
            <div className="absolute inset-4 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
              <span className="text-xs text-white/80 bg-black/40 px-2 py-1 rounded">
                枠の中に顔をあわせて見得！
              </span>
            </div>
          </div>

          <div className="w-full flex gap-3">
            <button
              onClick={() => {
                stopCamera();
                setPhase("ready");
              }}
              className="py-3 px-4 border border-neutral-300 rounded-xl text-neutral-700 text-sm font-medium hover:bg-neutral-50"
            >
              もどる
            </button>
            <button
              onClick={handleCapture}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              📸 パシャッと撮影する
            </button>
          </div>
        </div>
      )}

      {/* 3. プレビューフェーズ（確認・撮り直し） */}
      {phase === "preview" && capturedImage && (
        <div className="w-full flex flex-col items-center">
          <h3 className="font-bold text-base mb-2">この写真で判定しますか？</h3>
          <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capturedImage} alt="撮影した写真" className="w-full h-full object-cover" />
          </div>

          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={handleSubmit}
              className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 active:scale-95 transition"
            >
              この写真で講評してもらう
            </button>
            <button
              onClick={handleRetake}
              className="w-full py-2.5 border border-neutral-300 rounded-xl text-neutral-700 text-sm font-medium hover:bg-neutral-50"
            >
              もう一度撮り直す
            </button>
          </div>
        </div>
      )}

      {/* 4. 判定中フェーズ */}
      {phase === "loading" && (
        <div className="w-full py-16 flex flex-col items-center text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-bold mb-1">見得を鑑定中…</h3>
          <p className="text-xs text-neutral-500">Gemini があなたのポーズを講評しています</p>
        </div>
      )}

      {/* 5. 講評結果フェーズ（最低限の機能・デザイン） */}
      {phase === "result" && critique && (
        <div className="w-full flex flex-col items-center pt-4">
          <div className="w-full border border-neutral-200 rounded-xl p-5 mb-6 text-left">
            <h2 className="text-sm font-bold text-neutral-500 mb-1">講評結果</h2>
            <div className="text-3xl font-extrabold text-neutral-900 mb-2">
              {critique.score}点
            </div>
            <h3 className="text-base font-bold text-neutral-800 mb-2">{critique.title}</h3>
            <p className="text-sm text-neutral-700 leading-relaxed mb-4">{critique.comment}</p>

            {critique.tips && critique.tips.length > 0 && (
              <div>
                <p className="text-xs font-bold text-neutral-600 mb-1">アドバイス：</p>
                <ul className="text-xs text-neutral-600 list-disc list-inside space-y-1">
                  {critique.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 bg-neutral-900 text-white font-bold rounded-xl active:scale-95 transition"
          >
            もう一度チャレンジする
          </button>
        </div>
      )}

      {/* プライバシー注意書き */}
      <p className="text-[11px] text-neutral-400 text-center mt-6">
        ※ 撮影した写真はAIによる講評にのみ使用し、サーバーには保存されません。
      </p>
    </div>
  );
}
