// 初心者向け Q&A（③ 詳細 で使う）
//
// 元の文章と出典は docs/content/traditional-arts.md の 4 章。
// 【要確認】の内容は、裏取りが終わるまで入れない。

import type { PerformingArt } from "@/types/api";

export interface Faq {
  id: string;
  question: string;
  answer: string;
  /** 関係する伝統芸能。全部に関係する質問は空の配列 */
  artIds: PerformingArt[];
}

export const faqs: Faq[] = [
  {
    // [V1]（元の文章にあった能の松の例は【要確認】のため外した）
    id: "no-knowledge",
    question: "予備知識がなくても楽しめる？",
    answer:
      "大丈夫です。少しだけ知っておくと、もっと楽しくなります。たとえば歌舞伎なら「バタバタッという音はツケ」など。このアプリで紹介しているポイントを1つ覚えていくだけでもOKです。",
    artIds: [],
  },
  {
    // [V2][S1][S12]
    id: "no-vs-kyogen",
    question: "能と狂言はどう違うの？",
    answer:
      "能は歌と音楽と舞でつくる劇で、霊が出てくるふしぎな話も多いです。狂言はせりふが中心の喜劇で、ふつうの人の失敗を笑いにします。2つあわせて「能楽」と呼びます。",
    artIds: ["nogaku"],
  },
  {
    // [V1][S4]
    id: "kamite-shimote",
    question: "歌舞伎の「上手（かみて）」「下手（しもて）」って？",
    answer: "舞台の右と左の呼び方です。お客さんから見て右が上手、左が下手です。",
    artIds: ["kabuki"],
  },
  {
    // [S6][S7]
    id: "kabuki-men-only",
    question: "なぜ歌舞伎は男性だけで演じるの？",
    answer:
      "はじめは女性も舞台に立っていましたが、江戸時代に禁止されたためです。それから、女性の役も男性が演じるようになりました。",
    artIds: ["kabuki"],
  },
  {
    // [S10][S20]
    id: "bunraku-puppeteers",
    question: "文楽の人形は誰が動かしているの？",
    answer:
      "「人形遣い」と呼ばれる人で、1体を3人で動かします。語る人（太夫）、三味線の人と息を合わせて、人形を本物の人のように動かします。",
    artIds: ["ningyoJoruri"],
  },
];

/** その伝統芸能の詳細画面に出す Q&A（全部に関係する質問も含む） */
export function getFaqsForArt(artId: PerformingArt): Faq[] {
  return faqs.filter((faq) => faq.artIds.length === 0 || faq.artIds.includes(artId));
}
