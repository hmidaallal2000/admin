import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Public function to submit contact form
export const submitContactForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("contactMessages", {
      ...args,
      status: "new",
      createdAt: Date.now(),
    });

    return messageId;
  },
});

// Admin function to get all contact messages
export const getContactMessages = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    if (args.status) {
      const messages = await ctx.db
        .query("contactMessages")
        .withIndex("by_status", (q) => q.eq("status", args.status as "new" | "read" | "replied"))
        .order("desc")
        .collect();
      return messages;
    }

    const messages = await ctx.db.query("contactMessages").order("desc").collect();
    return messages;
  },
});

// Admin function to update message status
export const updateMessageStatus = mutation({
  args: {
    messageId: v.id("contactMessages"),
    status: v.union(v.literal("new"), v.literal("read"), v.literal("replied")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.messageId, {
      status: args.status,
    });

    return { success: true };
  },
});

// Admin function to get message statistics
export const getMessageStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const messages = await ctx.db.query("contactMessages").collect();
    
    const stats = {
      total: messages.length,
      new: messages.filter(m => m.status === "new").length,
      read: messages.filter(m => m.status === "read").length,
      replied: messages.filter(m => m.status === "replied").length,
    };

    return stats;
  },
});
