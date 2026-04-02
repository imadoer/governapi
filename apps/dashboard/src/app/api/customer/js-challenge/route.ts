/**
 * JS Challenge API
 * Issues proof-of-work JavaScript challenges to verify legitimate browsers
 */

import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import crypto from "crypto";

interface ChallengeRequest {
  sourceIp: string;
}

interface Challenge {
  token: string;
  challengeData: string;
  expiresAt: number;
  script: string;
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
    const { sourceIp } = body;

    // Generate challenge
    const token = crypto.randomBytes(32).toString('hex');
    const challengeData = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

    // Store challenge in database
    await database.query(
      `INSERT INTO js_challenge_tokens 
        (token, tenant_id, source_ip, challenge_data, expires_at, created_at)
      VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0), NOW())`,
      [token, parseInt(tenantId), sourceIp, challengeData, expiresAt]
    );

    // Generate JavaScript challenge
    const script = generateChallengeScript(token, challengeData);

    const challenge: Challenge = {
      token,
      challengeData,
      expiresAt,
      script,
    };

    return NextResponse.json({
      success: true,
      challenge,
    });
  } catch (error) {
    console.error("JS Challenge creation error:", error);
    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }
}

/**
 * Generate proof-of-work JavaScript challenge
 */
function generateChallengeScript(token: string, challengeData: string): string {
  return `
(function() {
  const token = '${token}';
  const challenge = '${challengeData}';
  
  async function solveChallenge() {
    try {
      // Proof-of-work: Find a nonce that produces a hash starting with '00'
      let nonce = 0;
      let hash = '';
      
      while (!hash.startsWith('00')) {
        const data = challenge + nonce.toString();
        const msgBuffer = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        nonce++;
        
        // Limit iterations to prevent infinite loop
        if (nonce > 100000) break;
      }
      
      // Submit solution
      const response = await fetch('/api/customer/js-challenge/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': document.querySelector('meta[name="tenant-id"]')?.content || '1'
        },
        body: JSON.stringify({ 
          token: token, 
          solution: hash,
          nonce: nonce
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('JS Challenge passed');
        // Reload page or continue
        window.location.reload();
      }
    } catch (error) {
      console.error('Challenge failed:', error);
    }
  }
  
  // Execute challenge after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', solveChallenge);
  } else {
    solveChallenge();
  }
})();
  `.trim();
}

/**
 * Verify JS Challenge solution
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  const token = request.nextUrl.searchParams.get("token");
  
  if (!tenantId || !token) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  try {
    // Check if token exists and is not expired
    const challenge = await database.queryOne(
      `SELECT * FROM js_challenge_tokens
       WHERE token = $1
         AND tenant_id = $2
         AND expires_at > NOW()`,
      [token, parseInt(tenantId)]
    );

    if (!challenge) {
      return NextResponse.json(
        { error: "Challenge not found or expired" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      challenge: {
        token: challenge.token,
        expiresAt: new Date(challenge.expires_at).getTime(),
        solved: challenge.solved,
      },
    });
  } catch (error) {
    console.error("Challenge lookup error:", error);
    return NextResponse.json(
      { error: "Lookup failed" },
      { status: 500 }
    );
  }
}
