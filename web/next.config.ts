import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 开发期代理 /api/* -> FastAPI，避免跨域；生产由部署层反代
  async rewrites() {
    return [{ source: "/api/:path*", destination: "http://localhost:8000/api/:path*" }];
  },
};

export default nextConfig;
