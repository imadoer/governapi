import crypto from 'crypto';

export interface FingerprintComponents {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  ipSubnet: string;
  secChUa?: string;
  viewport?: string;
}

export interface DeviceFingerprint {
  hash: string;
  components: FingerprintComponents;
  confidence: number;
  isUnique: boolean;
}

function maskIpToSubnet(ip: string): string {
  try {
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }

    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return `${parts.slice(0, 4).join(':')}::`;
      }
    }

    return ip;
  } catch (error) {
    return ip;
  }
}

function normalizeHeader(value: string | undefined): string {
  if (!value) return '';
  return value.trim().toLowerCase();
}

export function computeFingerprint(
  headers: Record<string, string>,
  sourceIp: string
): DeviceFingerprint {
  const components: FingerprintComponents = {
    userAgent: normalizeHeader(headers['user-agent'] || headers['User-Agent'] || 'unknown'),
    acceptLanguage: normalizeHeader(headers['accept-language'] || headers['Accept-Language'] || ''),
    acceptEncoding: normalizeHeader(headers['accept-encoding'] || headers['Accept-Encoding'] || ''),
    ipSubnet: maskIpToSubnet(sourceIp),
    secChUa: normalizeHeader(headers['sec-ch-ua'] || headers['Sec-CH-UA']),
  };

  const fingerprintString = [
    components.userAgent,
    components.acceptLanguage,
    components.acceptEncoding,
    components.ipSubnet,
    components.secChUa || '',
  ].join('|');

  const hash = crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex');

  const confidence = calculateFingerprintConfidence(components);

  return {
    hash,
    components,
    confidence,
    isUnique: confidence > 60,
  };
}

function calculateFingerprintConfidence(
  components: FingerprintComponents
): number {
  let score = 0;

  if (components.userAgent !== 'unknown' && components.userAgent.length > 20) {
    score += 30;
  } else if (components.userAgent !== 'unknown') {
    score += 15;
  }

  if (components.acceptLanguage && components.acceptLanguage.length > 0) {
    score += 25;
  }

  if (components.acceptEncoding && components.acceptEncoding.length > 0) {
    score += 20;
  }

  if (components.secChUa && components.secChUa.length > 0) {
    score += 25;
  }

  return Math.min(100, score);
}

export function compareFingerprints(
  fp1: DeviceFingerprint,
  fp2: DeviceFingerprint
): number {
  if (fp1.hash === fp2.hash) return 100;

  let matches = 0;
  let total = 0;

  if (fp1.components.userAgent === fp2.components.userAgent) matches++;
  total++;

  if (fp1.components.acceptLanguage === fp2.components.acceptLanguage) matches++;
  total++;

  if (fp1.components.acceptEncoding === fp2.components.acceptEncoding) matches++;
  total++;

  if (fp1.components.ipSubnet === fp2.components.ipSubnet) matches++;
  total++;

  return Math.round((matches / total) * 100);
}

export function computeFingerprintScore(
  fingerprint: DeviceFingerprint,
  recentFingerprints: DeviceFingerprint[]
): number {
  let score = 0;

  if (fingerprint.confidence < 40) score += 30;

  const matchingFingerprints = recentFingerprints.filter(
    fp => fp.hash === fingerprint.hash
  );

  if (matchingFingerprints.length > 10) score += 40;
  else if (matchingFingerprints.length > 5) score += 25;
  else if (matchingFingerprints.length > 2) score += 15;

  const ua = fingerprint.components.userAgent;
  if (ua === 'unknown' || ua.length === 0) score += 20;
  else if (ua.length < 20) score += 15;

  if (!fingerprint.components.acceptLanguage) score += 10;

  return Math.min(100, Math.round(score));
}

export async function storeFingerprintInDb(
  database: any,
  fingerprint: DeviceFingerprint,
  sourceIp: string
): Promise<void> {
  try {
    await database.query(
      `INSERT INTO bot_fingerprints 
        (fingerprint_hash, ip_address, user_agent, accept_language, first_seen, last_seen, detection_count)
      VALUES ($1, $2, $3, $4, NOW(), NOW(), 1)
      ON CONFLICT (fingerprint_hash) 
      DO UPDATE SET 
        last_seen = NOW(),
        detection_count = bot_fingerprints.detection_count + 1`,
      [
        fingerprint.hash,
        sourceIp,
        fingerprint.components.userAgent,
        fingerprint.components.acceptLanguage,
      ]
    );
  } catch (error) {
    console.error('Error storing fingerprint:', error);
  }
}

export async function getRecentFingerprints(
  database: any,
  sourceIp: string,
  hours: number = 24
): Promise<DeviceFingerprint[]> {
  try {
    const results = await database.queryMany(
      `SELECT fingerprint_hash, user_agent, accept_language, detection_count
       FROM bot_fingerprints
       WHERE ip_address = $1 
         AND last_seen >= NOW() - INTERVAL '${hours} hours'
       ORDER BY last_seen DESC
       LIMIT 50`,
      [sourceIp]
    );

    return results.map((row: any) => ({
      hash: row.fingerprint_hash,
      components: {
        userAgent: row.user_agent || '',
        acceptLanguage: row.accept_language || '',
        acceptEncoding: '',
        ipSubnet: maskIpToSubnet(sourceIp),
      },
      confidence: 50,
      isUnique: row.detection_count === 1,
    }));
  } catch (error) {
    console.error('Error fetching fingerprints:', error);
    return [];
  }
}
