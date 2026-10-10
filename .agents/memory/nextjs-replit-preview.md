---
name: Next.js on Replit preview
description: Next.js development-server cross-origin rules for proxied Replit previews.
---

For Next.js dev servers viewed through Replit's proxy, allow the proxied development host in `allowedDevOrigins`; otherwise Next.js blocks `/_next/hmr` requests with 502 responses.

**Why:** The standard localhost allowlist did not cover the Replit preview domain, so the app rendered but hot reload failed and produced browser errors.

**How to apply:** In development, use `REPLIT_DEV_DOMAIN` when available and a Replit-domain wildcard fallback otherwise. Keep this limited to `allowedDevOrigins`; production does not need this development-only setting.
