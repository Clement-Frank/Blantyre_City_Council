import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the Freebuff preview host to load Next dev resources (chunks/HMR).
  // Without this, the dev server blocks cross-origin requests from the
  // tunnelled preview domain with 403, which prevents React from hydrating
  // client pages (e.g. the login form). Wildcard covers future sandbox hosts.
  allowedDevOrigins: ["*.e2b.app", "3000-in0raajj9wxch0pw49xfo.e2b.app"],
};

export default nextConfig;
