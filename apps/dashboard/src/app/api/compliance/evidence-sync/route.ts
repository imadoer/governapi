import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // In production, this would trigger actual evidence collection
    // from integrations like AWS, GitHub, etc.
    
    return NextResponse.json({
      success: true,
      message: 'Evidence sync started',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to start sync' },
      { status: 500 }
    );
  }
}
