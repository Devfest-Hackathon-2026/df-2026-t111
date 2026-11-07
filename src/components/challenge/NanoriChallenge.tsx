"use client";

import { useEffect, useRef, useState } from "react";
import type { CritiqueResponse, NanoriCritiqueRequest } from "@/types/api";

type Phase = "ready" | "standby" | "recording" | "preview" | "loading" | "result";

// 10MBの上限バイト数（docs/api.md 仕様）
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
// 最大録音秒数（15秒）
const MAX_RECORDING_SECONDS = 15;

// 仮の講評モックデータ（docs/api.md 仕様準拠）
const MOCK_NANORI_RESULT: CritiqueResponse = {
  score: 82,
  title: "（モック）よく通る名乗り！",
  comment: "（モックの講評です）声がはっきりしていて、聞き取りやすい名乗りでした。",
  tips: ["語尾まで息を残しましょう", "最初のひとことをもう少しゆっくり"],
};

export function NanoriChallenge() {
  const [phase, setPhase] = useState<Phase>("ready");
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

  // マイク・タイマーの停止
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

  // コンポーネント破棄時のクリーンアップ
  useEffect(() => {
    return () => {
      cleanup();
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [audioBlobUrl]);

  // マイクを準備する
  const prepareMicrophone = async () => {
    cleanup();
    setErrorMessage(null);
    setPermissionError(false);
    setIsStartingMic(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setPhase("standby");
    } catch (err: unknown) {
      console.error("Microphone access error:", err);
      setPermissionError(true);
    } finally {
      setIsStartingMic(false);
    }
  };

  // 録音開始
  const startRecording = () => {
    if (!mediaStreamRef.current) return;

    setErrorMessage(null);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      const stream = mediaStreamRef.current;

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
            setErrorMessage("録音が長すぎます。短めにもう一度録ってください。");
            setPhase("standby");
            return;
          }

          setAudioDataUrl(dataUrl);
          setPhase("preview");
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start(200);
      setPhase("recording");

      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordingSeconds(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch (err: unknown) {
      console.error("Start recording error:", err);
      setErrorMessage("録音の開始に失敗しました。もう一度お試しください。");
      setPhase("standby");
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
  };

  // 録り直し
  const handleRetake = () => {
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }
    setAudioDataUrl(null);
    setErrorMessage(null);
    setPhase("standby");
  };

  // 講評APIを呼ぶ（APIがエラーでも確実に仮の講評を表示）
  const handleSubmit = async () => {
    if (!audioDataUrl) return;

    setPhase("loading");
    setErrorMessage(null);

    try {
      const payload: NanoriCritiqueRequest = {
        audio: audioDataUrl,
      };

      const res = await fetch("/api/critique/nanori", {
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
        setCritique(MOCK_NANORI_RESULT);
      }
      setPhase("result");
    } catch {
      setCritique(MOCK_NANORI_RESULT);
      setPhase("result");
    }
  };

  // もう一度最初から挑戦
  const handleReset = () => {
    cleanup();
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }
    setAudioDataUrl(null);
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

      {/* マイク許可拒否時の案内 */}
      {permissionError && (
        <div className="w-full mb-4 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900">
          <h3 className="font-bold text-sm mb-1">マイクが使えません</h3>
          <p className="text-xs mb-3 leading-relaxed">
            ブラウザのマイクアクセスが許可されていないようです。ブラウザの設定でマイクを許可して、もう一度お試しください。
          </p>
          <button
            onClick={prepareMicrophone}
            className="w-full py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 active:opacity-90"
          >
            もう一度マイクを試す
          </button>
        </div>
      )}

      {/* 1. 開始フェーズ */}
      {phase === "ready" && (
        <div className="w-full flex flex-col items-center text-center pt-8">
          <h1 className="text-2xl font-bold mb-2">名乗りチャレンジ</h1>
          <p className="text-sm text-neutral-600 mb-8">
            マイクで音声を録音して、狂言の名乗りを講評してもらいましょう。
          </p>

          <button
            onClick={prepareMicrophone}
            disabled={isStartingMic}
            className="w-full py-3.5 bg-neutral-900 text-white font-bold rounded-xl shadow-md hover:bg-neutral-800 active:scale-95 transition disabled:opacity-50"
          >
            {isStartingMic ? "マイクを準備中…" : "マイクを起動する"}
          </button>
        </div>
      )}

      {/* 2. 録音待機フェーズ（スタンバイ） */}
      {phase === "standby" && (
        <div className="w-full flex flex-col items-center text-center pt-8">
          <h2 className="text-lg font-bold mb-6">録音の準備ができました</h2>

          <button
            onClick={startRecording}
            className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 active:scale-95 transition"
          >
            🎙 録音スタート
          </button>
        </div>
      )}

      {/* 3. 録音中フェーズ */}
      {phase === "recording" && (
        <div className="w-full flex flex-col items-center text-center pt-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <div className="w-6 h-6 bg-red-600 rounded-full" />
          </div>

          <h2 className="text-lg font-bold mb-1">録音中…</h2>
          <p className="text-sm text-neutral-500 mb-8">
            {recordingSeconds} / {MAX_RECORDING_SECONDS} 秒
          </p>

          <button
            onClick={stopRecording}
            className="w-full py-3.5 bg-neutral-900 text-white font-bold rounded-xl shadow-md hover:bg-neutral-800 active:scale-95 transition"
          >
            録音を停止する
          </button>
        </div>
      )}

      {/* 4. プレビューフェーズ（再生確認・録り直し） */}
      {phase === "preview" && audioBlobUrl && (
        <div className="w-full flex flex-col items-center pt-4">
          <h3 className="font-bold text-base mb-4">録音した音声を確認</h3>

          <audio src={audioBlobUrl} controls className="w-full mb-6" />

          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={handleSubmit}
              className="w-full py-3.5 bg-neutral-900 text-white font-bold rounded-xl shadow-md hover:bg-neutral-800 active:scale-95 transition"
            >
              この音声で講評してもらう
            </button>
            <button
              onClick={handleRetake}
              className="w-full py-2.5 border border-neutral-300 rounded-xl text-neutral-700 text-sm font-medium hover:bg-neutral-50"
            >
              もう一度録り直す
            </button>
          </div>
        </div>
      )}

      {/* 5. 判定中フェーズ */}
      {phase === "loading" && (
        <div className="w-full py-16 flex flex-col items-center text-center">
          <div className="w-12 h-12 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-bold mb-1">名乗りを鑑定中…</h3>
          <p className="text-xs text-neutral-500">Gemini があなたの音声を講評しています</p>
        </div>
      )}

      {/* 6. 講評結果フェーズ（最低限の機能・デザイン） */}
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
        ※ 録音した音声はAIによる講評にのみ使用し、サーバーには保存されません。
      </p>
    </div>
  );
}
