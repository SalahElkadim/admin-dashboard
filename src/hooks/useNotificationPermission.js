// ─────────────────────────────────────────────────────────────
// src/hooks/useNotificationPermission.js
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  initOneSignal,
  requestPermission,
  unsubscribe,
  getPermissionState,
  isSubscribed as checkIsSubscribed,
} from "../services/onesignal";

/**
 * Returns:
 *   state   — 'granted' | 'denied' | 'default'
 *   active  — true when this device is actually receiving pushes
 *   toggle  — enable/disable notifications
 *   loading — async operation in progress
 */
export function useNotificationPermission() {
  const [state,   setState]   = useState("default");
  const [active,  setActive]  = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function setup() {
      await initOneSignal();
      const [perm, sub] = await Promise.all([
        getPermissionState(),
        checkIsSubscribed(),
      ]);
      if (alive) {
        setState(perm);
        setActive(sub);
        setLoading(false);
      }
    }

    setup();
    return () => { alive = false; };
  }, []);

  const toggle = useCallback(async () => {
    setLoading(true);
    try {
      if (active) {
        await unsubscribe();
        setActive(false);
        setState(await getPermissionState());
      } else {
        await requestPermission();
        const [perm, sub] = await Promise.all([
          getPermissionState(),
          checkIsSubscribed(),
        ]);
        setState(perm);
        setActive(sub);
      }
    } finally {
      setLoading(false);
    }
  }, [active]);

  return { state, active, toggle, loading };
}




// ─────────────────────────────────────────────────────────────
// HOW TO WIRE IT ALL TOGETHER
//
// 1. After a successful login, call initOneSignal():
//
//    // src/store/authSlice.js or your login handler
//    import { initOneSignal } from "../services/onesignal";
//
//    // inside your loginUser thunk, after dispatch(setUser(...)):
//    initOneSignal();  // fire-and-forget, no await needed
//
//
// 2. Add the toggle to your navbar:
//
//    import NotificationToggle from "../components/NotificationToggle";
//
//    <nav>
//      ...
//      <NotificationToggle />
//      ...
//    </nav>
//
//
// 3. On logout, optionally unsubscribe the device:
//
//    import { unsubscribe } from "../services/onesignal";
//
//    // inside your logoutUser thunk:
//    await unsubscribe();
//    dispatch(clearUser());
// ─────────────────────────────────────────────────────────────