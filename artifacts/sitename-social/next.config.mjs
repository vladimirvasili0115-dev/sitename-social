/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  allowedDevOrigins: [process.env.REPLIT_DEV_DOMAIN ?? "**.replit.dev", "127.0.0.1"],
  devIndicators: false,
  agentRules: false,
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
