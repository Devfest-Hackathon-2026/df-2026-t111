import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run 向けに最小構成でビルドする
  output: "standalone",
  // next dev が AGENTS.md にブロックを自動追記しないようにする
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
