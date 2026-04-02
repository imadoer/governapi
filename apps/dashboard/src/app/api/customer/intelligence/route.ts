import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { logger } from "../../../../utils/logging/logger";

// Scoring algorithms
function calculateSecurityScore(data: {
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  dependencyAlerts: number;
  activeIntegrations: number;
}): number {
  let score = 100;
  score -= Math.min(data.totalVulnerabilities * 5, 40);
  score -= Math.min(data.criticalVulnerabilities * 10, 30);
  score -= Math.min(data.dependencyAlerts * 3, 20);
  if (data.activeIntegrations > 0) {
    score += Math.min(data.activeIntegrations * 5, 10);
  } else {
    score -= 20;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateGovernanceScore(data: {
  staleTickets: number;
  openSecurityIssues: number;
  avgResolutionTime: number;
  activeIntegrations: number;
}): number {
  let score = 100;
  score -= Math.min(data.staleTickets * 8, 35);
  score -= Math.min(data.openSecurityIssues * 4, 30);
  if (data.avgResolutionTime > 14) {
    score -= Math.min((data.avgResolutionTime - 14) * 2, 20);
  }
  if (data.activeIntegrations >= 2) {
    score += 15;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateComplianceScore(data: {
  integrationsConnected: number;
  lastSyncWithin24h: number;
  securityMentions: number;
  hasDocumentation: boolean;
}): number {
  let score = 50;
  score += Math.min(data.integrationsConnected * 10, 30);
  score += Math.min(data.lastSyncWithin24h * 5, 15);
  if (data.securityMentions > 5) {
    score += 10;
  }
  if (data.hasDocumentation) {
    score += 10;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    // Get all integrations (no last_sync column)
    const integrations = await database.queryMany(
      `SELECT id, integration_type, integration_name, is_active
       FROM external_integrations
       WHERE tenant_id = $1`,
      [tenantId]
    );

    // Get aggregated metrics
    const metricsData = await database.queryOne(
      `SELECT 
        COUNT(*) as total_integrations,
        COUNT(CASE WHEN is_active THEN 1 END) as active_integrations,
        COALESCE(SUM(im.open_vulnerabilities), 0) as total_vulnerabilities,
        COALESCE(SUM(im.dependency_alerts), 0) as total_dependency_alerts,
        COALESCE(SUM(im.stale_tickets), 0) as total_stale_tickets,
        COALESCE(SUM(im.security_mentions), 0) as total_security_mentions,
        COALESCE(SUM(im.records_fetched), 0) as total_records,
        MAX(im.last_sync) as most_recent_sync
       FROM external_integrations ei
       LEFT JOIN integration_metrics im ON ei.id = im.integration_id
       WHERE ei.tenant_id = $1`,
      [tenantId]
    );

    // Get integration details
    const integrationDetails = await database.queryMany(
      `SELECT 
        ei.id,
        ei.integration_type,
        ei.integration_name,
        ei.is_active,
        COALESCE(im.open_vulnerabilities, 0) as open_vulnerabilities,
        COALESCE(im.dependency_alerts, 0) as dependency_alerts,
        COALESCE(im.stale_tickets, 0) as stale_tickets,
        COALESCE(im.security_mentions, 0) as security_mentions,
        COALESCE(im.records_fetched, 0) as records_fetched,
        im.last_sync,
        im.sync_status,
        im.error_message
       FROM external_integrations ei
       LEFT JOIN integration_metrics im ON ei.id = im.integration_id
       WHERE ei.tenant_id = $1
       ORDER BY im.last_sync DESC NULLS LAST`,
      [tenantId]
    );

    const totalVulnerabilities = parseInt(metricsData?.total_vulnerabilities || '0');
    const totalDependencyAlerts = parseInt(metricsData?.total_dependency_alerts || '0');
    const totalStaleTickets = parseInt(metricsData?.total_stale_tickets || '0');
    const activeIntegrations = parseInt(metricsData?.active_integrations || '0');
    const totalIntegrations = parseInt(metricsData?.total_integrations || '0');

    const securityScore = calculateSecurityScore({
      totalVulnerabilities,
      criticalVulnerabilities: Math.floor(totalVulnerabilities * 0.3),
      dependencyAlerts: totalDependencyAlerts,
      activeIntegrations,
    });

    const governanceScore = calculateGovernanceScore({
      staleTickets: totalStaleTickets,
      openSecurityIssues: totalVulnerabilities,
      avgResolutionTime: 10,
      activeIntegrations,
    });

    const lastSyncWithin24h = integrationDetails.filter(i => {
      if (!i.last_sync) return false;
      const diff = Date.now() - new Date(i.last_sync).getTime();
      return diff < 24 * 60 * 60 * 1000;
    }).length;

    const complianceScore = calculateComplianceScore({
      integrationsConnected: totalIntegrations,
      lastSyncWithin24h,
      securityMentions: parseInt(metricsData?.total_security_mentions || '0'),
      hasDocumentation: activeIntegrations > 0,
    });

    const trustIndex = Math.round((securityScore + governanceScore + complianceScore) / 3);

    // Store scores
    await database.query(
      `INSERT INTO security_intelligence_scores 
       (tenant_id, security_score, governance_score, compliance_score, trust_index,
        total_integrations, active_integrations, total_vulnerabilities, 
        total_compliance_items, stale_policies_count, calculation_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        tenantId, securityScore, governanceScore, complianceScore, trustIndex,
        totalIntegrations, activeIntegrations, totalVulnerabilities,
        0, totalStaleTickets,
        JSON.stringify({ calculated_at: new Date().toISOString() })
      ]
    );

    return NextResponse.json({
      success: true,
      scores: {
        security_score: securityScore,
        governance_score: governanceScore,
        compliance_score: complianceScore,
        trust_index: trustIndex,
      },
      integrations_summary: {
        total: totalIntegrations,
        active: activeIntegrations,
        last_sync: metricsData?.most_recent_sync,
      },
      metrics: {
        total_vulnerabilities: totalVulnerabilities,
        dependency_alerts: totalDependencyAlerts,
        stale_tickets: totalStaleTickets,
        security_mentions: parseInt(metricsData?.total_security_mentions || '0'),
        total_records_synced: parseInt(metricsData?.total_records || '0'),
      },
      integrations: integrationDetails.map(i => ({
        id: i.id,
        type: i.integration_type,
        name: i.integration_name,
        active: i.is_active,
        metrics: {
          vulnerabilities: i.open_vulnerabilities || 0,
          dependencyAlerts: i.dependency_alerts || 0,
          staleTickets: i.stale_tickets || 0,
          securityMentions: i.security_mentions || 0,
        },
        last_sync: i.last_sync,
        sync_status: i.sync_status,
        error: i.error_message,
      })),
    });

  } catch (error) {
    logger.error("Intelligence API error", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    
    return NextResponse.json({ error: "Failed to fetch intelligence metrics" }, { status: 500 });
  }
}
