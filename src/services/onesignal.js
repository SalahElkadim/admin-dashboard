// ─────────────────────────────────────────────────────────────
// src/services/onesignal.js
//
// Works with the OneSignal v16 CDN snippet (no npm package needed).
//
// SETUP:
//   1. Paste the OneSignal <script> block into public/index.html
//      (replace the appId / safari_web_id with yours — already done)
//   2. Create public/OneSignalSDKWorker.js with ONE line:
//         importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
//   3. Import this file and call initOneSignal() after login.
// ─────────────────────────────────────────────────────────────

import axiosInstance from "./axiosInstance"; // your existing axios with JWT

// ── Helpers ───────────────────────────────────────────────────

/**
 * Wait for the OneSignal SDK to finish loading.
 * Returns the OneSignal instance or null if it never loads.
 */
function waitForOneSignal(timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (window.OneSignal?.User) {
      return resolve(window.OneSignal);
    }

    const deadline = Date.now() + timeoutMs;

    const check = () => {
      if (window.OneSignal?.User) return resolve(window.OneSignal);
      if (Date.now() > deadline) return resolve(null);
      setTimeout(check, 200);
    };

    // Use OneSignalDeferred if the SDK hasn't run yet
    if (Array.isArray(window.OneSignalDeferred)) {
      window.OneSignalDeferred.push((os) => resolve(os));
    } else {
      check();
    }
  });
}

// ── Internal: register player_id with our backend ─────────────

async function _registerDevice(os) {
  try {
    // v16 SDK: player ID lives at OneSignal.User.PushSubscription.id
    const sub = os.User?.PushSubscription;
    if (!sub) return;

    // id might be null while the subscription is being set up
    let playerId = sub.id;
    if (!playerId) {
      // wait up to 3 s for it to appear
      await new Promise((res) => setTimeout(res, 3000));
      playerId = os.User?.PushSubscription?.id;
    }

    if (!playerId) return;

    await axiosInstance.post("/api/admin/push/register/", {
      player_id: playerId,
    });
    console.info("[OneSignal] device registered:", playerId.slice(0, 8) + "…");
  } catch (err) {
    console.warn("[OneSignal] registration failed:", err);
  }
}

// ── Public API ────────────────────────────────────────────────

let _ready = false;

/**
 * Call this once after the user logs in.
 * Initialisation already happened via the <script> in index.html,
 * so here we just wire up the subscription listener + sync state.
 */
export async function initOneSignal() {
  if (_ready) return;
  _ready = true;

  const os = await waitForOneSignal();
  if (!os) {
    console.warn("[OneSignal] SDK did not load in time.");
    return;
  }

  // v16: listen for subscription changes
  os.User?.PushSubscription?.addEventListener("change", async (event) => {
    if (event.current?.isSubscribed) {
      await _registerDevice(os);
    }
  });

  // Already subscribed from a previous session → sync immediately
  const isSubscribed = os.User?.PushSubscription?.isSubscribed;
  if (isSubscribed) {
    await _registerDevice(os);
  }
}

/**
 * Show the browser's native permission prompt.
 * Attach this to your "Enable notifications" button.
 */
export async function requestPermission() {
  const os = await waitForOneSignal();
  if (!os) return;
  try {
    // v16 API
    await os.Notifications.requestPermission();
  } catch (err) {
    console.warn("[OneSignal] permission request failed:", err);
  }
}

/**
 * Unsubscribe this device and notify the backend.
 */
export async function unsubscribe() {
  const os = await waitForOneSignal();
  if (!os) return;
  try {
    const playerId = os.User?.PushSubscription?.id;
    await os.User?.PushSubscription?.optOut();
    if (playerId) {
      await axiosInstance.post("/api/admin/push/unregister/", {
        player_id: playerId,
      });
    }
  } catch (err) {
    console.warn("[OneSignal] unsubscribe failed:", err);
  }
}

/**
 * Returns: 'granted' | 'denied' | 'default'
 */
export async function getPermissionState() {
  const os = await waitForOneSignal();
  if (!os) return "default";
  try {
    // v16: Notification.permission is a standard browser value
    return os.Notifications.permissionNative ?? "default";
  } catch {
    return "default";
  }
}

/**
 * Returns true if the current device is actively subscribed.
 */
export async function isSubscribed() {
  const os = await waitForOneSignal();
  if (!os) return false;
  return os.User?.PushSubscription?.isSubscribed ?? false;
}
