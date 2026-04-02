export interface SecurityHeaderCheck {
  header: string;
  present: boolean;
  value?: string;
  recommendation: string;
  severity: "info" | "warning" | "error";
}

export class SecurityHeadersValidator {
  static validateSecurityHeaders(
    responseHeaders: Headers,
  ): SecurityHeaderCheck[] {
    const checks: SecurityHeaderCheck[] = [];

    // Content Security Policy
    const csp = responseHeaders.get("Content-Security-Policy");
    checks.push({
      header: "Content-Security-Policy",
      present: !!csp,
      value: csp || undefined,
      recommendation: csp ? "Present" : "Add CSP header to prevent XSS attacks",
      severity: csp ? "info" : "error",
    });

    // X-Frame-Options
    const frameOptions = responseHeaders.get("X-Frame-Options");
    checks.push({
      header: "X-Frame-Options",
      present: !!frameOptions,
      value: frameOptions || undefined,
      recommendation: frameOptions
        ? "Present"
        : "Add X-Frame-Options to prevent clickjacking",
      severity: frameOptions ? "info" : "warning",
    });

    // X-Content-Type-Options
    const contentTypeOptions = responseHeaders.get("X-Content-Type-Options");
    checks.push({
      header: "X-Content-Type-Options",
      present: !!contentTypeOptions,
      value: contentTypeOptions || undefined,
      recommendation: contentTypeOptions
        ? "Present"
        : "Add X-Content-Type-Options: nosniff",
      severity: contentTypeOptions ? "info" : "warning",
    });

    // Strict-Transport-Security
    const hsts = responseHeaders.get("Strict-Transport-Security");
    checks.push({
      header: "Strict-Transport-Security",
      present: !!hsts,
      value: hsts || undefined,
      recommendation: hsts
        ? "Present"
        : "Add HSTS header for HTTPS enforcement",
      severity: hsts ? "info" : "error",
    });

    // X-XSS-Protection
    const xssProtection = responseHeaders.get("X-XSS-Protection");
    checks.push({
      header: "X-XSS-Protection",
      present: !!xssProtection,
      value: xssProtection || undefined,
      recommendation: xssProtection ? "Present" : "Add X-XSS-Protection header",
      severity: xssProtection ? "info" : "warning",
    });

    return checks;
  }
}
