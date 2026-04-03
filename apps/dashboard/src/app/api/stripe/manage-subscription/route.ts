import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { validateApiRequest } from "../../../../utils/auth-middleware";
import { database } from "../../../../infrastructure/database";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  // Initialize Stripe inside handler
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-08-27.basil",
  });

  // Validate authentication first
  const authCheck = await validateApiRequest(request);
  if (!authCheck.valid) {
    return authCheck.response;
  }

  try {
    const { action, subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID required" },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'cancel':
        result = await stripe.subscriptions.cancel(subscriptionId);
        break;
      case 'pause':
        result = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: { behavior: 'mark_uncollectible' }
        });
        break;
      case 'resume':
        result = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: null
        });
        break;
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, subscription: result });
  } catch (error) {
    logger.error("Subscription management error:", error);
    return NextResponse.json(
      { error: "Failed to manage subscription" },
      { status: 500 }
    );
  }
}
