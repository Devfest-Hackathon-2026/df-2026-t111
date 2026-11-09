import Link from "next/link";

export default function ChallengeSelectPage() {
  return (
    <main className="min-h-dvh bg-[#d9cfb6] text-black flex flex-col items-center py-10 px-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap');

        *, :root, body, main, button, input, select, textarea, p, h1, h2, h3, h4, span, div, a, li {
          font-family: "Yuji Syuku", serif !important;
        }

        /* 文字色を #DDB442 に指定し、綺麗な太いフチを設定 */
        .title-gold {
          color: #DDB442;
          -webkit-text-stroke: 4px #1a1a1a;
          paint-order: stroke fill;
        }
      `}</style>

      {/* タイトルと細い下線 */}
      <div className="w-full max-w-xs flex flex-col items-center mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold title-gold tracking-widest mb-3">
          ミニ体験
        </h1>
        <div className="w-full h-[1.5px] bg-[#2a241e]" />
      </div>

      {/* 選択肢リスト */}
      <div className="w-full max-w-xs flex flex-col items-center gap-8">
        {/* 歌舞伎 */}
        <div className="w-full flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold text-[#2a241e] tracking-wide">歌舞伎</h2>
          <Link
            href="/challenge/mie"
            className="w-full py-3.5 px-6 bg-[#D5512A] hover:bg-[#c24522] text-white font-extrabold text-xl rounded-xl border-2 border-[#2a241e] transition-all transform hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] text-center"
          >
            見得チャレンジ
          </Link>
        </div>

        {/* 能楽 */}
        <div className="w-full flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold text-[#2a241e] tracking-wide">能楽</h2>
          <Link
            href="/challenge/nanori"
            className="w-full py-3.5 px-6 bg-[#D5512A] hover:bg-[#c24522] text-white font-extrabold text-xl rounded-xl border-2 border-[#2a241e] transition-all transform hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] text-center"
          >
            名乗りチャレンジ
          </Link>
        </div>

        {/* 人形浄瑠璃 */}
        <div className="w-full flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold text-[#2a241e] tracking-wide">人形浄瑠璃</h2>
          <Link
            href="/challenge/ningyo-joruri"
            className="w-full py-3.5 px-6 bg-[#D5512A] hover:bg-[#c24522] text-white font-extrabold text-xl rounded-xl border-2 border-[#2a241e] transition-all transform hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] text-center"
          >
            ひとり三人遣い
          </Link>
        </div>
      </div>
    </main>
  );
}
