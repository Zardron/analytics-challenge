import type { NextConfig } from "next";
import { validateEnvironmentVariables } from "./lib/utils/env";

// Validate environment variables at build time
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error("Environment variable validation failed:", error);
  if (process.env.NODE_ENV === "production") {
    throw error; // Fail build in production if env vars are missing
  }
}

const nextConfig: NextConfig = {
  /* config options here */
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
