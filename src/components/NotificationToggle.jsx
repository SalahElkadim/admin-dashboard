// ─────────────────────────────────────────────────────────────
// src/components/NotificationToggle.jsx
//
// Drop anywhere in your navbar / settings page.
// ─────────────────────────────────────────────────────────────

import React from "react";
import { useNotificationPermission } from "../hooks/useNotificationPermission";

export default function NotificationToggle() {
  const { state, active, toggle, loading } = useNotificationPermission();

  // Browser permanently blocked — tell the user to go to browser settings
  if (state === "denied") {
    return (
      <span
        title="Notifications blocked — please allow them in your browser settings"
        style={styles.denied}
      >
        🔕
      </span>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={
        active ? "Disable push notifications" : "Enable push notifications"
      }
      style={{ ...styles.btn, opacity: loading ? 0.5 : 1 }}
      aria-label={
        active ? "Disable push notifications" : "Enable push notifications"
      }
    >
      {loading ? "⏳" : active ? "🔔" : "🔕"}
    </button>
  );
}

const styles = {
  btn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    padding: "4px 8px",
    borderRadius: 6,
    transition: "opacity 0.2s",
  },
  denied: {
    fontSize: 18,
    opacity: 0.35,
    cursor: "help",
    padding: "4px 8px",
  },
};
