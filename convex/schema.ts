import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Reservations table
  reservations: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    date: v.string(), // YYYY-MM-DD format
    time: v.string(), // HH:MM format
    guests: v.number(),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled")),
    specialRequests: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  // Menu items table
  menuItems: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(), // appetizers, mains, desserts, beverages
    imageUrl: v.optional(v.string()),
    available: v.boolean(),
    allergens: v.optional(v.array(v.string())),
    isSpecial: v.optional(v.boolean()),
  })
    .index("by_category", ["category"])
    .index("by_available", ["available"]),

  // Contact messages table
  contactMessages: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
    status: v.union(v.literal("new"), v.literal("read"), v.literal("replied")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_email", ["email"]),

  // Restaurant settings
  restaurantSettings: defineTable({
    key: v.string(),
    value: v.string(),
  })
    .index("by_key", ["key"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
