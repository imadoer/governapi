import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function POST(request: NextRequest) {
  const adminId = request.headers.get("x-admin-id");
  const adminRole = request.headers.get("x-admin-role");

  if (!adminId || adminRole !== "admin") {
    return NextResponse.json(
      { error: "Admin authentication required" },
      { status: 401 },
    );
  }

  try {
    const { tenantId, reason, blocked = true } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    if (blocked && !reason) {
      return NextResponse.json(
        { error: "Reason is required when blocking a customer" },
        { status: 400 },
      );
    }

    // Verify customer exists
    const customer = await database.queryOne(
      "SELECT id, company_name, subscription_status FROM companies WHERE id = $1",
      [tenantId],
    );

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Update customer block status
    const updatedCustomer = await database.queryOne(
      `UPDATE companies 
       SET is_blocked = $1, 
           blocked_reason = $2, 
           blocked_at = $3,
           blocked_by = $4,
           updated_at = NOW()
       WHERE id = $5 
       RETURNING *`,
      [
        blocked,
        blocked ? reason : null,
        blocked ? new Date().toISOString() : null,
        adminId,
        tenantId,
      ],
    );

    // Log admin action
    await database.query(
      `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        adminId,
        blocked ? "BLOCK_CUSTOMER" : "UNBLOCK_CUSTOMER",
        "customer",
        tenantId,
        JSON.stringify({
          companyName: customer.company_name,
          reason: reason || null,
          previousStatus: customer.subscription_status,
        }),
      ],
    );

    if (blocked) {
      // Disable all active sessions for blocked customer
      await database.query(
        "UPDATE user_sessions SET expires_at = NOW() WHERE user_id IN (SELECT id FROM users WHERE company_id = $1)",
        [tenantId],
      );

      // Disable API keys
      await database.query(
        "UPDATE api_keys SET is_active = false WHERE customer_email IN (SELECT email FROM users WHERE company_id = $1)",
        [tenantId],
      );

      // Cancel active scans
      await database.query(
        "UPDATE scheduled_scans SET is_active = false WHERE tenant_id = $1",
        [tenantId],
      );
    } else {
      // Re-enable API keys if unblocking
      await database.query(
        "UPDATE api_keys SET is_active = true WHERE customer_email IN (SELECT email FROM users WHERE company_id = $1)",
        [tenantId],
      );
    }

    // Get updated customer data with user count
    const customerData = await database.queryOne(
      `SELECT c.*, COUNT(u.id) as user_count
       FROM companies c
       LEFT JOIN users u ON c.id = u.company_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [tenantId],
    );

    return NextResponse.json({
      success: true,
      customer: {
        id: customerData.id,
        companyName: customerData.company_name,
        subscriptionPlan: customerData.subscription_plan,
        subscriptionStatus: customerData.subscription_status,
        isBlocked: customerData.is_blocked,
        blockedReason: customerData.blocked_reason,
        blockedAt: customerData.blocked_at,
        blockedBy: customerData.blocked_by,
        userCount: parseInt(customerData.user_count || "0"),
        createdAt: customerData.created_at,
      },
      message: blocked
        ? `Customer ${customer.company_name} has been blocked successfully`
        : `Customer ${customer.company_name} has been unblocked successfully`,
    });
  } catch (error) {
    logger.error("Admin block customer error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to update customer block status" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const adminId = request.headers.get("x-admin-id");
  const adminRole = request.headers.get("x-admin-role");

  if (!adminId || adminRole !== "admin") {
    return NextResponse.json(
      { error: "Admin authentication required" },
      { status: 401 },
    );
  }

  try {
    // Get all blocked customers
    const blockedCustomers = await database.queryMany(
      `SELECT c.id, c.company_name, c.subscription_plan, c.is_blocked, c.blocked_reason,
              c.blocked_at, c.blocked_by, c.created_at,
              COUNT(u.id) as user_count,
              COUNT(a.id) as api_count
       FROM companies c
       LEFT JOIN users u ON c.id = u.company_id
       LEFT JOIN apis a ON c.id = a.tenant_id
       WHERE c.is_blocked = true
       GROUP BY c.id
       ORDER BY c.blocked_at DESC`,
      [],
    );

    return NextResponse.json({
      success: true,
      blockedCustomers: blockedCustomers.map((customer) => ({
        id: customer.id,
        companyName: customer.company_name,
        subscriptionPlan: customer.subscription_plan,
        blockedReason: customer.blocked_reason,
        blockedAt: customer.blocked_at,
        blockedBy: customer.blocked_by,
        userCount: parseInt(customer.user_count || "0"),
        apiCount: parseInt(customer.api_count || "0"),
        memberSince: customer.created_at,
      })),
    });
  } catch (error) {
    logger.error("Admin get blocked customers error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch blocked customers" },
      { status: 500 },
    );
  }
}
