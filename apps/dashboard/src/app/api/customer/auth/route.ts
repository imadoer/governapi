import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    // Get real authenticated user and company data
    const userCompanyData = await database.queryOne(
      `SELECT u.id as user_id, u.email, u.first_name, u.last_name, u.role, u.last_login,
              u.email_verified, u.created_at as user_created_at,
              c.id as company_id, c.company_name, c.domain, c.subscription_plan, 
              c.subscription_status, c.api_key, c.created_at as company_created_at,
              c.billing_email, c.contact_email
       FROM users u
       JOIN companies c ON u.company_id = c.id
       WHERE u.company_id = $1 AND u.id = $2`,
      [tenantId, userId || tenantId],
    );

    if (!userCompanyData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user permissions and features
    const permissions = await database.queryMany(
      `SELECT permission_name, resource_type, actions
       FROM user_permissions 
       WHERE user_id = $1 AND is_active = true`,
      [userCompanyData.user_id],
    );

    // Get account usage statistics
    const usageStats = await database.queryOne(
      `SELECT 
         (SELECT COUNT(*) FROM apis WHERE tenant_id = $1) as total_apis,
         (SELECT COUNT(*) FROM scan_results WHERE tenant_id = $1) as total_scans,
         (SELECT COUNT(*) FROM threat_events WHERE tenant_id = $1) as total_threats,
         (SELECT COUNT(*) FROM webhooks WHERE tenant_id = $1) as total_webhooks`,
      [tenantId],
    );

    // Get recent activity
    const recentActivity = await database.queryMany(
      `SELECT activity_type, details, created_at
       FROM user_activity_log 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userCompanyData.user_id],
    );

    const authResponse = {
      success: true,
      user: {
        id: userCompanyData.user_id,
        email: userCompanyData.email,
        firstName: userCompanyData.first_name,
        lastName: userCompanyData.last_name,
        fullName: `${userCompanyData.first_name} ${userCompanyData.last_name}`,
        role: userCompanyData.role,
        emailVerified: userCompanyData.email_verified,
        lastLogin: userCompanyData.last_login,
        memberSince: userCompanyData.user_created_at,
      },
      company: {
        id: userCompanyData.company_id,
        name: userCompanyData.company_name,
        domain: userCompanyData.domain,
        subscriptionPlan: userCompanyData.subscription_plan,
        subscriptionStatus: userCompanyData.subscription_status,
        apiKey: userCompanyData.api_key,
        billingEmail: userCompanyData.billing_email || userCompanyData.email,
        contactEmail: userCompanyData.contact_email || userCompanyData.email,
        establishedDate: userCompanyData.company_created_at,
      },
      permissions: permissions.map((p) => ({
        name: p.permission_name,
        resourceType: p.resource_type,
        actions:
          typeof p.actions === "string" ? JSON.parse(p.actions) : p.actions,
      })),
      usage: {
        totalApis: parseInt(usageStats?.total_apis || "0"),
        totalScans: parseInt(usageStats?.total_scans || "0"),
        totalThreats: parseInt(usageStats?.total_threats || "0"),
        totalWebhooks: parseInt(usageStats?.total_webhooks || "0"),
      },
      recentActivity: recentActivity.map((activity) => ({
        type: activity.activity_type,
        details: activity.details,
        timestamp: activity.created_at,
      })),
    };

    // Update last login timestamp
    await database.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      userCompanyData.user_id,
    ]);

    // Log authentication event
    await database.query(
      `INSERT INTO user_activity_log (user_id, activity_type, details, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userCompanyData.user_id, "auth_check", "User authentication verified"],
    );

    return NextResponse.json(authResponse);
  } catch (error) {
    logger.error("Auth API error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Authentication verification failed" },
      { status: 500 },
    );
  }
}
