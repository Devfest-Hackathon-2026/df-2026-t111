// ③ 詳細・④ 行きたい の共通の枠（ミニ体験の画面と同じ、定式幕のヘッダーと金色の帯）

import type { ReactNode } from "react";

export function StagePage({
  title,
  band,
  children,
}: {
  title: string;
  /** ヘッダーの下の金色の帯に出すひとこと */
  band: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-[#d9cfb6] text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Yuji+Syuku&display=swap');

        *, :root, body, main, button, input, select, textarea, p, h1, h2, h3, h4, span, div, a, li {
          font-family: "Yuji Syuku", serif !important;
        }
      `}</style>

      <header
        className="w-full py-5 text-center shadow-md relative"
        style={{
          background:
            "repeating-linear-gradient(90deg, #017824 0px, #017824 28px, #D5512A 28px, #D5512A 56px, #1a1a1a 56px, #1a1a1a 84px)",
        }}
      >
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-widest inline-block px-4 py-1">
          {title}
        </h1>
      </header>

      <div className="w-full bg-[#DDB442] py-2.5 px-4 text-center shadow-xs">
        <p className="text-base md:text-lg text-black tracking-wider">{band}</p>
      </div>

      <div className="w-full max-w-lg mx-auto px-5 md:px-8 pt-6 pb-12">{children}</div>
    </main>
  );
}

/** 見出しつきのまとまり */
export function StageSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="text-2xl font-extrabold text-[#2a241e] border-l-8 border-[#D5512A] pl-3 mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** 緑の丸がつくリンク（ミニ体験の結果画面の「選択画面へ」と同じ形） */
export function ArrowLabel({ label, back = false }: { label: string; back?: boolean }) {
  const circle = (
    <span className="w-7 h-7 rounded-full bg-[#017824] text-white flex items-center justify-center text-xs shrink-0">
      {back ? "◀" : "▶"}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-2 text-base md:text-lg font-bold text-[#2a241e]">
      {back && circle}
      <span>{label}</span>
      {!back && circle}
    </span>
  );
}
