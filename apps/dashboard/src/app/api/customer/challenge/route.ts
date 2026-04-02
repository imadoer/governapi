import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import crypto from "crypto";

interface ChallengeRequest {
  type: 'js' | 'captcha';
  sourceIp: string;
}

interface ChallengeToken {
  token: string;
  type: 'js' | 'captcha';
  expiresAt: number;
  sourceIp: string;
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json() as ChallengeRequest;
    const { type, sourceIp } = body;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (5 * 60 * 1000);

    await database.query(
      `INSERT INTO bot_challenges 
        (token, tenant_id, source_ip, challenge_type, expires_at, created_at)
      VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0), NOW())`,
      [token, parseInt(tenantId), sourceIp, type, expiresAt]
    );

    const challengeData: ChallengeToken = {
      token,
      type,
      expiresAt,
      sourceIp,
    };

    if (type === 'js') {
      return NextResponse.json({
        success: true,
        challenge: {
          ...challengeData,
          script: generateJsChallenge(token),
        },
      });
    } else if (type === 'captcha') {
      return NextResponse.json({
        success: true,
        challenge: {
          ...challengeData,
          captchaUrl: `/api/customer/challenge/captcha?token=${token}`,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid challenge type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Challenge creation error:", error);
    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }
}

function generateJsChallenge(token: string): string {
  const challenge = crypto.randomBytes(16).toString('hex');
  
  return `(function() {
    const token = '${token}';
    const challenge = '${challenge}';
    
    async function solveChallenge() {
      const data = token + challenge + Date.now();
      const msgBuffer = new TextEncoder().encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      fetch('/api/customer/challenge/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, solution: hashHex })
      });
    }
    
    solveChallenge();
  })();`;
}
