import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_WORLD_MONITOR_URL: process.env.WORLD_MONITOR_URL,
    NEXT_PUBLIC_DELTA_INTEL_URL: process.env.DELTA_INTEL_URL,
  },
};

export default nextConfig;
