import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { PerformingArt } from "@/types/api";
import { artOrder, arts } from "@/data/arts";
import { ArtDetail } from "@/components/arts/ArtDetail";

interface ArtPageProps {
  params: Promise<{ artId: string }>;
}

function toArtId(value: string): PerformingArt | null {
  return artOrder.find((id) => id === value) ?? null;
}

export function generateStaticParams() {
  return artOrder.map((artId) => ({ artId }));
}

export async function generateMetadata({ params }: ArtPageProps): Promise<Metadata> {
  const artId = toArtId((await params).artId);
  return artId ? { title: `${arts[artId].name}の見どころと公演` } : {};
}

export default async function ArtPage({ params }: ArtPageProps) {
  const artId = toArtId((await params).artId);
  if (!artId) notFound();
  return <ArtDetail artId={artId} />;
}
