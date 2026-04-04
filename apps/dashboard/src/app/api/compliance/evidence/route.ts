import { NextRequest, NextResponse } from 'next/server';

// The compliance_evidence_enhanced table has not been created yet.
// Return empty results until the schema migration is run.

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    evidence: [],
    stats: { fresh: 0, stale: 0, missing: 0, automated: 0, total: 0 },
  });
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
  }

  return NextResponse.json({
    success: false,
    error: 'Evidence storage not configured. Run the compliance schema migration first.',
  }, { status: 501 });
}
