/**
 * Navigate to the billing page in the dashboard where users can
 * compare plans side-by-side before choosing Stripe Checkout.
 */
export function goToBilling(planHint?: "starter" | "professional") {
  const url = planHint ? `/dashboard?view=billing&highlight=${planHint}` : "/dashboard?view=billing";
  window.location.href = url;
}

/**
 * Direct Stripe Checkout — only called from the billing page itself
 * after the user has compared plans and clicked "Subscribe".
 */
export async function redirectToCheckout(planKey: "starter" | "professional") {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("sessionToken") : null;
  if (!token) {
    window.location.href = "/login";
    return;
  }

  try {
    const res = await fetch("/api/billing/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify({ planKey }),
    });

    const data = await res.json();
    const url = data?.url || data?.checkout?.url;

    if (url) {
      window.location.href = url;
    } else {
      alert(data.error || "Failed to start checkout. Please try again.");
    }
  } catch {
    alert("Failed to connect to billing. Please try again.");
  }
}
