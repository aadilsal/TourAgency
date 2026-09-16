<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

**Before changing admin screens or Convex mutations, follow the "Data-safety
rules" in `AGENTS.md`** (single live Convex deployment, patch-only-sent-fields,
shared editor hooks). Each rule there comes from a real client data-loss bug.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
