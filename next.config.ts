import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.1.210','10.164.173.171','10.240.21.171'],
  experimental: {
    // React <ViewTransition> for smooth page-content crossfades + the animated
    // bottom-nav indicator (see the dashboard layout + globals.css).
    viewTransition: true,
  },
};

export default nextConfig;
