import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { requireAdmin, isAuthError } from "@/lib/auth/require-admin";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (isAuthError(authResult)) return authResult;

  try {
    // Get real platform overview statistics
    const platformStats = await database.queryOne(
      `SELECT 
         COUNT(DISTINCT c.id) as total_companies,
         COUNT(DISTINCT u.id) as total_users,
         COUNT(DISTINCT a.id) as total_apis,
         COUNT(DISTINCT sr.id) as total_scans,
         COUNT(DISTINCT te.id) as active_threats,
         SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue
       FROM companies c
       LEFT JOIN users u ON c.id = u.company_id
       LEFT JOIN apis a ON c.id = a.tenant_id
       LEFT JOIN scan_results sr ON c.id = sr.tenant_id
       LEFT JOIN threat_events te ON c.id = te.tenant_id AND te.status = 'active'
       LEFT JOIN payments p ON c.id = p.tenant_id`,
      [],
    );

    // Get recent activity (last 24 hours)
    const recentActivity = await database.queryOne(
      `SELECT 
         COUNT(CASE WHEN sr.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as scans_24h,
         COUNT(CASE WHEN te.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as threats_24h,
         COUNT(CASE WHEN c.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as new_customers_24h,
         COUNT(CASE WHEN p.created_at >= NOW() - INTERVAL '24 hours' AND p.status = 'completed' THEN 1 END) as payments_24h
       FROM companies c
       LEFT JOIN scan_results sr ON c.id = sr.tenant_id
       LEFT JOIN threat_events te ON c.id = te.tenant_id
       LEFT JOIN payments p ON c.id = p.tenant_id`,
      [],
    );

    // Get system health metrics
    const systemHealth = await database.queryOne(
      `SELECT 
         COUNT(CASE WHEN au.timestamp >= NOW() - INTERVAL '1 hour' THEN 1 END) as requests_last_hour,
         AVG(CASE WHEN au.timestamp >= NOW() - INTERVAL '1 hour' THEN au.response_time END) as avg_response_time,
         COUNT(CASE WHEN au.status_code >= 400 AND au.timestamp >= NOW() - INTERVAL '1 hour' THEN 1 END) as error_count,
         COUNT(CASE WHEN au.status_code = 200 AND au.timestamp >= NOW() - INTERVAL '1 hour' THEN 1 END) as success_count
       FROM api_usage au`,
      [],
    );

    // Get subscription distribution
    const subscriptionStats = await database.queryOne(
      `SELECT 
         COUNT(CASE WHEN subscription_plan = 'starter' THEN 1 END) as starter_count,
         COUNT(CASE WHEN subscription_plan = 'professional' THEN 1 END) as professional_count,
         COUNT(CASE WHEN subscription_plan = 'enterprise' THEN 1 END) as enterprise_count,
         COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_subscriptions,
         COUNT(CASE WHEN subscription_status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
         COUNT(CASE WHEN subscription_status = 'trial' THEN 1 END) as trial_subscriptions
       FROM companies`,
      [],
    );

    // Get recent customers
    const recentCustomers = await database.queryMany(
      `SELECT 
         c.id, c.company_name, c.subscription_plan, c.subscription_status, c.created_at,
         COUNT(u.id) as user_count,
         COUNT(a.id) as api_count
       FROM companies c
       LEFT JOIN users u ON c.id = u.company_id
       LEFT JOIN apis a ON c.id = a.tenant_id
       GROUP BY c.id, c.company_name, c.subscription_plan, c.subscription_status, c.created_at
       ORDER BY c.created_at DESC
       LIMIT 10`,
      [],
    );

    // Get security alerts (critical issues)
    const securityAlerts = await database.queryMany(
      `SELECT 
         v.id, v.title, v.severity, v.tenant_id, v.created_at,
         c.company_name
       FROM vulnerabilities v
       JOIN companies c ON v.tenant_id = c.id
       WHERE v.severity IN ('CRITICAL', 'HIGH') AND v.status = 'open'
       ORDER BY v.created_at DESC
       LIMIT 10`,
      [],
    );

    // Calculate uptime percentage
    const totalRequests =
      parseInt(systemHealth?.requests_last_hour || "0") +
      parseInt(systemHealth?.error_count || "0");
    const uptime =
      totalRequests > 0
        ? Math.round(
            (parseInt(systemHealth?.success_count || "0") / totalRequests) *
              100 *
              100,
          ) / 100
        : 100;

    return NextResponse.json({
      success: true,
      overview: {
        platform: {
          totalCompanies: parseInt(platformStats?.total_companies || "0"),
          totalUsers: parseInt(platformStats?.total_users || "0"),
          totalApis: parseInt(platformStats?.total_apis || "0"),
          totalScans: parseInt(platformStats?.total_scans || "0"),
          activeThreats: parseInt(platformStats?.active_threats || "0"),
          totalRevenue:
            Math.round(parseFloat(platformStats?.total_revenue || "0") * 100) /
            100,
        },
        activity24h: {
          newScans: parseInt(recentActivity?.scans_24h || "0"),
          newThreats: parseInt(recentActivity?.threats_24h || "0"),
          newCustomers: parseInt(recentActivity?.new_customers_24h || "0"),
          newPayments: parseInt(recentActivity?.payments_24h || "0"),
        },
        systemHealth: {
          requestsLastHour: parseInt(systemHealth?.requests_last_hour || "0"),
          averageResponseTime: systemHealth?.avg_response_time
            ? Math.round(parseFloat(systemHealth.avg_response_time))
            : null,
          errorCount: parseInt(systemHealth?.error_count || "0"),
          uptime: uptime,
        },
        subscriptions: {
          starter: parseInt(subscriptionStats?.starter_count || "0"),
          professional: parseInt(subscriptionStats?.professional_count || "0"),
          enterprise: parseInt(subscriptionStats?.enterprise_count || "0"),
          active: parseInt(subscriptionStats?.active_subscriptions || "0"),
          cancelled: parseInt(
            subscriptionStats?.cancelled_subscriptions || "0",
          ),
          trial: parseInt(subscriptionStats?.trial_subscriptions || "0"),
        },
        recentCustomers: recentCustomers.map((customer) => ({
          id: customer.id,
          companyName: customer.company_name,
          subscriptionPlan: customer.subscription_plan,
          subscriptionStatus: customer.subscription_status,
          userCount: parseInt(customer.user_count || "0"),
          apiCount: parseInt(customer.api_count || "0"),
          joinedAt: customer.created_at,
        })),
        securityAlerts: securityAlerts.map((alert) => ({
          id: alert.id,
          title: alert.title,
          severity: alert.severity,
          companyName: alert.company_name,
          tenantId: alert.tenant_id,
          detectedAt: alert.created_at,
        })),
      },
    });
  } catch (error) {
    logger.error("Admin overview error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch admin overview" },
      { status: 500 },
    );
  }
}
