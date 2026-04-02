import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../../infrastructure/database";

interface ExportQuery {
  format: 'json' | 'jsonl' | 'csv' | 'siem';
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'json') as ExportQuery['format'];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '1000');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    whereClause += ` LIMIT $${paramIndex}`;
    params.push(limit);

    const events = await database.queryMany(
      `SELECT 
        id, api_key, source_ip, user_agent, bot_type,
        confidence_score, blocked, asn, country, risk_score,
        behavior_score, reputation_score, final_score,
        fingerprint_hash, created_at
      FROM bot_detection_events
      ${whereClause}
      ORDER BY created_at DESC`,
      params
    );

    switch (format) {
      case 'json':
        return NextResponse.json({
          success: true,
          count: events.length,
          events,
        });

      case 'jsonl':
        const jsonl = events.map(e => JSON.stringify(e)).join('\n');
        return new NextResponse(jsonl, {
          headers: {
            'Content-Type': 'application/x-ndjson',
            'Content-Disposition': `attachment; filename="bot-detections-${Date.now()}.jsonl"`,
          },
        });

      case 'csv':
        const csv = formatAsCsv(events);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="bot-detections-${Date.now()}.csv"`,
          },
        });

      case 'siem':
        const siem = formatAsSiem(events);
        return new NextResponse(siem, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="bot-detections-${Date.now()}.log"`,
          },
        });

      default:
        return NextResponse.json(
          { error: "Invalid format" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}

function formatAsCsv(events: any[]): string {
  if (events.length === 0) return '';

  const headers = [
    'id', 'timestamp', 'source_ip', 'user_agent', 'bot_type',
    'confidence_score', 'blocked', 'asn', 'country', 'risk_score',
    'behavior_score', 'reputation_score', 'final_score', 'fingerprint_hash'
  ];

  const csvRows = [headers.join(',')];

  for (const event of events) {
    const row = headers.map(header => {
      let value = event[header] || '';
      
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""');
        if (value.includes(',') || value.includes('\n')) {
          value = `"${value}"`;
        }
      }
      
      return value;
    });

    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

function formatAsSiem(events: any[]): string {
  const siemLogs: string[] = [];

  for (const event of events) {
    const timestamp = new Date(event.created_at).toISOString();
    const severity = event.blocked ? 'HIGH' : 'MEDIUM';
    
    const cefLog = [
      'CEF:0',
      'GovernAPI',
      'BotProtection',
      '1.0',
      event.id,
      `Bot Detection - ${event.bot_type || 'Unknown'}`,
      severity,
      [
        `src=${event.source_ip}`,
        `cs1Label=UserAgent cs1=${event.user_agent || 'None'}`,
        `cn1Label=FinalScore cn1=${event.final_score || 0}`,
        `act=${event.blocked ? 'blocked' : 'logged'}`,
        `rt=${timestamp}`,
      ].join(' '),
    ].join('|');

    siemLogs.push(cefLog);
  }

  return siemLogs.join('\n');
}
