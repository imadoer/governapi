import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const frameworkId = searchParams.get('frameworkId');

    // Calculate audit readiness for all frameworks or specific one
    const frameworks = await database.queryMany(`
      SELECT id, framework_name FROM compliance_frameworks
      ${frameworkId ? 'WHERE id = $1' : ''}
      ORDER BY framework_name
    `, frameworkId ? [frameworkId] : []);

    const readinessScores = [];

    for (const framework of frameworks) {
      // Evidence score
      const evidenceStats = await database.queryOne(`
        SELECT
          COUNT(*) FILTER (WHERE freshness_status = 'fresh') as fresh,
          COUNT(*) FILTER (WHERE freshness_status = 'stale') as stale,
          COUNT(*) FILTER (WHERE freshness_status = 'missing') as missing,
          COUNT(*) as total
        FROM compliance_evidence_enhanced
        WHERE tenant_id = $1 AND framework_id = $2
      `, [tenantId, framework.id]);

      const evidenceTotal = parseInt(evidenceStats?.total || '0');
      const evidenceScore = evidenceTotal > 0 
        ? Math.round((parseInt(evidenceStats?.fresh || '0') / evidenceTotal) * 100)
        : 0;

      // Control score
      const controlStats = await database.queryOne(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'passed') as passed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) as total
        FROM compliance_check_results
        WHERE tenant_id = $1 AND framework_id = $2
      `, [tenantId, framework.id]);

      const controlTotal = parseInt(controlStats?.total || '0');
      const controlScore = controlTotal > 0
        ? Math.round((parseInt(controlStats?.passed || '0') / controlTotal) * 100)
        : 0;

      // Attestation score
      const attestationStats = await database.queryOne(`
        SELECT
          COUNT(*) FILTER (WHERE attestation_status = 'attested') as current,
          COUNT(*) FILTER (WHERE attestation_status IN ('overdue', 'expired')) as overdue,
          COUNT(*) as total
        FROM compliance_attestations
        WHERE tenant_id = $1 AND framework_id = $2
      `, [tenantId, framework.id]);

      const attestationTotal = parseInt(attestationStats?.total || '0');
      const attestationScore = attestationTotal > 0
        ? Math.round((parseInt(attestationStats?.current || '0') / attestationTotal) * 100)
        : 100;

      // Open findings penalty
      const findingsStats = await database.queryOne(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'open') as open,
          COUNT(*) FILTER (WHERE status = 'open' AND due_date < NOW()) as overdue
        FROM compliance_findings
        WHERE tenant_id = $1 AND framework_name = $2
      `, [tenantId, framework.framework_name]);

      const openFindings = parseInt(findingsStats?.open || '0');
      const overdueFindings = parseInt(findingsStats?.overdue || '0');
      const remediationScore = Math.max(0, 100 - (openFindings * 5) - (overdueFindings * 10));

      // Weighted overall score
      const overallScore = Math.round(
        (evidenceScore * 0.25) +
        (controlScore * 0.35) +
        (attestationScore * 0.20) +
        (remediationScore * 0.20)
      );

      // Generate recommendations
      const recommendations = [];
      if (evidenceScore < 80) recommendations.push('Refresh stale evidence or collect missing evidence');
      if (controlScore < 80) recommendations.push('Address failing controls');
      if (attestationScore < 100) recommendations.push('Complete overdue attestations');
      if (openFindings > 0) recommendations.push(`Resolve ${openFindings} open finding(s)`);
      if (overdueFindings > 0) recommendations.push(`Prioritize ${overdueFindings} overdue finding(s)`);

      // Risk factors
      const riskFactors = [];
      if (evidenceScore < 50) riskFactors.push({ type: 'evidence', severity: 'high', message: 'Critical evidence gaps' });
      if (controlScore < 70) riskFactors.push({ type: 'controls', severity: 'high', message: 'Multiple failing controls' });
      if (overdueFindings > 5) riskFactors.push({ type: 'findings', severity: 'critical', message: 'Many overdue findings' });

      readinessScores.push({
        frameworkId: framework.id,
        frameworkName: framework.framework_name,
        overallScore,
        readyForAudit: overallScore >= 85,
        scores: {
          evidence: evidenceScore,
          controls: controlScore,
          attestations: attestationScore,
          remediation: remediationScore,
        },
        stats: {
          evidence: {
            fresh: parseInt(evidenceStats?.fresh || '0'),
            stale: parseInt(evidenceStats?.stale || '0'),
            missing: parseInt(evidenceStats?.missing || '0'),
          },
          controls: {
            passed: parseInt(controlStats?.passed || '0'),
            failed: parseInt(controlStats?.failed || '0'),
            pending: parseInt(controlStats?.pending || '0'),
          },
          attestations: {
            current: parseInt(attestationStats?.current || '0'),
            overdue: parseInt(attestationStats?.overdue || '0'),
          },
          findings: {
            open: openFindings,
            overdue: overdueFindings,
          },
        },
        recommendations,
        riskFactors,
        calculatedAt: new Date().toISOString(),
      });

      // Store the calculation
      await database.query(`
        INSERT INTO compliance_audit_readiness (
          tenant_id, framework_id, overall_score,
          evidence_score, evidence_fresh_count, evidence_stale_count, evidence_missing_count,
          control_score, controls_passed, controls_failed, controls_pending,
          attestation_score, attestations_current, attestations_overdue,
          remediation_score, open_findings, overdue_findings,
          risk_factors, recommendations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
        tenantId, framework.id, overallScore,
        evidenceScore, evidenceStats?.fresh || 0, evidenceStats?.stale || 0, evidenceStats?.missing || 0,
        controlScore, controlStats?.passed || 0, controlStats?.failed || 0, controlStats?.pending || 0,
        attestationScore, attestationStats?.current || 0, attestationStats?.overdue || 0,
        remediationScore, openFindings, overdueFindings,
        JSON.stringify(riskFactors), JSON.stringify(recommendations)
      ]);
    }

    return NextResponse.json({
      success: true,
      readiness: frameworkId ? readinessScores[0] : readinessScores,
    });
  } catch (error: any) {
    console.error('Error calculating audit readiness:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
