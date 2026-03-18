import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 警告：在生产环境中应该修复所有TypeScript错误
    ignoreBuildErrors: true,
  },
  // 启用服务器组件外部包
  serverExternalPackages: ["openai", "axios"],
};

export default nextConfig;
