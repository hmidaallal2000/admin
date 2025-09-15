import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight requests
http.route({
  path: "/api/reservations",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 200, headers: corsHeaders });
  }),
});

http.route({
  path: "/api/menu",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 200, headers: corsHeaders });
  }),
});

http.route({
  path: "/api/contact",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 200, headers: corsHeaders });
  }),
});

// Public API endpoints for frontend integration

// Create reservation endpoint
http.route({
  path: "/api/reservations",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      
      const reservationId = await ctx.runMutation(api.reservations.createReservation, {
        name: body.name,
        email: body.email,
        phone: body.phone,
        date: body.date,
        time: body.time,
        guests: parseInt(body.guests),
        specialRequests: body.specialRequests,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          reservationId,
          message: "Reservation created successfully" 
        }),
        { 
          status: 201, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
  }),
});

// Get available time slots
http.route({
  path: "/api/reservations/availability",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const date = url.searchParams.get("date");
      const guests = url.searchParams.get("guests");

      if (!date || !guests) {
        throw new Error("Date and guests parameters are required");
      }

      const timeSlots = await ctx.runQuery(api.reservations.getAvailableTimeSlots, {
        date,
        guests: parseInt(guests),
      });

      return new Response(
        JSON.stringify({ success: true, timeSlots }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
  }),
});

// Get menu items
http.route({
  path: "/api/menu",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const category = url.searchParams.get("category");
      const availableOnly = url.searchParams.get("availableOnly") === "true";

      const menuItems = await ctx.runQuery(api.menu.getMenuItems, {
        category: category || undefined,
        availableOnly,
      });

      return new Response(
        JSON.stringify({ success: true, menuItems }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
  }),
});

// Get menu categories
http.route({
  path: "/api/menu/categories",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const categories = await ctx.runQuery(api.menu.getMenuCategories, {});

      return new Response(
        JSON.stringify({ success: true, categories }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
  }),
});

// Submit contact form
http.route({
  path: "/api/contact",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      
      const messageId = await ctx.runMutation(api.contact.submitContactForm, {
        name: body.name,
        email: body.email,
        phone: body.phone,
        subject: body.subject,
        message: body.message,
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId,
          message: "Message sent successfully" 
        }),
        { 
          status: 201, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }
  }),
});

export default http;
