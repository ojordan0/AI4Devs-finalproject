import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stops `next dev` from writing its own agent instructions into AGENTS.md, which
  // is a link to CLAUDE.md. The project's agent rules are written by hand there.
  agentRules: false,
};

export default nextConfig;
