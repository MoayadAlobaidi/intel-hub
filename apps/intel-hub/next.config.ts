import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_WORLD_MONITOR_URL: process.env.WORLD_MONITOR_URL ?? "http://localhost:5173",
  },
};

export default nextConfig;
