/**
 * ASN Intelligence Module
 * Detects datacenter, VPN, hosting, and residential networks
 */

export interface AsnInfo {
  asnNumber: string;
  asnOrg: string;
  asnType: 'residential' | 'datacenter' | 'vpn' | 'hosting' | 'unknown';
  country?: string;
}

// Known datacenter ASNs
const DATACENTER_ASNS = new Set([
  'AS16509', // Amazon AWS
  'AS15169', // Google Cloud
  'AS8075',  // Microsoft Azure
  'AS14061', // DigitalOcean
  'AS24940', // Hetzner
  'AS16276', // OVH
  'AS20473', // Choopa/Vultr
  'AS396982', // Google Cloud
  'AS13335', // Cloudflare
  'AS46606', // Unified Layer (Bluehost)
  'AS19148', // Leaseweb
  'AS26496', // GoDaddy
]);

// Known VPN ASNs
const VPN_ASNS = new Set([
  'AS174',   // Cogent
  'AS8560',  // 1&1 Internet
  'AS63949', // Linode
  'AS395747', // Mullvad VPN
  'AS204601', // Private Internet Access
]);

// Known hosting provider ASNs
const HOSTING_ASNS = new Set([
  'AS26496', // GoDaddy
  'AS35908', // Keyweb AG
  'AS29873', // Biznet
  'AS42831', // UK Dedicated Servers
]);

/**
 * Lookup ASN information for an IP
 * In production, integrate with MaxMind GeoIP2 or ipinfo.io
 */
export async function lookupAsn(ip: string): Promise<AsnInfo> {
  // Stub implementation - in production, use actual ASN lookup
  // For now, detect based on IP patterns
  
  const asnInfo: AsnInfo = {
    asnNumber: 'AS0',
    asnOrg: 'Unknown',
    asnType: 'unknown',
  };

  // Detect common cloud provider IPs by pattern
  if (/^54\.|^52\.|^3\./.test(ip)) {
    return {
      asnNumber: 'AS16509',
      asnOrg: 'Amazon AWS',
      asnType: 'datacenter',
      country: 'US',
    };
  }

  if (/^35\.|^34\.|^104\./.test(ip)) {
    return {
      asnNumber: 'AS15169',
      asnOrg: 'Google Cloud',
      asnType: 'datacenter',
      country: 'US',
    };
  }

  if (/^13\.|^20\.|^40\.|^52\./.test(ip)) {
    return {
      asnNumber: 'AS8075',
      asnOrg: 'Microsoft Azure',
      asnType: 'datacenter',
      country: 'US',
    };
  }

  // Default to residential if no match
  return {
    asnNumber: 'AS0',
    asnOrg: 'Unknown ISP',
    asnType: 'residential',
  };
}

/**
 * Classify ASN type from ASN number
 */
export function classifyAsnType(asnNumber: string): AsnInfo['asnType'] {
  if (DATACENTER_ASNS.has(asnNumber)) return 'datacenter';
  if (VPN_ASNS.has(asnNumber)) return 'vpn';
  if (HOSTING_ASNS.has(asnNumber)) return 'hosting';
  return 'residential';
}

/**
 * Calculate ASN risk score (0-100)
 * Higher score = higher risk
 */
export function calculateAsnScore(asnInfo: AsnInfo, requestPath: string): number {
  let score = 0;

  // Datacenter accessing sensitive paths = high risk
  if (asnInfo.asnType === 'datacenter') {
    score += 30;
    
    // Extra risk if hitting login/admin paths
    if (/\/(login|admin|wp-admin|signin)/.test(requestPath)) {
      score += 20;
    }
  }

  // VPN = moderate risk
  if (asnInfo.asnType === 'vpn') {
    score += 25;
  }

  // Hosting provider = moderate risk
  if (asnInfo.asnType === 'hosting') {
    score += 15;
  }

  return Math.min(100, score);
}

/**
 * Get aggregated ASN statistics from database
 */
export async function getAsnStatistics(database: any, tenantId: number, hours: number = 24): Promise<any[]> {
  try {
    const results = await database.queryMany(
      `SELECT 
        asn_number,
        asn_org,
        asn_type,
        COUNT(*) as detection_count,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count
       FROM bot_detection_events
       WHERE 1=1 
         AND created_at >= NOW() - INTERVAL '${hours} hours'
         AND asn_number IS NOT NULL
       GROUP BY asn_number, asn_org, asn_type
       ORDER BY detection_count DESC
       LIMIT 20`,
      []
    );

    return results;
  } catch (error) {
    console.error('Error fetching ASN statistics:', error);
    return [];
  }
}

/**
 * Get top attacking datacenter ASNs
 */
export async function getTopDatacenterAsns(database: any, tenantId: number): Promise<any[]> {
  try {
    const results = await database.queryMany(
      `SELECT 
        asn_number,
        asn_org,
        COUNT(*) as attack_count,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count,
        AVG(confidence_score) as avg_confidence
       FROM bot_detection_events
       WHERE 1=1 
         AND asn_type = 'datacenter'
         AND created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY asn_number, asn_org
       ORDER BY attack_count DESC
       LIMIT 10`,
      []
    );

    return results;
  } catch (error) {
    console.error('Error fetching datacenter ASNs:', error);
    return [];
  }
}
