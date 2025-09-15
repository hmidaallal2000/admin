import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Public function to create a reservation
export const createReservation = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    date: v.string(),
    time: v.string(),
    guests: v.number(),
    specialRequests: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate date is not in the past
    const reservationDate = new Date(args.date + 'T' + args.time);
    const now = new Date();
    
    if (reservationDate < now) {
      throw new Error("Cannot make reservations for past dates");
    }

    // Check if restaurant is open (basic validation)
    const hour = parseInt(args.time.split(':')[0]);
    if (hour < 11 || hour > 22) {
      throw new Error("Restaurant is closed at this time. Open hours: 11:00 AM - 10:00 PM");
    }

    // Check table availability (simplified - max 50 guests per time slot)
    const existingReservations = await ctx.db
      .query("reservations")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .filter((q) => q.eq(q.field("time"), args.time))
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .collect();

    const totalGuests = existingReservations.reduce((sum, res) => sum + res.guests, 0);
    
    if (totalGuests + args.guests > 50) {
      throw new Error("No tables available for this time slot");
    }

    const reservationId = await ctx.db.insert("reservations", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });

    return reservationId;
  },
});

// Admin function to list all reservations
export const listReservations = query({
  args: {
    date: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is authenticated admin
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    let reservations;

    if (args.date) {
      reservations = await ctx.db
        .query("reservations")
        .withIndex("by_date", (q) => q.eq("date", args.date!))
        .order("desc")
        .collect();
    } else {
      reservations = await ctx.db.query("reservations").order("desc").collect();
    }

    if (args.status) {
      reservations = reservations.filter(r => r.status === args.status);
    }

    return reservations;
  },
});

// Admin function to update reservation status
export const updateReservationStatus = mutation({
  args: {
    reservationId: v.id("reservations"),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.reservationId, {
      status: args.status,
    });

    return { success: true };
  },
});

// Public function to get available time slots for a date
export const getAvailableTimeSlots = query({
  args: {
    date: v.string(),
    guests: v.number(),
  },
  handler: async (ctx, args) => {
    const timeSlots = [
      "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
      "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
    ];

    const existingReservations = await ctx.db
      .query("reservations")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .filter((q) => q.neq(q.field("status"), "cancelled"))
      .collect();

    const availableSlots = [];

    for (const time of timeSlots) {
      const slotReservations = existingReservations.filter(r => r.time === time);
      const totalGuests = slotReservations.reduce((sum, res) => sum + res.guests, 0);
      
      if (totalGuests + args.guests <= 50) {
        availableSlots.push(time);
      }
    }

    return availableSlots;
  },
});
