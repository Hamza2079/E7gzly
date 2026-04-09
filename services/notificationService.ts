import { supabase } from "@/lib/supabase/client";

/**
 * Notification service — fetch and manage user notifications.
 */
export const notificationService = {
  async getNotifications(userId: string, unreadOnly = false) {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (unreadOnly) query = query.eq("is_read", false);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw error;
  },
};
