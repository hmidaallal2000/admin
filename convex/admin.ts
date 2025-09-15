import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get dashboard statistics
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Get reservations stats
    const allReservations = await ctx.db.query("reservations").collect();
    const todayReservations = allReservations.filter(r => r.date === today);
    
    // Get contact messages stats
    const allMessages = await ctx.db.query("contactMessages").collect();
    const newMessages = allMessages.filter(m => m.status === "new");

    // Get menu items stats
    const allMenuItems = await ctx.db.query("menuItems").collect();
    const availableItems = allMenuItems.filter(m => m.available);

    return {
      reservations: {
        total: allReservations.length,
        today: todayReservations.length,
        pending: allReservations.filter(r => r.status === "pending").length,
        confirmed: allReservations.filter(r => r.status === "confirmed").length,
      },
      messages: {
        total: allMessages.length,
        new: newMessages.length,
        read: allMessages.filter(m => m.status === "read").length,
        replied: allMessages.filter(m => m.status === "replied").length,
      },
      menu: {
        total: allMenuItems.length,
        available: availableItems.length,
        unavailable: allMenuItems.length - availableItems.length,
      },
    };
  },
});

// Get recent activity
export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get recent reservations (last 10)
    const recentReservations = await ctx.db
      .query("reservations")
      .order("desc")
      .take(5);

    // Get recent messages (last 5)
    const recentMessages = await ctx.db
      .query("contactMessages")
      .order("desc")
      .take(5);

    return {
      reservations: recentReservations,
      messages: recentMessages,
    };
  },
});

// Restaurant settings management
export const getRestaurantSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const settings = await ctx.db.query("restaurantSettings").collect();
    
    // Convert to key-value object
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    // Set defaults if not exists
    const defaults = {
      restaurantName: "Amandier Restaurant",
      phone: "+1 (555) 123-4567",
      email: "info@amandier.com",
      address: "123 Main Street, City, State 12345",
      openingHours: "11:00 AM - 10:00 PM",
      maxCapacity: "50",
    };

    return { ...defaults, ...settingsObj };
  },
});

export const updateRestaurantSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check if setting exists
    const existing = await ctx.db
      .query("restaurantSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("restaurantSettings", {
        key: args.key,
        value: args.value,
      });
    }

    return { success: true };
  },
});
