import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    // Overall compliance score
    const overallScore = await database.queryOne(`
      SELECT 
        COALESCE(ROUND(AVG(compliance_percentage)), 0) as score
      FROM compliance_check_results
      WHERE tenant_id = $1 AND compliance_percentage IS NOT NULL
    `, [tenantId]);

    // Framework coverage
    const frameworkCoverage = await database.queryMany(`
      SELECT 
        cf.id,
        cf.framework_name,
        cf.category,
        COALESCE(ccr.compliance_percentage, 0) as score,
        CASE 
          WHEN ccr.compliance_percentage >= 90 THEN 'compliant'
          WHEN ccr.compliance_percentage >= 70 THEN 'partial'
          ELSE 'non-compliant'
        END as status,
        ccr.last_assessment
      FROM compliance_frameworks cf
      LEFT JOIN compliance_check_results ccr ON cf.id = ccr.framework_id AND ccr.tenant_id = $1
      ORDER BY cf.framework_name
    `, [tenantId]);

    // Top 5 critical violations
    const criticalViolations = await database.queryMany(`
      SELECT 
        id, title, severity, violation_type, endpoint_path, detected_at, status
      FROM compliance_api_violations
      WHERE tenant_id = $1 AND status = 'open'
      ORDER BY 
        CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
        detected_at DESC
      LIMIT 5
    `, [tenantId]);

    // Upcoming deadlines (next 30 days)
    const upcomingDeadlines = await database.queryMany(`
      SELECT 
        'attestation' as type,
        ca.id,
        'Attestation: ' || cc.control_name as title,
        ca.due_date as deadline,
        cf.framework_name
      FROM compliance_attestations ca
      JOIN compliance_controls cc ON ca.control_id = cc.id
      JOIN compliance_frameworks cf ON ca.framework_id = cf.id
      WHERE ca.tenant_id = $1 
        AND ca.attestation_status = 'pending'
        AND ca.due_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        'audit' as type,
        cau.id,
        'Audit: ' || cau.framework_name as title,
        cau.completion_date as deadline,
        cau.framework_name
      FROM compliance_audits cau
      WHERE cau.tenant_id = $1 
        AND cau.status IN ('planned', 'in_progress')
        AND cau.completion_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
      
      UNION ALL
      
      SELECT 
        'remediation' as type,
        crt.id,
        'Remediation: ' || crt.title as title,
        crt.due_date as deadline,
        cf.framework_name
      FROM compliance_remediation_tasks crt
      LEFT JOIN compliance_frameworks cf ON crt.framework_id = cf.id
      WHERE crt.tenant_id = $1 
        AND crt.status NOT IN ('completed', 'cancelled')
        AND crt.due_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
      
      ORDER BY deadline ASC
      LIMIT 10
    `, [tenantId]);

    // Recent activity (last 10 items)
    const recentActivity = await database.queryMany(`
      SELECT 
        id, event_type, event_category, entity_type, action,
        actor_name, created_at
      FROM compliance_audit_log
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [tenantId]);

    // Compliance trend (last 6 months)
    const complianceTrend = await database.queryMany(`
      SELECT 
        DATE_TRUNC('month', recorded_at) as month,
        ROUND(AVG(score)) as avg_score
      FROM compliance_score_history
      WHERE tenant_id = $1 
        AND recorded_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', recorded_at)
      ORDER BY month ASC
    `, [tenantId]);

    // Attestation overview
    const attestationStatus = await database.queryOne(`
      SELECT
        COUNT(*) FILTER (WHERE attestation_status = 'attested') as current,
        COUNT(*) FILTER (WHERE attestation_status = 'pending') as pending,
        COUNT(*) FILTER (WHERE attestation_status = 'overdue') as overdue,
        COUNT(*) as total
      FROM compliance_attestations
      WHERE tenant_id = $1
    `, [tenantId]);

    // Regulatory change alerts
    const regulatoryAlerts = await database.queryMany(`
      SELECT 
        id, framework_name, change_type, title, impact_level, 
        effective_date, status
      FROM compliance_regulatory_changes
      WHERE status IN ('new', 'under_review')
      ORDER BY 
        CASE impact_level WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
        effective_date ASC
      LIMIT 5
    `, []);

    // KPIs for board
    const kpis = {
      overallComplianceScore: parseInt(overallScore?.score || '0'),
      frameworksCovered: frameworkCoverage.length,
      frameworksCompliant: frameworkCoverage.filter(f => f.status === 'compliant').length,
      openViolations: criticalViolations.length,
      criticalFindings: criticalViolations.filter(v => v.severity === 'critical').length,
      pendingAttestations: parseInt(attestationStatus?.pending || '0'),
      overdueAttestations: parseInt(attestationStatus?.overdue || '0'),
      upcomingDeadlinesCount: upcomingDeadlines.length,
    };

    return NextResponse.json({
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
  } catch (error: any) {
    console.error('Error fetching executive dashboard:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
