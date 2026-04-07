import type { AuthConfig } from "convex/server";

/** Custom JWT disabled — user identity uses session tokens on individual functions. */
export default {
  providers: [],
} satisfies AuthConfig;
