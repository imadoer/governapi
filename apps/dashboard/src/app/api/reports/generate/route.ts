import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { extendedDatabase } from "../../../../infrastructure/database-extended";

export async function POST(req: NextRequest) {
  try {
    const { report_type = "security", tenant_id } = await req.json();

    if (!tenant_id) {
      return NextResponse.json(
        { error: "tenant_id required" },
        { status: 400 },
      );
    }

    // Get data from database
    const [
      scansResult,
      apisResult,
      requestsResult,
      alertsResult,
      webhooksResult,
    ] = await Promise.all([
      extendedDatabase.supabase
        .from("security_scans")
        .select("*")
        .eq("tenant_id", tenant_id)
        .order("created_at", { ascending: false })
        .limit(1),

      extendedDatabase.supabase
        .from("discovered_apis")
        .select("*")
        .eq("tenant_id", tenant_id),

      extendedDatabase.supabase
        .from("customer_requests")
        .select("*")
        .eq("tenant_id", tenant_id)
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        ),

      extendedDatabase.supabase
        .from("alert_configurations")
        .select("*")
        .eq("tenant_id", tenant_id),

      extendedDatabase.supabase
        .from("webhooks")
        .select("*")
        .eq("tenant_id", tenant_id),
    ]);

    const latestScan = scansResult.data?.[0];
    const discoveredAPIs = apisResult.data || [];
    const requests = requestsResult.data || [];
    const alertConfigs = alertsResult.data || [];
    const webhookConfigs = webhooksResult.data || [];

    // Calculate metrics from real data
    const totalAPIs = discoveredAPIs.length;
    const vulnerabilities = latestScan?.findings?.vulnerabilities || [];
    const totalVulnerabilities = vulnerabilities.length;
    const criticalVulns = vulnerabilities.filter(
      (v: any) => v.severity === "CRITICAL",
    ).length;
    const highVulns = vulnerabilities.filter(
      (v: any) => v.severity === "HIGH",
    ).length;

    // Calculate security score
    let securityScore = 100;
    if (totalVulnerabilities > 0) {
      securityScore -= criticalVulns * 25;
      securityScore -= highVulns * 15;
      securityScore -= (totalVulnerabilities - criticalVulns - highVulns) * 5;
      securityScore = Math.max(0, securityScore);
    }

    // Bot detection metrics
    const totalTraffic = requests.length;
    const botRequests = requests.filter((r: any) => r.is_bot).length;
    const blockedBots = requests.filter(
      (r: any) => r.is_bot && r.blocked,
    ).length;

    // Generate report based on type
    const report = {
      generated_at: new Date().toISOString(),
      tenant_id,
      report_type,
      summary: {
        total_apis: totalAPIs,
        total_vulnerabilities: totalVulnerabilities,
        security_score: securityScore,
        critical_issues: criticalVulns,
        high_issues: highVulns,
        total_traffic: totalTraffic,
        bot_traffic: botRequests,
        blocked_bots: blockedBots,
      },
      details: {
        apis: discoveredAPIs.map((api: any) => ({
          url: api.url,
          type: api.api_type,
          status: api.status_code,
          auth_required: api.auth_required,
        })),
        vulnerabilities: vulnerabilities.map((v: any) => ({
          severity: v.severity,
          title: v.title || v.finding,
          category: v.category,
          description: v.description,
        })),
        monitoring: {
          alerts_configured: alertConfigs.length,
          webhooks_configured: webhookConfigs.length,
          active_alerts: alertConfigs.filter((a: any) => a.enabled).length,
        },
      },
      recommendations: generateRecommendations(
        securityScore,
        criticalVulns,
        highVulns,
        totalAPIs,
      ),
    };

    // Store report in database
    await extendedDatabase.supabase.from("generated_reports").insert({
      tenant_id,
      report_type,
      report_data: report,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    logger.error("Report generation error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

function generateRecommendations(
  score: number,
  critical: number,
  high: number,
  totalAPIs: number,
): string[] {
  const recommendations: string[] = [];

  if (critical > 0) {
    recommendations.push(
      `Address ${critical} critical vulnerabilities immediately`,
    );
  }
  if (high > 0) {
    recommendations.push(
      `Remediate ${high} high-severity issues within 48 hours`,
    );
  }
  if (score < 70) {
    recommendations.push(
      "Implement comprehensive security testing across all endpoints",
    );
  }
  if (totalAPIs === 0) {
    recommendations.push("Begin API discovery to map your attack surface");
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Maintain current security posture with regular scans",
    );
  }

  return recommendations;
}
