import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

async function safe(fn: () => Promise<any>, fallback: any) {
  try { return await fn(); } catch { return fallback; }
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    // Single query: get all frameworks with their control + attestation stats
    const rows = await safe(
      () => database.queryMany(`
        SELECT
          cf.id as framework_id,
          cf.framework_name,
          COALESCE(cr.passed, 0) as controls_passed,
          COALESCE(cr.failed, 0) as controls_failed,
          COALESCE(cr.pending, 0) as controls_pending,
          COALESCE(cr.total, 0) as controls_total,
          COALESCE(att.current, 0) as attestations_current,
          COALESCE(att.overdue, 0) as attestations_overdue,
          COALESCE(att.total, 0) as attestations_total
        FROM compliance_frameworks cf
        LEFT JOIN (
          SELECT framework_id,
            COUNT(*) FILTER (WHERE status = 'passed') as passed,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) as total
          FROM compliance_check_results
          WHERE tenant_id = $1
          GROUP BY framework_id
        ) cr ON cr.framework_id = cf.id
        LEFT JOIN (
          SELECT framework_id,
            COUNT(*) FILTER (WHERE attestation_status = 'attested') as current,
            COUNT(*) FILTER (WHERE attestation_status IN ('overdue', 'expired')) as overdue,
            COUNT(*) as total
          FROM compliance_attestations
          WHERE tenant_id = $1
          GROUP BY framework_id
        ) att ON att.framework_id = cf.id
        ORDER BY cf.framework_name
      `, [tenantId]),
      []
    );

    const readinessScores = rows.map((row: any) => {
      const controlTotal = parseInt(row.controls_total || '0');
      const controlScore = controlTotal > 0
        ? Math.round((parseInt(row.controls_passed || '0') / controlTotal) * 100)
        : 0;

      const attestationTotal = parseInt(row.attestations_total || '0');
      const attestationScore = attestationTotal > 0
        ? Math.round((parseInt(row.attestations_current || '0') / attestationTotal) * 100)
        : 100;

      const overallScore = Math.round((controlScore * 0.6) + (attestationScore * 0.4));

      const recommendations: string[] = [];
      if (controlScore < 80) recommendations.push('Address failing controls');
      if (attestationScore < 100) recommendations.push('Complete overdue attestations');

      return {
        frameworkId: row.framework_id,
        frameworkName: row.framework_name,
        overallScore,
        readyForAudit: overallScore >= 85,
        scores: { evidence: 0, controls: controlScore, attestations: attestationScore, remediation: 100 },
        stats: {
          evidence: { fresh: 0, stale: 0, missing: 0 },
          controls: {
            passed: parseInt(row.controls_passed || '0'),
            failed: parseInt(row.controls_failed || '0'),
            pending: parseInt(row.controls_pending || '0'),
          },
        },
        recommendations,
        riskFactors: controlScore < 70 ? [{ type: 'controls', severity: 'high', message: 'Multiple failing controls' }] : [],
      };
    });

    return NextResponse.json({ success: true, readiness: readinessScores });
  } catch (error: any) {
    console.error('Error calculating audit readiness:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
