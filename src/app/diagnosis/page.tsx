import type { Metadata } from "next";
import { DiagnosisScreen } from "@/components/diagnosis/DiagnosisScreen";

export const metadata: Metadata = {
  title: "日本三大芸能 適性診断 - 能・文楽・歌舞伎",
  description:
    "簡単な7つの質問に答えるだけで、あなたの感性に最も合う伝統芸能（能・狂言、人形浄瑠璃文楽、歌舞伎）をご提案します。",
};

export default function DiagnosisPage() {
  return <DiagnosisScreen />;
}
