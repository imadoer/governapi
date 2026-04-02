import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
  {
    apiVersion: "2025-08-27.basil",
  },
);

export async function GET(request: NextRequest) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });

    let monthlyRevenue = 0;
    subscriptions.data.forEach((sub) => {
      if (sub.items.data[0]?.price?.recurring?.interval === "month") {
        monthlyRevenue += sub.items.data[0].price.unit_amount || 0;
      }
    });

    const invoices = await stripe.invoices.list({
      limit: 10,
      status: "paid",
    });

    return NextResponse.json({
      monthlyRevenue: monthlyRevenue / 100,
      activeSubscriptions: subscriptions.data.length,
      overduePayments: 0,
      transactions: invoices.data.map((inv) => ({
        customer: inv.customer_name || inv.customer_email,
        amount: inv.amount_paid / 100,
        status: inv.status,
        date: new Date(inv.created * 1000).toLocaleDateString(),
      })),
    });
  } catch (error) {
    console.error("Revenue API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data" },
      { status: 500 },
    );
  }
}
