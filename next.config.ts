import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* The prior Admin tabs became Students and Overview (#82, #84). */
  async redirects() {
    return ["learners", "knowledge", "engagement", "certificates"].map((old) => ({
      source: `/admin/${old}`,
      destination: old === "learners" ? "/admin/students" : "/admin",
      permanent: false,
    }));
  },
};

export default nextConfig;
