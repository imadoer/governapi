import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { validateApiRequest } from "../../../../utils/auth-middleware";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  // Initialize Stripe inside handler
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });

  // Validate authentication first
  const authCheck = await validateApiRequest(request);
  if (!authCheck.valid) {
    return authCheck.response;
  }

  // Check if user has admin role
  if (authCheck.user?.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    // Rest of the function - need to see more
    const balance = await stripe.balance.retrieve();
    return NextResponse.json({ balance });
  } catch (error) {
    logger.error("Revenue fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue" },
      { status: 500 }
    );
  }
}
