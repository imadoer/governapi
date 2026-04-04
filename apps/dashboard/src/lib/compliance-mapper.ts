/**
 * Maps real scan vulnerabilities to compliance framework requirements.
 * Every score, pass/fail, and evidence comes from actual scan data.
 */

/* ── Framework definitions with requirement → vulnerability mappings ── */

interface Requirement {
  id: string;
  name: string;
  description: string;
  mappedVulnTypes: string[]; // vulnerability_type values that cause FAIL
  passWhen: "absent"; // PASS when none of these vuln types exist
  remediation: string;
  severity: "critical" | "high" | "medium" | "low";
}

interface Framework {
  id: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  requirements: Requirement[];
}

export const FRAMEWORKS: Framework[] = [
  {
    id: "owasp-api",
    name: "OWASP API Security Top 10",
    shortName: "OWASP",
    category: "API Security",
    description: "Industry standard for API security risks",
    requirements: [
      {
        id: "A01", name: "Broken Object Level Authorization",
        description: "APIs should enforce object-level authorization checks on every endpoint that accesses a data source.",
        mappedVulnTypes: ["Information Disclosure", "Insecure CORS Configuration"],
        passWhen: "absent",
        remediation: "Implement per-object authorization checks. Verify CORS policy restricts access to trusted origins only.",
        severity: "critical",
      },
      {
        id: "A02", name: "Broken Authentication",
        description: "Authentication mechanisms must be properly implemented to prevent credential attacks.",
        mappedVulnTypes: ["Missing Authentication"],
        passWhen: "absent",
        remediation: "Implement strong authentication (OAuth 2.0, JWT) on all API endpoints. Use rate limiting on auth endpoints.",
        severity: "critical",
      },
      {
        id: "A04", name: "Unrestricted Resource Consumption",
        description: "APIs should limit the number of requests to prevent DoS attacks.",
        mappedVulnTypes: ["Missing Rate Limiting"],
        passWhen: "absent",
        remediation: "Implement rate limiting per client/IP. Set reasonable request size limits.",
        severity: "high",
      },
      {
        id: "A05", name: "Broken Function Level Authorization",
        description: "Complex access control policies with different roles and groups should be enforced.",
        mappedVulnTypes: ["Missing HSTS", "Missing CSP", "Missing X-Frame-Options"],
        passWhen: "absent",
        remediation: "Implement security headers (HSTS, CSP, X-Frame-Options) to prevent hijacking and injection attacks.",
        severity: "high",
      },
      {
        id: "A09", name: "Improper Inventory Management",
        description: "APIs should not expose implementation details that help attackers.",
        mappedVulnTypes: ["Information Disclosure", "Server Version Disclosure"],
        passWhen: "absent",
        remediation: "Remove server version headers. Don't expose stack traces or internal paths in error responses.",
        severity: "medium",
      },
    ],
  },
  {
    id: "pci-dss",
    name: "PCI DSS v4.0",
    shortName: "PCI DSS",
    category: "Payment Security",
    description: "Required for any API handling payment card data",
    requirements: [
      {
        id: "4.1", name: "Encrypt Data in Transit",
        description: "Strong cryptography must be used during transmission of cardholder data over open, public networks.",
        mappedVulnTypes: ["Missing HSTS"],
        passWhen: "absent",
        remediation: "Enable HSTS with max-age of at least 1 year. Ensure all API traffic uses TLS 1.2+.",
        severity: "critical",
      },
      {
        id: "6.5", name: "Address Common Coding Vulnerabilities",
        description: "Develop applications based on secure coding guidelines to prevent common vulnerabilities.",
        mappedVulnTypes: ["Missing CSP", "Missing X-Frame-Options", "Missing X-Content-Type-Options"],
        passWhen: "absent",
        remediation: "Implement all security headers: CSP, X-Frame-Options, X-Content-Type-Options.",
        severity: "high",
      },
      {
        id: "6.5.6", name: "Prevent Information Leakage",
        description: "Applications must not reveal internal implementation details.",
        mappedVulnTypes: ["Information Disclosure", "Server Version Disclosure"],
        passWhen: "absent",
        remediation: "Remove Server and X-Powered-By headers. Suppress detailed error messages in production.",
        severity: "medium",
      },
      {
        id: "6.5.10", name: "Broken Access Control",
        description: "Access to resources must be properly controlled and rate limited.",
        mappedVulnTypes: ["Missing Rate Limiting", "Insecure CORS Configuration"],
        passWhen: "absent",
        remediation: "Implement rate limiting and proper CORS policy. Restrict API access to authorized origins.",
        severity: "high",
      },
    ],
  },
  {
    id: "soc2",
    name: "SOC 2 Type II",
    shortName: "SOC 2",
    category: "Trust Services",
    description: "Security controls for SaaS and cloud service providers",
    requirements: [
      {
        id: "CC6.1", name: "Logical Access Security",
        description: "Logical access to information assets is restricted through authentication and authorization.",
        mappedVulnTypes: ["Missing Authentication", "Missing HSTS", "Missing CSP"],
        passWhen: "absent",
        remediation: "Implement authentication on all endpoints. Enable HSTS and CSP to prevent session hijacking.",
        severity: "high",
      },
      {
        id: "CC6.6", name: "System Boundaries",
        description: "System boundaries are protected against unauthorized access.",
        mappedVulnTypes: ["Insecure CORS Configuration", "Missing X-Frame-Options"],
        passWhen: "absent",
        remediation: "Configure CORS to allow only trusted origins. Set X-Frame-Options to prevent embedding.",
        severity: "high",
      },
      {
        id: "CC6.7", name: "Data Transmission Security",
        description: "Data transmitted between system components is encrypted.",
        mappedVulnTypes: ["Missing HSTS"],
        passWhen: "absent",
        remediation: "Enable HSTS to ensure all connections use HTTPS. Configure TLS 1.2+ as minimum.",
        severity: "critical",
      },
      {
        id: "CC7.2", name: "Security Monitoring",
        description: "The entity monitors system components for anomalies indicative of malicious acts.",
        mappedVulnTypes: ["Missing Rate Limiting"],
        passWhen: "absent",
        remediation: "Implement rate limiting and request monitoring. Set up alerts for anomalous traffic patterns.",
        severity: "medium",
      },
    ],
  },
  {
    id: "gdpr",
    name: "GDPR Article 32",
    shortName: "GDPR",
    category: "Data Privacy",
    description: "EU data protection requirements for APIs handling personal data",
    requirements: [
      {
        id: "Art32.1a", name: "Encryption of Personal Data",
        description: "Implement encryption of personal data in transit and at rest.",
        mappedVulnTypes: ["Missing HSTS"],
        passWhen: "absent",
        remediation: "Enable HSTS to enforce encrypted connections. Ensure TLS 1.2+ for all data transfers.",
        severity: "critical",
      },
      {
        id: "Art32.1b", name: "Ongoing Confidentiality",
        description: "Ensure ongoing confidentiality, integrity, and availability of processing systems.",
        mappedVulnTypes: ["Insecure CORS Configuration", "Information Disclosure"],
        passWhen: "absent",
        remediation: "Restrict CORS to trusted origins. Remove server information from response headers.",
        severity: "high",
      },
      {
        id: "Art32.1d", name: "Regular Testing",
        description: "Process for regularly testing and evaluating the effectiveness of security measures.",
        mappedVulnTypes: [], // PASS if they have recent scans
        passWhen: "absent",
        remediation: "Schedule regular security scans. Review and act on scan findings promptly.",
        severity: "medium",
      },
    ],
  },
  {
    id: "hipaa",
    name: "HIPAA Security Rule",
    shortName: "HIPAA",
    category: "Healthcare",
    description: "Required for APIs handling protected health information (PHI)",
    requirements: [
      {
        id: "164.312(d)", name: "Person or Entity Authentication",
        description: "Implement procedures to verify the identity of persons seeking access to ePHI.",
        mappedVulnTypes: ["Missing Authentication"],
        passWhen: "absent",
        remediation: "Implement strong authentication (OAuth 2.0, multi-factor) on all endpoints handling PHI.",
        severity: "critical",
      },
      {
        id: "164.312(e)", name: "Transmission Security",
        description: "Implement technical security measures to guard against unauthorized access to ePHI being transmitted.",
        mappedVulnTypes: ["Missing HSTS"],
        passWhen: "absent",
        remediation: "Enable HSTS and enforce TLS 1.2+. Encrypt all PHI in transit.",
        severity: "critical",
      },
      {
        id: "164.312(a)", name: "Access Control",
        description: "Implement technical policies to allow access only to authorized persons.",
        mappedVulnTypes: ["Insecure CORS Configuration", "Missing Rate Limiting"],
        passWhen: "absent",
        remediation: "Implement strict CORS policy and rate limiting. Use role-based access control.",
        severity: "high",
      },
    ],
  },
];

/* ── Assessment engine ── */

interface VulnSummary {
  type: string;
  severity: string;
  title: string;
  count: number;
}

interface RequirementResult {
  id: string;
  name: string;
  description: string;
  status: "pass" | "fail" | "warn";
  severity: string;
  evidence: string;
  remediation: string;
  relatedVulns: string[];
}

interface FrameworkAssessment {
  id: string;
  name: string;
  shortName: string;
  category: string;
  description: string;
  score: number;
  totalRequirements: number;
  passing: number;
  failing: number;
  requirements: RequirementResult[];
}

export function assessCompliance(
  vulnSummaries: VulnSummary[],
  hasRecentScans: boolean,
): FrameworkAssessment[] {
  const vulnTypes = new Set(vulnSummaries.map((v) => v.type));

  return FRAMEWORKS.map((framework) => {
    const results: RequirementResult[] = framework.requirements.map((req) => {
      // Special case: "Regular Testing" passes if there are recent scans
      if (req.mappedVulnTypes.length === 0) {
        return {
          id: req.id,
          name: req.name,
          description: req.description,
          status: hasRecentScans ? "pass" : "warn",
          severity: req.severity,
          evidence: hasRecentScans
            ? "Regular security scans are being performed"
            : "No recent security scans detected",
          remediation: req.remediation,
          relatedVulns: [],
        };
      }

      const matchingVulns = req.mappedVulnTypes.filter((t) => vulnTypes.has(t));

      if (matchingVulns.length === 0) {
        return {
          id: req.id,
          name: req.name,
          description: req.description,
          status: "pass" as const,
          severity: req.severity,
          evidence: "No related vulnerabilities found in scan results",
          remediation: req.remediation,
          relatedVulns: [],
        };
      }

      const relatedTitles = vulnSummaries
        .filter((v) => matchingVulns.includes(v.type))
        .map((v) => v.title);

      return {
        id: req.id,
        name: req.name,
        description: req.description,
        status: "fail" as const,
        severity: req.severity,
        evidence: `Found: ${relatedTitles.join(", ")}`,
        remediation: req.remediation,
        relatedVulns: matchingVulns,
      };
    });

    const passing = results.filter((r) => r.status === "pass").length;
    const failing = results.filter((r) => r.status === "fail").length;
    const total = results.length;
    const score = total > 0 ? Math.round((passing / total) * 100) : 0;

    return {
      id: framework.id,
      name: framework.name,
      shortName: framework.shortName,
      category: framework.category,
      description: framework.description,
      score,
      totalRequirements: total,
      passing,
      failing,
      requirements: results,
    };
  });
}

export const DISCLAIMER =
  "This assessment is based on automated external scanning and does not constitute a formal compliance audit or certification. For official certification, engage a qualified auditor. GovernAPI provides security monitoring tools — not legal or compliance advice.";
