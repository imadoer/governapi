export interface IpInfo {
  ip: string;
  asn?: string;
  country?: string;
  isp?: string;
  isTor?: boolean;
  isDatacenter?: boolean;
  isVpn?: boolean;
}

export interface ReputationFactors {
  asnRisk: number;
  geoRisk: number;
  networkTypeRisk: number;
  userAgentRisk: number;
}

const HIGH_RISK_COUNTRIES = new Set([
  'CN', 'RU', 'KP', 'IR', 'SY', 'VE', 'CU'
]);

const MEDIUM_RISK_COUNTRIES = new Set([
  'IN', 'BR', 'TR', 'ID', 'VN', 'PK', 'NG'
]);

const DATACENTER_ASNS = new Set([
  'AS16509', 'AS15169', 'AS8075', 'AS14061',
  'AS24940', 'AS16276', 'AS20473', 'AS396982', 'AS13335',
]);

const VPN_ASNS = new Set([
  'AS174', 'AS8560', 'AS63949',
]);

export function computeReputationScore(
  request: { userAgent: string | null; headers: Record<string, string> },
  ipInfo: IpInfo
): number {
  const factors: ReputationFactors = {
    asnRisk: computeAsnRisk(ipInfo),
    geoRisk: computeGeoRisk(ipInfo),
    networkTypeRisk: computeNetworkTypeRisk(ipInfo),
    userAgentRisk: computeUserAgentRisk(request.userAgent, request.headers),
  };

  const totalScore = 
    factors.asnRisk +
    factors.geoRisk +
    factors.networkTypeRisk +
    factors.userAgentRisk;

  return Math.min(100, Math.round(totalScore));
}

function computeAsnRisk(ipInfo: IpInfo): number {
  if (!ipInfo.asn) return 0;
  if (ipInfo.isTor) return 30;
  if (DATACENTER_ASNS.has(ipInfo.asn)) return 20;
  if (VPN_ASNS.has(ipInfo.asn)) return 15;
  return 0;
}

function computeGeoRisk(ipInfo: IpInfo): number {
  if (!ipInfo.country) return 0;
  if (HIGH_RISK_COUNTRIES.has(ipInfo.country)) return 25;
  if (MEDIUM_RISK_COUNTRIES.has(ipInfo.country)) return 12;
  return 0;
}

function computeNetworkTypeRisk(ipInfo: IpInfo): number {
  let score = 0;
  if (ipInfo.isDatacenter) score += 15;
  if (ipInfo.isVpn) score += 10;
  return Math.min(25, score);
}

function computeUserAgentRisk(
  userAgent: string | null,
  headers: Record<string, string>
): number {
  if (!userAgent) return 20;

  let score = 0;
  if (userAgent.length < 20) score += 15;
  if (/^[A-Za-z0-9]{10,30}$/.test(userAgent)) score += 10;

  const knownBotPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i,
  ];

  if (knownBotPatterns.some(pattern => pattern.test(userAgent))) {
    score += 5;
  }

  const acceptLang = headers['accept-language'] || headers['Accept-Language'];
  if (!acceptLang || acceptLang === '') score += 5;

  return Math.min(20, score);
}

export async function lookupIpInfo(ip: string): Promise<IpInfo> {
  const ipInfo: IpInfo = {
    ip,
    asn: undefined,
    country: undefined,
    isp: undefined,
    isTor: await checkTorExitNode(ip),
    isDatacenter: isDatacenterIp(ip),
    isVpn: false,
  };
  return ipInfo;
}

async function checkTorExitNode(ip: string): Promise<boolean> {
  return false;
}

function isDatacenterIp(ip: string): boolean {
  const datacenterRanges = [
    /^54\./, /^35\./, /^13\..*\.amazonaws/, /^104\..*\.cloudflare/,
  ];
  return datacenterRanges.some(pattern => pattern.test(ip));
}

export function parseAsn(asnString: string | null): string | undefined {
  if (!asnString) return undefined;
  const match = asnString.match(/AS(\d+)/i);
  return match ? 'AS' + match[1] : undefined;
}
