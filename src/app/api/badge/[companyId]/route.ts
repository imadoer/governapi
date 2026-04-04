import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;

  try {
    let company = await database.queryOne(
      `SELECT id, company_name FROM companies WHERE id = $1 AND status = 'active'`,
      [companyId]
    );
    if (!company) {
      company = await database.queryOne(
        `SELECT c.id, c.company_name FROM companies c JOIN users u ON u.company_id = c.id WHERE u.id = $1 AND c.status = 'active'`,
        [companyId]
      );
    }
    if (!company) {
      return svgResponse(buildSvg("Unknown", null), 404);
    }

    const scanAvg = await database.queryOne(
      `SELECT ROUND(AVG(security_score)) as avg_score
       FROM security_scans
       WHERE tenant_id IN ($1, $2) AND status = 'completed' AND security_score IS NOT NULL`,
      [company.id, companyId]
    );

    const score = parseInt(scanAvg?.avg_score || "0");
    return svgResponse(buildSvg(company.company_name, score), 200);
  } catch {
    return svgResponse(buildSvg("Error", null), 500);
  }
}

function svgResponse(svg: string, status: number) {
  return new NextResponse(svg, {
    status,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function buildSvg(name: string, score: number | null): string {
  const hasScore = score !== null && score > 0;
  const scoreText = hasScore ? `${score}` : "—";
  const scoreColor = hasScore
    ? score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444"
    : "#6b7280";
  const label = hasScore ? "API Security Score" : "Not Scanned";
  const labelW = 120;
  const scoreW = hasScore ? 40 : 70;
  const verW = 130;
  const w = labelW + scoreW + verW;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="24" viewBox="0 0 ${w} 24">
<rect width="${w}" height="24" rx="4" fill="#0f172a"/>
<rect width="${labelW}" height="24" rx="4" fill="#1e293b"/>
<text x="${labelW / 2}" y="13" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="11" font-weight="500" text-anchor="middle" dominant-baseline="central">${label}</text>
<rect x="${labelW}" width="${scoreW}" height="24" fill="${scoreColor}"/>
<text x="${labelW + scoreW / 2}" y="13" fill="#fff" font-family="system-ui,sans-serif" font-size="12" font-weight="700" text-anchor="middle" dominant-baseline="central">${scoreText}</text>
<rect x="${labelW + scoreW}" width="${verW}" height="24" fill="#0f172a"/>
<rect x="${w - 4}" y="0" width="4" height="24" rx="4" fill="#0f172a"/>
<text x="${labelW + scoreW + 12}" y="13" fill="#64748b" font-family="system-ui,sans-serif" font-size="10" dominant-baseline="central">Verified by GovernAPI</text>
</svg>`;
}
