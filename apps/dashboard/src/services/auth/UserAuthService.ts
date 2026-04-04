import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { database } from "../../infrastructure/database";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: number;
  emailVerified?: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Company {
  id: number;
  companyName: string;
  domain?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  apiKey?: string;
  createdAt: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  company?: Company;
  sessionToken?: string;
  error?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  domain?: string;
}

export class UserAuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  static async register(data: RegisterData): Promise<AuthResult> {
    try {
      const { email, password, firstName, lastName, companyName, domain } =
        data;

      // Check if user already exists
      const existingUser = await database.queryOne(
        "SELECT id FROM users WHERE email = $1",
        [email.toLowerCase()],
      );

      if (existingUser) {
        return { success: false, error: "User already exists with this email" };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Generate secure API key
      const apiKey = `gapi_${crypto.randomUUID().replace(/-/g, "").substring(0, 32)}`;

      // Create company first
      const company = await database.queryOne(
        `INSERT INTO companies (company_name, subscription_plan, subscription_status, api_key, created_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [companyName, "starter", "active", apiKey],
      );

      if (!company) {
        return { success: false, error: "Failed to create company account" };
      }

      // Create user
      const user = await database.queryOne(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
        [
          email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          "admin",
          company.id,
        ],
      );

      if (!user) {
        return { success: false, error: "Failed to create user account" };
      }

      // Create session
      const sessionToken = await this.createSession(user.id);

      return {
        success: true,
        user: this.formatUser(user),
        company: this.formatCompany(company),
        sessionToken,
      };
    } catch (error) {
      console.error("Registration error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Registration failed"
      };
    }
  }

  static async login(email: string, password: string): Promise<AuthResult> {
    try {
      const userData = await database.queryOne(
        `SELECT u.*, c.company_name, c.subscription_plan, c.subscription_status, c.api_key, c.created_at as company_created_at
         FROM users u
         JOIN companies c ON u.company_id = c.id
         WHERE u.email = $1`,
        [email.toLowerCase()],
      );

      if (
        !userData ||
        !(await bcrypt.compare(password, userData.password_hash))
      ) {
        return { success: false, error: "Invalid email or password" };
      }

      // Update last login
      await database.query(
        "UPDATE users SET last_login = NOW() WHERE id = $1",
        [userData.id],
      );

      // Create session
      const sessionToken = await this.createSession(userData.id);

      return {
        success: true,
        user: this.formatUser(userData),
        company: this.formatCompany(userData),
        sessionToken,
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed" };
    }
  }

  static async validateSession(sessionToken: string): Promise<AuthResult> {
    try {
      const session = await database.queryOne(
        `SELECT s.*, u.*, c.company_name, c.subscription_plan, c.subscription_status, c.api_key, c.created_at as company_created_at
         FROM user_sessions s
         JOIN users u ON s.user_id = u.id
         JOIN companies c ON u.company_id = c.id
         WHERE s.session_token = $1 AND s.expires_at > NOW()`,
        [sessionToken],
      );

      console.log("Session query result:", session);
      if (!session) {
        return { success: false, error: "Invalid or expired session" };
      }

      return {
        success: true,
        user: this.formatUser(session),
        company: this.formatCompany(session),
        sessionToken,
      };
    } catch (error) {
      console.error("Session validation error:", error);
      return { success: false, error: "Session validation failed" };
    }
  }

  static async logout(sessionToken: string): Promise<boolean> {
    try {
      await database.query(
        "DELETE FROM user_sessions WHERE session_token = $1",
        [sessionToken],
      );
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  }

  private static async createSession(userId: number): Promise<string> {
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

    await database.query(
      `INSERT INTO user_sessions (user_id, session_token, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, sessionToken, expiresAt.toISOString()],
    );

    return sessionToken;
  }

  private static formatUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      companyId: user.company_id,
      emailVerified: user.email_verified,
      lastLogin: user.last_login,
      createdAt: user.created_at,
    };
  }

  private static formatCompany(company: any): Company {
    return {
      id: company.company_id || company.id,
      companyName: company.company_name,
      domain: company.domain,
      subscriptionPlan: company.subscription_plan,
      subscriptionStatus: company.subscription_status,
      apiKey: company.api_key,
      createdAt: company.created_at || company.company_created_at,
    };
  }
}
