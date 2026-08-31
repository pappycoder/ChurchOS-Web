import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Note: This is only an option in the webpack plugin. In the Vite plugin,
  // you can pass `process.env.NODE_ENV === 'production'` instead.
  disable: process.env.NODE_ENV === "development",
  // Note: This is an option that only works for the webpack plugin.
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  register: true,
});

const nextConfig: NextConfig = withSerwist({
  /* config options here */
});

export default nextConfig;
