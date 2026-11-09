import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#d8cdba] text-[#2b251f] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#e8e0d1] rounded-3xl p-8 shadow-xl border border-black/10 flex flex-col items-center text-center">
        <span className="text-sm font-bold text-[#196a39] tracking-widest mb-2">
          伝統芸能に出会う Web アプリ
        </span>
        <h1 className="text-3xl font-extrabold mb-3 tracking-wide text-[#2b251f]">
          日本の伝統芸能
        </h1>
        <p className="text-sm text-[#524940] leading-relaxed mb-8">
          能楽、人形浄瑠璃、歌舞伎。
          <br />
          あなたの感性に合う芸能を診断し、
          <br />
          AI と一緒にポーズや発声を体験してみましょう。
        </p>

        <div className="flex flex-col gap-4 w-full">
          <Link
            href="/diagnosis"
            className="w-full py-4 px-6 bg-[#d7a844] hover:bg-[#e4b64e] text-[#221b10] font-bold text-lg rounded-2xl shadow-md transition transform active:scale-95"
          >
            ⛩️ 適性診断を始める
          </Link>

          <Link
            href="/challenge"
            className="w-full py-3.5 px-6 bg-[#f4eee3] hover:bg-white text-[#2b251f] font-bold text-base rounded-2xl border border-black/10 transition"
          >
            🎭 ミニ体験（歌舞伎・能楽・人形浄瑠璃）へ直行
          </Link>
        </div>
      </div>
    </main>
  );
}
