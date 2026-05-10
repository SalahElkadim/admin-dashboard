// ─────────────────────────────────────────────────────────────
// src/services/onesignal.js
//
// Works with the OneSignal v16 CDN snippet (no npm package needed).
// SETUP:
//   1. Paste the OneSignal <script> block into public/index.html
//      (replace the appId / safari_web_id with yours — already done)
//   2. Create public/OneSignalSDKWorker.js with ONE line:
//         importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
//   3. Import this file and call initOneSignal() after login.
// ─────────────────────────────────────────────────────────────

import axiosInstance from "../api/axiosInstance"; // your existing axios with JWT

// ── Helpers ───────────────────────────────────────────────────

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
    const sub = os.User?.PushSubscription;
    if (!sub) return;

    let playerId = sub.id;

    if (!playerId) {
      await new Promise((res) => setTimeout(res, 3000));
      playerId = os.User?.PushSubscription?.id;
    }

    if (!playerId) {
      console.warn("[OneSignal] no player ID found");
      return;
    }

    await axiosInstance.post("/push/register/", {
      player_id: playerId,
    });
    console.info("[OneSignal] device registered:", playerId.slice(0, 8) + "…");
  } catch (err) {
    console.warn("[OneSignal] registration failed:", err);
  }
}

// ── Public API ────────────────────────────────────────────────

let _ready = false;

export async function initOneSignal() {
  console.log("[DEBUG] initOneSignal called, _ready=", _ready);
  if (_ready) return;
  _ready = true;

  const os = await waitForOneSignal();
  console.log("[DEBUG] os loaded=", os ? "✅" : "❌ null");
  if (!os) {
    console.warn("[OneSignal] SDK did not load in time.");
    return;
  }

  const isSubscribed = os.User?.PushSubscription?.optedIn;
  const playerId = os.User?.PushSubscription?.id;
  console.log("[DEBUG] optedIn=", isSubscribed, "| playerId=", playerId);

  // v16: listen for subscription changes
  os.User?.PushSubscription?.addEventListener("change", async (event) => {
    console.log("[DEBUG] subscription changed:", event.current);
    if (event.current?.optedIn) {
      await _registerDevice(os);
    }
  });

  // ← التعديل هنا: سجل الـ device لو عنده playerId حتى لو optedIn = false
  if (isSubscribed || playerId) {
    console.log("[DEBUG] has playerId or subscribed, registering device...");
    await _registerDevice(os);
  } else {
    console.log(
      "[DEBUG] not subscribed yet — user needs to enable notifications"
    );
  }
}

export async function requestPermission() {
  const os = await waitForOneSignal();
  if (!os) return;
  try {
    await os.Notifications.requestPermission();
  } catch (err) {
    console.warn("[OneSignal] permission request failed:", err);
  }
}

export async function unsubscribe() {
  const os = await waitForOneSignal();
  if (!os) return;
  try {
    const playerId = os.User?.PushSubscription?.id;
    await os.User?.PushSubscription?.optOut();
    if (playerId) {
      await axiosInstance.post("/push/unregister/", {
        player_id: playerId,
      });
    }
  } catch (err) {
    console.warn("[OneSignal] unsubscribe failed:", err);
  }
}

export async function getPermissionState() {
  const os = await waitForOneSignal();
  if (!os) return "default";
  try {
    return os.Notifications.permissionNative ?? "default";
  } catch {
    return "default";
  }
}

export async function isSubscribed() {
  const os = await waitForOneSignal();
  if (!os) return false;
  return os.User?.PushSubscription?.optedIn ?? false;
}
