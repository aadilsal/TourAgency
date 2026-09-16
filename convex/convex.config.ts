import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";

const app = defineApp();
// Throttles public, unauthenticated writes (contact / newsletter leads).
app.use(rateLimiter);

export default app;
