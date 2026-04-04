import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

async function safeQuery(fn: () => Promise<any>, fallback: any) {
  try {
    return await fn();
  } catch (error) {
    console.error('Executive dashboard query error:', error instanceof Error ? error.message : error);
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    // Run all queries in parallel instead of sequentially
    const [
      overallScore,
      frameworkCoverage,
      criticalViolations,
      upcomingDeadlines,
      recentActivity,
      complianceTrend,
      attestationStatus,
      regulatoryAlerts,
    ] = await Promise.all([
      // Overall compliance score
      safeQuery(
        () => database.queryOne(`
          SELECT COALESCE(ROUND(AVG(compliance_percentage)), 0) as score
          FROM compliance_check_results
          WHERE tenant_id = $1 AND compliance_percentage IS NOT NULL
        `, [tenantId]),
        { score: '0' }
      ),

      // Framework coverage — use DISTINCT ON to get only the latest assessment per framework
      safeQuery(
        () => database.queryMany(`
          SELECT DISTINCT ON (cf.id)
            cf.id, cf.framework_name, cf.category,
            COALESCE(ccr.compliance_percentage, 0) as score,
            CASE
              WHEN ccr.compliance_percentage >= 90 THEN 'compliant'
              WHEN ccr.compliance_percentage >= 70 THEN 'partial'
              ELSE 'non-compliant'
            END as status,
            ccr.last_assessment
          FROM compliance_frameworks cf
          LEFT JOIN compliance_check_results ccr ON cf.id = ccr.framework_id AND ccr.tenant_id = $1
          ORDER BY cf.id, ccr.last_assessment DESC NULLS LAST
        `, [tenantId]),
        []
      ),

      // Top 5 critical violations
      safeQuery(
        () => database.queryMany(`
          SELECT
            id, COALESCE(description, violation_type) as title, severity, violation_type,
            endpoint as endpoint_path, created_at as detected_at, status
          FROM compliance_api_violations
          WHERE tenant_id = $1 AND status = 'open'
          ORDER BY
            CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
            created_at DESC
          LIMIT 5
        `, [tenantId]),
        []
      ),

      // Upcoming deadlines (next 30 days)
      safeQuery(
        () => database.queryMany(`
          SELECT
            'attestation' as type, ca.id,
            'Attestation: ' || cc.control_name as title,
            ca.due_date as deadline, cf.framework_name
          FROM compliance_attestations ca
          JOIN compliance_controls cc ON ca.control_id = cc.id
          JOIN compliance_frameworks cf ON ca.framework_id = cf.id
          WHERE ca.tenant_id = $1
            AND ca.attestation_status = 'pending'
            AND ca.due_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'

          UNION ALL

          SELECT
            'audit' as type, cau.id,
            'Audit: ' || cau.framework_name as title,
            cau.completion_date as deadline, cau.framework_name
          FROM compliance_audits cau
          WHERE cau.tenant_id = $1
            AND cau.status IN ('planned', 'in_progress')
            AND cau.completion_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'

          UNION ALL

          SELECT
            'remediation' as type, crt.id,
            'Remediation: ' || crt.title as title,
            crt.due_date as deadline, 'General' as framework_name
          FROM compliance_remediation_tasks crt
          WHERE crt.tenant_id = $1
            AND crt.status NOT IN ('completed', 'cancelled')
            AND crt.due_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'

          ORDER BY deadline ASC
          LIMIT 10
        `, [tenantId]),
        []
      ),

      // Recent activity
      safeQuery(
        () => database.queryMany(`
          SELECT
            id, event_type, resource_type as entity_type, action,
            actor as actor_name, created_at
          FROM compliance_audit_log
          WHERE tenant_id = $1
          ORDER BY created_at DESC
          LIMIT 10
        `, [tenantId]),
        []
      ),

      // Compliance trend
      safeQuery(
        () => database.queryMany(`
          SELECT
            DATE_TRUNC('month', last_assessment) as month,
            ROUND(AVG(compliance_percentage)) as avg_score
          FROM compliance_check_results
          WHERE tenant_id = $1
            AND last_assessment >= NOW() - INTERVAL '6 months'
            AND compliance_percentage IS NOT NULL
          GROUP BY DATE_TRUNC('month', last_assessment)
          ORDER BY month ASC
        `, [tenantId]),
        []
      ),

      // Attestation overview
      safeQuery(
        () => database.queryOne(`
          SELECT
            COUNT(*) FILTER (WHERE attestation_status = 'attested') as current,
            COUNT(*) FILTER (WHERE attestation_status = 'pending') as pending,
            COUNT(*) FILTER (WHERE attestation_status = 'overdue') as overdue,
            COUNT(*) as total
          FROM compliance_attestations
          WHERE tenant_id = $1
        `, [tenantId]),
        { current: '0', pending: '0', overdue: '0', total: '0' }
      ),

      // Regulatory change alerts
      safeQuery(
        () => database.queryMany(`
          SELECT
            id, framework_name, change_type, title, impact_level,
            effective_date, status
          FROM compliance_regulatory_changes
          WHERE status IN ('new', 'under_review')
          ORDER BY
            CASE impact_level WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
            effective_date ASC
          LIMIT 5
        `, []),
        []
      ),
    ]);

    const kpis = {
      overallComplianceScore: parseInt(overallScore?.score || '0'),
      frameworksCovered: frameworkCoverage.length,
      frameworksCompliant: frameworkCoverage.filter((f: any) => f.status === 'compliant').length,
      openViolations: criticalViolations.length,
      criticalFindings: criticalViolations.filter((v: any) => v.severity === 'critical').length,
      pendingAttestations: parseInt(attestationStatus?.pending || '0'),
      overdueAttestations: parseInt(attestationStatus?.overdue || '0'),
      upcomingDeadlinesCount: upcomingDeadlines.length,
    };

    const res = NextResponse.json({
      success: true,
      dashboard: {
        kpis,
        overallScore: parseInt(overallScore?.score || '0'),
        frameworkCoverage,
        criticalViolations,
        upcomingDeadlines,
        recentActivity,
        complianceTrend,
        attestationStatus: {
          current: parseInt(attestationStatus?.current || '0'),
          pending: parseInt(attestationStatus?.pending || '0'),
          overdue: parseInt(attestationStatus?.overdue || '0'),
          total: parseInt(attestationStatus?.total || '0'),
        },
        regulatoryAlerts,
      },
    });
    res.headers.set("Cache-Control", "private, max-age=5, stale-while-revalidate=30");
    return res;
  } catch (error: any) {
    console.error('Error fetching executive dashboard:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
