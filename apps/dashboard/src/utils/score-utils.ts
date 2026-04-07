/**
 * Shared scoring utilities: letter grades, impact scores, grade colors.
 */

export interface LetterGrade {
  letter: string;
  color: string;       // tailwind text color class
  bgColor: string;     // tailwind bg color class
  hex: string;         // hex for SVG / PDF
}

export function getLetterGrade(score: number): LetterGrade {
  if (score >= 90) return { letter: "A", color: "text-emerald-400", bgColor: "bg-emerald-500/15", hex: "#10b981" };
  if (score >= 80) return { letter: "B", color: "text-teal-400", bgColor: "bg-teal-500/15", hex: "#2dd4bf" };
  if (score >= 70) return { letter: "C", color: "text-yellow-400", bgColor: "bg-yellow-500/15", hex: "#eab308" };
  if (score >= 60) return { letter: "D", color: "text-orange-400", bgColor: "bg-orange-500/15", hex: "#f97316" };
  return { letter: "F", color: "text-red-400", bgColor: "bg-red-500/15", hex: "#ef4444" };
}

/**
 * Impact points map: how many points fixing a vulnerability type adds to score.
 * Keyed by vulnerability_type or title substring.
 */
const IMPACT_MAP: Record<string, number> = {
  "Missing HSTS": 5,
  "Missing CSP": 5,
  "Content-Security-Policy": 5,
  "Missing X-Frame-Options": 3,
  "X-Frame-Options": 3,
  "Missing X-Content-Type-Options": 2,
  "X-Content-Type-Options": 2,
  "Insecure CORS": 4,
  "CORS": 4,
  "Information Disclosure": 3,
  "Server Information Leak": 3,
  "Server Header": 3,
  "Missing Referrer-Policy": 2,
  "Missing Permissions-Policy": 2,
  "SSL": 5,
  "TLS": 5,
  "Certificate": 4,
  "Insecure Cookie": 3,
  "HttpOnly": 2,
  "Secure Flag": 2,
  "SQL Injection": 8,
  "XSS": 7,
  "Cross-Site Scripting": 7,
  "Authentication": 6,
  "Authorization": 6,
  "Rate Limiting": 3,
  "Open Redirect": 4,
  "SSRF": 6,
  "Path Traversal": 5,
  "Command Injection": 8,
};

/** Severity-based fallback points */
const SEVERITY_POINTS: Record<string, number> = {
  critical: 7,
  high: 5,
  medium: 3,
  low: 1,
};

/**
 * Calculate how many points the security score would increase
 * if a specific vulnerability is fixed.
 */
export function calcImpactPoints(vuln: { severity?: string; type?: string; title?: string; vulnerability_type?: string }): number {
  const vType = vuln.type || vuln.vulnerability_type || vuln.title || "";

  // Check exact match first, then substring match
  if (IMPACT_MAP[vType]) return IMPACT_MAP[vType];

  for (const [key, pts] of Object.entries(IMPACT_MAP)) {
    if (vType.toLowerCase().includes(key.toLowerCase())) return pts;
  }

  // Fallback to severity-based estimate
  const sev = (vuln.severity || "medium").toLowerCase();
  return SEVERITY_POINTS[sev] || 3;
}
