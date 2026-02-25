import { create } from "zustand";
import { getUnreadCount } from "../api/notificationsApi";

const useNotificationStore = create((set) => ({
  unreadCount: 0,

  fetchUnreadCount: async () => {
    try {
      const { data } = await getUnreadCount();
      if (data.success) set({ unreadCount: data.data.unread_count });
    } catch {
      /* silent */
    }
  },

  decrementUnread: (amount = 1) =>
    set((s) => ({ unreadCount: Math.max(0, s.unreadCount - amount) })),

  resetUnread: () => set({ unreadCount: 0 }),
}));

export default useNotificationStore;
