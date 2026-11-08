import Link from "next/link";

export default function ChallengeIndexPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-900 p-4 flex flex-col items-center">
      <div className="w-full max-w-md pt-8">
        <h1 className="text-xl font-bold text-center mb-6">ミニ体験</h1>

        <div className="flex flex-col gap-3">
          {/* 見得チャレンジ（歌舞伎） */}
          <Link
            href="/challenge/mie"
            className="w-full py-4 px-5 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-medium text-center transition"
          >
            見得チャレンジ（歌舞伎）
          </Link>

          {/* 名乗りチャレンジ（文楽） */}
          <Link
            href="/challenge/nanori"
            className="w-full py-4 px-5 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-medium text-center transition"
          >
            名乗りチャレンジ（文楽）
          </Link>

          {/* 人形浄瑠璃チャレンジ（ひとり三人遣い） */}
          <Link
            href="/challenge/ningyo-joruri"
            className="w-full py-4 px-5 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-medium text-center transition"
          >
            ひとり三人遣いチャレンジ（人形浄瑠璃）
          </Link>
        </div>
      </div>
    </main>
  );
}
