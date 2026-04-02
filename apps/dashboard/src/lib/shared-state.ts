interface BlockData {
  reason: string;
  until: number;
  timestamp: string;
  threats: string[];
  duration: number;
}

// In-memory storage for blocked IPs with full data structure
const blockedIPs = new Map<string, BlockData>();

export async function setBlockedIP(
  ip: string,
  blockData: BlockData,
): Promise<void> {
  blockedIPs.set(ip, blockData);

  // Auto-cleanup expired blocks
  setTimeout(() => {
    const data = blockedIPs.get(ip);
    if (data && Date.now() >= data.until) {
      blockedIPs.delete(ip);
    }
  }, blockData.duration);
}

export async function getBlockedIP(ip: string): Promise<BlockData | undefined> {
  const data = blockedIPs.get(ip);

  // Return undefined if expired
  if (data && Date.now() >= data.until) {
    blockedIPs.delete(ip);
    return undefined;
  }

  return data;
}

export async function getAllBlockedIPs(): Promise<
  Array<{ ip: string } & BlockData>
> {
  const now = Date.now();
  const active: Array<{ ip: string } & BlockData> = [];

  // Filter out expired blocks
  for (const [ip, data] of Array.from(blockedIPs.entries())) {
    if (now < data.until) {
      active.push({ ip, ...data });
    } else {
      blockedIPs.delete(ip);
    }
  }

  return active;
}

export async function removeBlockedIP(ip: string): Promise<boolean> {
  return blockedIPs.delete(ip);
}

export async function clearBlockedIPs(): Promise<void> {
  blockedIPs.clear();
}

export async function isIPBlocked(ip: string): Promise<boolean> {
  const data = await getBlockedIP(ip);
  return data !== undefined;
}

export async function getBlockReason(ip: string): Promise<string | null> {
  const data = await getBlockedIP(ip);
  return data ? data.reason : null;
}

export async function getBlockExpiry(ip: string): Promise<number | null> {
  const data = await getBlockedIP(ip);
  return data ? data.until : null;
}

export async function extendBlock(
  ip: string,
  additionalDuration: number,
): Promise<boolean> {
  const data = blockedIPs.get(ip);
  if (!data) return false;

  data.until += additionalDuration;
  data.duration += additionalDuration;
  blockedIPs.set(ip, data);
  return true;
}
