"use client";

import { useEffect } from "react";

/**
 * Last-resort error screen (errors thrown in the root layout or above any
 * route error boundary). Replaces Next's bare "Application error" page and
 * recovers with a FULL reload, because the client router state may be broken.
 * Must render its own <html>/<body> and can't rely on app CSS.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] global error", error);
  }, [error]);

  const button: React.CSSProperties = {
    display: "inline-block",
    minHeight: 44,
    padding: "12px 22px",
    borderRadius: 12,
    fontWeight: 600,
    fontSize: 14,
    textDecoration: "none",
    cursor: "pointer",
  };

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
          padding: 16,
        }}
      >
        <main
          style={{
            maxWidth: 460,
            width: "100%",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: 32,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 20, margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#475569", fontSize: 14, marginTop: 8 }}>
            The page hit an unexpected error. Reloading usually fixes it.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ ...button, border: "none", background: "#f15a29", color: "#fff" }}
            >
              Reload page
            </button>
            <a href="/" style={{ ...button, border: "1px solid #e2e8f0", color: "#0f172a" }}>
              Go to homepage
            </a>
          </div>
          {error?.digest ? (
            <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 20 }}>Reference: {error.digest}</p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
