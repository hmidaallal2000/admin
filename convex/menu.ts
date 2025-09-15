import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Public function to get all menu items
export const getMenuItems = query({
  args: {
    category: v.optional(v.string()),
    availableOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let items;

    if (args.category) {
      items = await ctx.db
        .query("menuItems")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      items = await ctx.db.query("menuItems").collect();
    }

    if (args.availableOnly) {
      items = items.filter(item => item.available);
    }

    return items.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// Public function to get menu categories
export const getMenuCategories = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("menuItems").collect();
    const categories = [...new Set(items.map(item => item.category))];
    return categories.sort();
  },
});

// Admin function to create menu item
export const createMenuItem = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    imageUrl: v.optional(v.string()),
    allergens: v.optional(v.array(v.string())),
    isSpecial: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const itemId = await ctx.db.insert("menuItems", {
      ...args,
      available: true,
    });

    return itemId;
  },
});

// Admin function to update menu item
export const updateMenuItem = mutation({
  args: {
    itemId: v.id("menuItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    available: v.optional(v.boolean()),
    allergens: v.optional(v.array(v.string())),
    isSpecial: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const { itemId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(itemId, cleanUpdates);

    return { success: true };
  },
});

// Admin function to delete menu item
export const deleteMenuItem = mutation({
  args: {
    itemId: v.id("menuItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.itemId);

    return { success: true };
  },
});

// Admin function to toggle item availability
export const toggleItemAvailability = mutation({
  args: {
    itemId: v.id("menuItems"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Menu item not found");
    }

    await ctx.db.patch(args.itemId, {
      available: !item.available,
    });

    return { success: true, available: !item.available };
  },
});
