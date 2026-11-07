import { MieChallenge } from "@/components/challenge/MieChallenge";
import Link from "next/link";

export default function MieChallengePage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900 pb-12">
      {/* 簡易ヘッダー */}
      <header className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
        <Link
          href="/challenge"
          className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
        >
          ← チャレンジ一覧へ
        </Link>
        <span className="text-xs font-semibold text-neutral-500">歌舞伎</span>
      </header>

      {/* チャレンジ本体 */}
      <div className="pt-4">
        <MieChallenge />
      </div>
    </main>
  );
}
