import { ENV } from "./env-validation";

interface SecurityCheck {
  name: string;
  status: "pass" | "fail" | "warning";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
}

export class SecurityValidator {
  static async validateSecurityConfiguration(): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];

    if (ENV.NEXTAUTH_SECRET && ENV.NEXTAUTH_SECRET.length < 32) {
      checks.push({
        name: "NextAuth Secret Strength",
        status: "fail",
        message: "NextAuth secret should be at least 32 characters",
        severity: "high",
      });
    }

    return checks;
  }
}
