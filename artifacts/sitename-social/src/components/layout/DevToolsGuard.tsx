"use client";

import { useEffect } from "react";
import { useIsAdmin } from "@/components/report/useIsAdmin";

// On a computer the developer-tools keys (F12, Ctrl+Shift+I/J/C, Ctrl+U; Cmd+Option+I/J/C, Cmd+U on a Mac) do nothing for
// ordinary visitors; the owner and the moderators keep them. This only stops the keys: the browser menu can still open the tools.
export function DevToolsGuard() {
  const admin = useIsAdmin();
  useEffect(() => {
    if (admin === true) return;
    const stop = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const mod = event.ctrlKey || event.metaKey;
      const blocked = event.key === "F12"
        || (mod && (event.shiftKey || event.altKey) && (key === "i" || key === "j" || key === "c"))
        || (mod && !event.shiftKey && key === "u");
      if (!blocked) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("keydown", stop, true);
    return () => window.removeEventListener("keydown", stop, true);
  }, [admin]);
  return null;
}
