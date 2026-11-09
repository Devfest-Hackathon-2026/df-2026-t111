import type { Metadata } from "next";
import { WishlistScreen } from "@/components/wishlist/WishlistScreen";

export const metadata: Metadata = {
  title: "行きたいリスト",
};

export default function WishlistPage() {
  return <WishlistScreen />;
}
