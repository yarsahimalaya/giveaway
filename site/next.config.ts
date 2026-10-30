import type { NextConfig } from "next";

// Static export only: `next build` writes plain HTML/JS/CSS to `out/` for Cloudflare Pages.
// Don't add API routes, server actions, middleware or anything else that needs a server.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
